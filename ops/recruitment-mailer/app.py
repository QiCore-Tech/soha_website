#!/usr/bin/env python3
"""QiCore recruitment acknowledgement mail worker.

The worker polls the Feishu Base application table, sends acknowledgements through
the internal SMTP relay, and writes delivery state back to the Base record.
Only Python's standard library is used so the runtime stays small and predictable.
"""

from __future__ import annotations

import argparse
import hashlib
import html
import json
import logging
import os
import re
import signal
import smtplib
import sqlite3
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from email.message import EmailMessage
from email.utils import formataddr, make_msgid, parseaddr
from pathlib import Path
from typing import Any


LOG = logging.getLogger("qicore-recruitment-mailer")
STOP = False


def env_required(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def env_int(name: str, default: int) -> int:
    value = os.getenv(name, "").strip()
    return int(value) if value else default


@dataclass(frozen=True)
class Config:
    app_id: str
    app_secret: str
    base_token: str
    table_id: str
    start_from_ms: int
    poll_seconds: int
    smtp_host: str
    smtp_port: int
    from_name: str
    from_address: str
    reply_to: str
    db_path: str
    heartbeat_path: str
    max_attempts: int

    @classmethod
    def load(cls) -> "Config":
        return cls(
            app_id=env_required("FEISHU_APP_ID"),
            app_secret=env_required("FEISHU_APP_SECRET"),
            base_token=env_required("FEISHU_CAREERS_BASE_TOKEN"),
            table_id=env_required("FEISHU_APPLICATION_TABLE_ID"),
            start_from_ms=env_int("START_FROM_MS", int(time.time() * 1000)),
            poll_seconds=max(10, env_int("POLL_SECONDS", 30)),
            smtp_host=os.getenv("SMTP_HOST", "qicore-mail-relay").strip(),
            smtp_port=env_int("SMTP_PORT", 25),
            from_name=os.getenv("MAIL_FROM_NAME", "QiCore 招聘").strip(),
            from_address=os.getenv("MAIL_FROM_ADDRESS", "noreply@qicore.tech").strip(),
            reply_to=os.getenv("MAIL_REPLY_TO", "hr@qicore.ai").strip(),
            db_path=os.getenv("DB_PATH", "/data/state.sqlite3").strip(),
            heartbeat_path=os.getenv("HEARTBEAT_PATH", "/data/heartbeat").strip(),
            max_attempts=max(1, env_int("MAX_ATTEMPTS", 5)),
        )


class FeishuClient:
    def __init__(self, config: Config) -> None:
        self.config = config
        self._token = ""
        self._token_expires_at = 0.0

    def _tenant_token(self) -> str:
        if self._token and time.time() < self._token_expires_at - 120:
            return self._token

        payload = json.dumps(
            {"app_id": self.config.app_id, "app_secret": self.config.app_secret}
        ).encode("utf-8")
        req = urllib.request.Request(
            "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        data = self._request_json(req, authenticated=False)
        token = data.get("tenant_access_token")
        if not token:
            raise RuntimeError(f"Feishu token response missing token: code={data.get('code')}")
        self._token = str(token)
        self._token_expires_at = time.time() + int(data.get("expire", 7200))
        return self._token

    def _request_json(
        self, req: urllib.request.Request, *, authenticated: bool = True
    ) -> dict[str, Any]:
        if authenticated:
            req.add_header("Authorization", f"Bearer {self._tenant_token()}")
        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                body = response.read().decode("utf-8")
        except urllib.error.HTTPError as exc:
            body = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"Feishu HTTP {exc.code}: {body[:500]}") from exc
        except urllib.error.URLError as exc:
            raise RuntimeError(f"Feishu request failed: {exc.reason}") from exc

        data = json.loads(body)
        if data.get("code", 0) != 0:
            raise RuntimeError(
                f"Feishu API error code={data.get('code')} msg={data.get('msg')}"
            )
        return data

    def list_applications(self) -> list[dict[str, Any]]:
        records: list[dict[str, Any]] = []
        page_token = ""
        while True:
            query = {"page_size": "100"}
            if page_token:
                query["page_token"] = page_token
            url = (
                "https://open.feishu.cn/open-apis/bitable/v1/apps/"
                f"{urllib.parse.quote(self.config.base_token, safe='')}/tables/"
                f"{urllib.parse.quote(self.config.table_id, safe='')}/records?"
                + urllib.parse.urlencode(query)
            )
            req = urllib.request.Request(url, method="GET")
            data = self._request_json(req).get("data", {})
            records.extend(data.get("items", []))
            if not data.get("has_more"):
                return records
            page_token = str(data.get("page_token", ""))

    def update_application(self, record_id: str, fields: dict[str, Any]) -> None:
        url = (
            "https://open.feishu.cn/open-apis/bitable/v1/apps/"
            f"{urllib.parse.quote(self.config.base_token, safe='')}/tables/"
            f"{urllib.parse.quote(self.config.table_id, safe='')}/records/"
            f"{urllib.parse.quote(record_id, safe='')}"
        )
        payload = json.dumps({"fields": fields}, ensure_ascii=False).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=payload,
            headers={"Content-Type": "application/json"},
            method="PUT",
        )
        self._request_json(req)


class DeliveryStore:
    def __init__(self, path: str) -> None:
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        self.db = sqlite3.connect(path)
        self.db.row_factory = sqlite3.Row
        self.db.execute("PRAGMA journal_mode=WAL")
        self.db.execute(
            """
            CREATE TABLE IF NOT EXISTS deliveries (
                record_id TEXT PRIMARY KEY,
                recipient TEXT NOT NULL,
                status TEXT NOT NULL,
                message_id TEXT,
                attempts INTEGER NOT NULL DEFAULT 0,
                last_error TEXT,
                created_at INTEGER NOT NULL,
                sent_at INTEGER
            )
            """
        )
        self.db.commit()

    def get(self, record_id: str) -> sqlite3.Row | None:
        return self.db.execute(
            "SELECT * FROM deliveries WHERE record_id = ?", (record_id,)
        ).fetchone()

    def ensure_pending(self, record_id: str, recipient: str) -> sqlite3.Row:
        recipient_digest = hashlib.sha256(recipient.encode("utf-8")).hexdigest()
        self.db.execute(
            """
            INSERT OR IGNORE INTO deliveries
                (record_id, recipient, status, created_at)
            VALUES (?, ?, 'pending', ?)
            """,
            (record_id, recipient_digest, int(time.time() * 1000)),
        )
        self.db.commit()
        row = self.get(record_id)
        assert row is not None
        return row

    def mark_sent(self, record_id: str, message_id: str, sent_at: int) -> None:
        self.db.execute(
            """
            UPDATE deliveries
            SET status='sent', message_id=?, sent_at=?, last_error=NULL
            WHERE record_id=?
            """,
            (message_id, sent_at, record_id),
        )
        self.db.commit()

    def mark_failure(self, record_id: str, error: str) -> int:
        self.db.execute(
            """
            UPDATE deliveries
            SET status='pending', attempts=attempts+1, last_error=?
            WHERE record_id=?
            """,
            (error[:1000], record_id),
        )
        self.db.commit()
        row = self.get(record_id)
        assert row is not None
        return int(row["attempts"])


def field_text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, list):
        parts: list[str] = []
        for item in value:
            if isinstance(item, dict):
                parts.append(str(item.get("text") or item.get("name") or ""))
            else:
                parts.append(str(item))
        return " ".join(part for part in parts if part).strip()
    if isinstance(value, dict):
        return str(value.get("text") or value.get("name") or "").strip()
    return str(value).strip()


def valid_email(address: str) -> bool:
    parsed = parseaddr(address)[1]
    if parsed != address or "\n" in address or "\r" in address:
        return False
    return bool(re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", address))


def safe_error(error: Exception) -> str:
    message = str(error).replace("\r", " ").replace("\n", " ")
    message = re.sub(
        r"(?i)[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9.-]+\.[a-z]{2,}",
        "[redacted-email]",
        message,
    )
    return message[:1000]


def safe_inline(value: str, fallback: str) -> str:
    value = re.sub(r"[\r\n]+", " ", value).strip()
    return value[:120] if value else fallback


def build_message(
    config: Config,
    *,
    recipient: str,
    candidate_name: str,
    role_name: str,
    message_id: str | None = None,
    is_test: bool = False,
) -> EmailMessage:
    name = safe_inline(candidate_name, "你好")
    role = safe_inline(role_name, "相关岗位")
    msg = EmailMessage()
    msg["Subject"] = "QiCore 招聘邮件服务测试" if is_test else "我们已收到你的投递｜QiCore 招聘"
    msg["From"] = formataddr((config.from_name, config.from_address))
    msg["To"] = recipient
    msg["Reply-To"] = config.reply_to
    msg["Message-ID"] = message_id or make_msgid(domain="qicore.tech")
    msg["Auto-Submitted"] = "auto-generated"

    if is_test:
        plain = (
            "这是一封 QiCore 招聘邮件服务测试邮件。\n\n"
            "发送链路：招聘邮件服务 → QiCore 内部邮件中继 → 飞书邮箱。\n"
            "收到此邮件说明服务部署和邮件投递链路正常。\n\n"
            "QiCore 招聘团队\n"
            f"{config.reply_to}"
        )
        body = (
            "<p>这是一封 <strong>QiCore 招聘邮件服务测试邮件</strong>。</p>"
            "<p>发送链路：招聘邮件服务 → QiCore 内部邮件中继 → 飞书邮箱。</p>"
            "<p>收到此邮件说明服务部署和邮件投递链路正常。</p>"
        )
    else:
        plain = (
            f"{name}，你好！\n\n"
            f"我们已收到你对「{role}」岗位的申请，材料现已进入招聘流程。\n\n"
            "我们会认真阅读你的经历与作品。若与当前岗位匹配，招聘团队会通过你填写的邮箱或电话联系你。\n\n"
            f"你无需重复投递。如需补充材料或更正信息，请发送至 {config.reply_to}。\n\n"
            "感谢你关注 QiCore，也感谢你愿意和我们一起，把想法做成产品。\n\n"
            "QiCore 招聘团队\n"
            f"{config.reply_to}"
        )
        body = (
            f"<p>{html.escape(name)}，你好！</p>"
            f"<p>我们已收到你对「<strong>{html.escape(role)}</strong>」岗位的申请，材料现已进入招聘流程。</p>"
            "<p>我们会认真阅读你的经历与作品。若与当前岗位匹配，招聘团队会通过你填写的邮箱或电话联系你。</p>"
            f"<p>你无需重复投递。如需补充材料或更正信息，请发送至 <a href=\"mailto:{html.escape(config.reply_to)}\" style=\"color:#4e6254;\">{html.escape(config.reply_to)}</a>。</p>"
            "<p>感谢你关注 QiCore，也感谢你愿意和我们一起，把想法做成产品。</p>"
        )

    html_body = f"""<!doctype html>
<html lang="zh-CN">
  <body style="margin:0;background:#f4f3ef;color:#242320;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif;">
    <div style="max-width:620px;margin:0 auto;padding:32px 18px;">
      <div style="background:#fbfaf7;border:1px solid #dedbd4;border-radius:14px;overflow:hidden;">
        <div style="padding:22px 30px 18px;border-bottom:1px solid #e8e5df;">
          <span style="font-size:17px;font-weight:700;letter-spacing:.01em;">QiCore Technology</span>
          <span style="float:right;margin-top:6px;color:#8c887f;font-size:11px;letter-spacing:.16em;">RECRUITING</span>
        </div>
        <div style="padding:30px;">
          <div style="font-size:16px;line-height:1.85;">{body}</div>
          <div style="border-top:1px solid #e8e5df;margin-top:30px;padding-top:20px;color:#737069;font-size:14px;line-height:1.7;">
            QiCore 招聘团队<br>
            <a href="mailto:{html.escape(config.reply_to)}" style="color:#4e6254;">{html.escape(config.reply_to)}</a><br>
            <span style="font-size:12px;color:#918d85;">本邮件由系统自动发送，用于确认我们已收到你的投递。</span>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>"""
    msg.set_content(plain)
    msg.add_alternative(html_body, subtype="html")
    return msg


def smtp_send(config: Config, message: EmailMessage) -> None:
    with smtplib.SMTP(config.smtp_host, config.smtp_port, timeout=30) as smtp:
        smtp.ehlo()
        smtp.send_message(message)


def record_created_ms(record: dict[str, Any]) -> int:
    raw = record.get("created_time")
    if raw is None:
        raw = (record.get("fields") or {}).get("投递时间")
    try:
        value = int(raw)
    except (TypeError, ValueError):
        return 0
    return value * 1000 if value < 10_000_000_000 else value


def process_once(config: Config, client: FeishuClient, store: DeliveryStore) -> None:
    records = client.list_applications()
    LOG.info("Scanned %d application records", len(records))
    for record in records:
        record_id = str(record.get("record_id", ""))
        fields = record.get("fields") or {}
        if not record_id or record_created_ms(record) < config.start_from_ms:
            continue

        base_status = field_text(fields.get("确认邮件状态"))
        if base_status in {"已发送", "无需发送"}:
            continue

        recipient = field_text(fields.get("联系邮箱")).lower()
        if not valid_email(recipient):
            reason = "邮箱格式不正确，请核对后重新提交或由 HR 修正"
            try:
                client.update_application(
                    record_id,
                    {
                        "确认邮件状态": "发送失败",
                        "确认邮件失败原因": reason,
                    },
                )
            except Exception:  # noqa: BLE001
                LOG.exception("Could not write invalid-email state record=%s", record_id)
            LOG.warning("Skipped invalid recipient record=%s", record_id)
            continue

        stored = store.ensure_pending(record_id, recipient)
        if stored["status"] != "sent" and stored["sent_at"] and stored["message_id"]:
            # A previous SMTP delivery succeeded but its Base status update failed.
            # Recover the durable sent state before doing anything that could resend.
            store.mark_sent(record_id, str(stored["message_id"]), int(stored["sent_at"]))
            stored = store.get(record_id)
            assert stored is not None
        if stored["status"] == "sent":
            try:
                client.update_application(
                    record_id,
                    {
                        "确认邮件状态": "已发送",
                        "确认邮件发送时间": int(stored["sent_at"]),
                        "确认邮件 Message ID": str(stored["message_id"] or ""),
                        "确认邮件失败原因": "",
                    },
                )
            except Exception as exc:  # noqa: BLE001
                LOG.error(
                    "Base delivery-state sync failed record=%s error=%s",
                    record_id,
                    safe_error(exc),
                )
            continue
        if int(stored["attempts"]) >= config.max_attempts:
            continue

        message_id = make_msgid(domain="qicore.tech")
        message = build_message(
            config,
            recipient=recipient,
            candidate_name=field_text(fields.get("姓名")),
            role_name=field_text(fields.get("应聘岗位")),
            message_id=message_id,
        )
        try:
            smtp_send(config, message)
        except Exception as exc:  # noqa: BLE001 - SMTP failures may be retried
            error_message = safe_error(exc)
            attempts = store.mark_failure(record_id, error_message)
            LOG.error(
                "Acknowledgement failed record=%s attempt=%d/%d error=%s",
                record_id,
                attempts,
                config.max_attempts,
                error_message,
            )
            if attempts >= config.max_attempts:
                try:
                    client.update_application(
                        record_id,
                        {
                            "确认邮件状态": "发送失败",
                            "确认邮件失败原因": error_message,
                        },
                    )
                except Exception:  # noqa: BLE001
                    LOG.exception("Could not write final failure to Base record=%s", record_id)
            continue

        sent_at = int(time.time() * 1000)
        store.mark_sent(record_id, message_id, sent_at)
        try:
            client.update_application(
                record_id,
                {
                    "确认邮件状态": "已发送",
                    "确认邮件发送时间": sent_at,
                    "确认邮件 Message ID": message_id,
                    "确认邮件失败原因": "",
                },
            )
            LOG.info("Acknowledgement accepted for record=%s", record_id)
        except Exception as exc:  # noqa: BLE001 - never retry SMTP after acceptance
            LOG.error(
                "Acknowledgement sent but Base sync failed record=%s error=%s",
                record_id,
                safe_error(exc),
            )


def write_heartbeat(path: str) -> None:
    heartbeat = Path(path)
    heartbeat.parent.mkdir(parents=True, exist_ok=True)
    heartbeat.touch()


def handle_stop(_signum: int, _frame: Any) -> None:
    global STOP
    STOP = True


def run_worker(config: Config, *, once: bool) -> None:
    client = FeishuClient(config)
    store = DeliveryStore(config.db_path)
    while not STOP:
        try:
            process_once(config, client, store)
        except Exception:  # noqa: BLE001
            LOG.exception("Polling cycle failed")
        write_heartbeat(config.heartbeat_path)
        if once:
            return
        for _ in range(config.poll_seconds):
            if STOP:
                return
            time.sleep(1)


def send_test(config: Config, recipient: str) -> None:
    if not valid_email(recipient):
        raise RuntimeError("Invalid test recipient")
    message = build_message(
        config,
        recipient=recipient,
        candidate_name="测试收件人",
        role_name="测试岗位",
        is_test=True,
    )
    smtp_send(config, message)
    LOG.info("Test email accepted message_id=%s", message["Message-ID"])


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--once", action="store_true", help="Run one polling cycle")
    parser.add_argument("--test-email", help="Send one explicit test email and exit")
    args = parser.parse_args()

    logging.basicConfig(
        level=os.getenv("LOG_LEVEL", "INFO").upper(),
        format="%(asctime)s %(levelname)s %(message)s",
    )
    config = Config.load()
    signal.signal(signal.SIGTERM, handle_stop)
    signal.signal(signal.SIGINT, handle_stop)
    if args.test_email:
        send_test(config, args.test_email.strip().lower())
    else:
        run_worker(config, once=args.once)
    return 0


if __name__ == "__main__":
    sys.exit(main())
