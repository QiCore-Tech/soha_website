#!/usr/bin/env python3
"""Import new applications from a Feishu public mailbox into Feishu Base.

The worker intentionally treats mail bodies and attachments as untrusted input.
It never executes attachments, only extracts text from PDFs in memory and copies
allowed attachment types into the private recruitment Base.
"""

from __future__ import annotations

import base64
import hashlib
import html
import io
import json
import logging
import os
import re
import sqlite3
import tempfile
import time
import urllib.parse
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import requests
from pypdf import PdfReader


LOG = logging.getLogger("qicore-recruitment-mail-importer")
SAFE_EXTENSIONS = {".pdf", ".doc", ".docx", ".zip"}
PHONE_RE = re.compile(r"(?<!\d)(1[3-9]\d{9})(?!\d)")
EMAIL_RE = re.compile(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", re.I)
CHINESE_NAME_RE = re.compile(r"([\u4e00-\u9fff]{2,4})")
BLOCKED_SENDER_PREFIXES = {
    "noreply",
    "no-reply",
    "do-not-reply",
    "mailer-daemon",
    "notification",
    "notifications",
}
BLOCKED_SENDER_DOMAINS = {"qicore.ai", "qicore.tech"}


def required(name: str) -> str:
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
    mailbox: str
    base_token: str
    table_id: str
    attachment_field_id: str
    poll_seconds: int
    initial_start_ms: int
    db_path: str
    heartbeat_path: str
    max_attachment_bytes: int

    @classmethod
    def load(cls) -> "Config":
        return cls(
            app_id=required("FEISHU_APP_ID"),
            app_secret=required("FEISHU_APP_SECRET"),
            mailbox=os.getenv("FEISHU_RECRUITMENT_MAILBOX", "hr@qicore.ai").strip(),
            base_token=required("FEISHU_CAREERS_BASE_TOKEN"),
            table_id=required("FEISHU_APPLICATION_TABLE_ID"),
            attachment_field_id=required("FEISHU_RESUME_ATTACHMENT_FIELD_ID"),
            poll_seconds=max(60, env_int("POLL_SECONDS", 300)),
            initial_start_ms=env_int("IMPORT_START_FROM_MS", int(time.time() * 1000)),
            db_path=os.getenv("DB_PATH", "/data/state.sqlite3").strip(),
            heartbeat_path=os.getenv("HEARTBEAT_PATH", "/data/heartbeat").strip(),
            max_attachment_bytes=max(
                1_000_000, env_int("MAX_ATTACHMENT_BYTES", 50 * 1024 * 1024)
            ),
        )


class StateStore:
    def __init__(self, path: str, initial_start_ms: int) -> None:
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        self.db = sqlite3.connect(path)
        self.db.row_factory = sqlite3.Row
        self.db.execute("PRAGMA journal_mode=WAL")
        self.db.executescript(
            """
            CREATE TABLE IF NOT EXISTS metadata (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS imports (
                message_id TEXT PRIMARY KEY,
                smtp_message_id TEXT NOT NULL,
                record_id TEXT,
                internal_date_ms INTEGER NOT NULL,
                status TEXT NOT NULL,
                last_error TEXT,
                updated_at_ms INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS imported_attachments (
                message_id TEXT NOT NULL,
                attachment_id TEXT NOT NULL,
                PRIMARY KEY (message_id, attachment_id)
            );
            """
        )
        self.db.execute(
            "INSERT OR IGNORE INTO metadata(key, value) VALUES('watermark_ms', ?)",
            (str(initial_start_ms),),
        )
        self.db.commit()

    def watermark(self) -> int:
        row = self.db.execute(
            "SELECT value FROM metadata WHERE key='watermark_ms'"
        ).fetchone()
        return int(row["value"])

    def set_watermark(self, value: int) -> None:
        self.db.execute(
            "UPDATE metadata SET value=? WHERE key='watermark_ms'", (str(value),)
        )
        self.db.commit()

    def get_import(self, message_id: str) -> sqlite3.Row | None:
        return self.db.execute(
            "SELECT * FROM imports WHERE message_id=?", (message_id,)
        ).fetchone()

    def save_import(
        self,
        message_id: str,
        smtp_message_id: str,
        internal_date_ms: int,
        status: str,
        record_id: str | None = None,
        error: str | None = None,
    ) -> None:
        self.db.execute(
            """
            INSERT INTO imports(
                message_id, smtp_message_id, record_id, internal_date_ms,
                status, last_error, updated_at_ms
            ) VALUES(?,?,?,?,?,?,?)
            ON CONFLICT(message_id) DO UPDATE SET
                smtp_message_id=excluded.smtp_message_id,
                record_id=COALESCE(excluded.record_id, imports.record_id),
                status=excluded.status,
                last_error=excluded.last_error,
                updated_at_ms=excluded.updated_at_ms
            """,
            (
                message_id,
                smtp_message_id,
                record_id,
                internal_date_ms,
                status,
                error,
                int(time.time() * 1000),
            ),
        )
        self.db.commit()

    def attachment_done(self, message_id: str, attachment_id: str) -> bool:
        return (
            self.db.execute(
                "SELECT 1 FROM imported_attachments WHERE message_id=? AND attachment_id=?",
                (message_id, attachment_id),
            ).fetchone()
            is not None
        )

    def mark_attachment_done(self, message_id: str, attachment_id: str) -> None:
        self.db.execute(
            "INSERT OR IGNORE INTO imported_attachments(message_id, attachment_id) VALUES(?,?)",
            (message_id, attachment_id),
        )
        self.db.commit()

    def close(self) -> None:
        self.db.close()


class FeishuClient:
    def __init__(self, config: Config) -> None:
        self.config = config
        self.session = requests.Session()
        self._token = ""
        self._expires_at = 0.0

    def token(self) -> str:
        if self._token and time.time() < self._expires_at - 120:
            return self._token
        response = self.session.post(
            "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
            json={"app_id": self.config.app_id, "app_secret": self.config.app_secret},
            timeout=30,
        )
        response.raise_for_status()
        data = response.json()
        if data.get("code", 0) != 0 or not data.get("tenant_access_token"):
            raise RuntimeError(f"Feishu token error code={data.get('code')}")
        self._token = str(data["tenant_access_token"])
        self._expires_at = time.time() + int(data.get("expire", 7200))
        return self._token

    def request(self, method: str, path: str, **kwargs: Any) -> dict[str, Any]:
        headers = dict(kwargs.pop("headers", {}))
        headers["Authorization"] = f"Bearer {self.token()}"
        response = self.session.request(
            method,
            f"https://open.feishu.cn{path}",
            headers=headers,
            timeout=60,
            **kwargs,
        )
        if not response.ok:
            try:
                error = response.json()
                code = error.get("code")
                message = re.sub(r"https?://\S+", "[link omitted]", str(error.get("msg", "")))
                raise RuntimeError(
                    f"Feishu HTTP {response.status_code} code={code}: {message[:220]}"
                )
            except (ValueError, AttributeError):
                raise RuntimeError(f"Feishu HTTP {response.status_code}") from None
        data = response.json()
        if data.get("code", 0) != 0:
            raise RuntimeError(
                f"Feishu API error code={data.get('code')} msg={data.get('msg')}"
            )
        return data

    def list_message_ids(self) -> list[str]:
        result: list[str] = []
        page_token = ""
        mailbox = urllib.parse.quote(self.config.mailbox, safe="")
        while True:
            params: dict[str, Any] = {"page_size": 20, "folder_id": "INBOX"}
            if page_token:
                params["page_token"] = page_token
            data = self.request(
                "GET",
                f"/open-apis/mail/v1/user_mailboxes/{mailbox}/messages",
                params=params,
            ).get("data", {})
            result.extend(str(item) for item in data.get("items", []))
            if not data.get("has_more"):
                return result
            page_token = str(data.get("page_token", ""))

    def get_message(self, message_id: str) -> dict[str, Any]:
        mailbox = urllib.parse.quote(self.config.mailbox, safe="")
        encoded_id = urllib.parse.quote(message_id, safe="")
        data = self.request(
            "GET",
            f"/open-apis/mail/v1/user_mailboxes/{mailbox}/messages/{encoded_id}",
        ).get("data", {})
        return data.get("message", {})

    def attachment_bytes(
        self, message_id: str, attachment_id: str, max_bytes: int
    ) -> bytes:
        mailbox = urllib.parse.quote(self.config.mailbox, safe="")
        encoded_id = urllib.parse.quote(message_id, safe="")
        data = self.request(
            "GET",
            f"/open-apis/mail/v1/user_mailboxes/{mailbox}/messages/{encoded_id}/attachments/download_url",
            params=[("attachment_ids", attachment_id)],
        ).get("data", {})
        urls = data.get("download_urls", [])
        if not urls:
            raise RuntimeError("Attachment download URL missing")
        response = self.session.get(urls[0]["download_url"], timeout=120, stream=True)
        response.raise_for_status()
        content_length = int(response.headers.get("content-length", "0") or 0)
        if content_length > max_bytes:
            raise RuntimeError("Attachment exceeds configured size limit")
        chunks: list[bytes] = []
        total = 0
        for chunk in response.iter_content(1024 * 1024):
            total += len(chunk)
            if total > max_bytes:
                raise RuntimeError("Attachment exceeds configured size limit")
            chunks.append(chunk)
        return b"".join(chunks)

    def existing_source_ids(self) -> dict[str, str]:
        result: dict[str, str] = {}
        page_token = ""
        while True:
            params: dict[str, Any] = {"page_size": 100}
            if page_token:
                params["page_token"] = page_token
            path = (
                "/open-apis/bitable/v1/apps/"
                f"{urllib.parse.quote(self.config.base_token, safe='')}/tables/"
                f"{urllib.parse.quote(self.config.table_id, safe='')}/records"
            )
            data = self.request("GET", path, params=params).get("data", {})
            for item in data.get("items", []):
                source_id = field_text(
                    (item.get("fields") or {}).get("来源邮件 Message ID")
                )
                if source_id:
                    result[source_id] = str(item.get("record_id", ""))
            if not data.get("has_more"):
                return result
            page_token = str(data.get("page_token", ""))

    def create_application(self, fields: dict[str, Any]) -> str:
        path = (
            "/open-apis/bitable/v1/apps/"
            f"{urllib.parse.quote(self.config.base_token, safe='')}/tables/"
            f"{urllib.parse.quote(self.config.table_id, safe='')}/records"
        )
        data = self.request("POST", path, json={"fields": fields}).get("data", {})
        record = data.get("record") or {}
        record_id = str(record.get("record_id", ""))
        if not record_id:
            raise RuntimeError("Base create response missing record_id")
        return record_id

    def update_application(self, record_id: str, fields: dict[str, Any]) -> None:
        path = (
            "/open-apis/bitable/v1/apps/"
            f"{urllib.parse.quote(self.config.base_token, safe='')}/tables/"
            f"{urllib.parse.quote(self.config.table_id, safe='')}/records/"
            f"{urllib.parse.quote(record_id, safe='')}"
        )
        self.request("PUT", path, json={"fields": fields})

    def upload_attachment(self, record_id: str, filename: str, content: bytes) -> None:
        upload = self.request(
            "POST",
            "/open-apis/drive/v1/medias/upload_all",
            data={
                "file_name": filename,
                "parent_type": "bitable_file",
                "parent_node": self.config.base_token,
                "size": str(len(content)),
            },
            files={"file": (filename, content, "application/octet-stream")},
        ).get("data", {})
        file_token = str(upload.get("file_token", ""))
        if not file_token:
            raise RuntimeError("Drive upload response missing file_token")
        attachments = {
            "attachments": {
                record_id: {
                    self.config.attachment_field_id: [{"file_token": file_token}]
                }
            }
        }
        self.request(
            "POST",
            "/open-apis/base/v3/bases/"
            f"{urllib.parse.quote(self.config.base_token, safe='')}/tables/"
            f"{urllib.parse.quote(self.config.table_id, safe='')}/append_attachments",
            json=attachments,
        )


def field_text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    if isinstance(value, list):
        return " ".join(field_text(item) for item in value).strip()
    if isinstance(value, dict):
        return str(value.get("text") or value.get("name") or "")
    return str(value)


def decoded_body(message: dict[str, Any]) -> str:
    raw = message.get("body_plain_text") or message.get("body_html") or ""
    try:
        value = base64.b64decode(raw).decode("utf-8", errors="replace")
    except Exception:  # noqa: BLE001
        return ""
    value = re.sub(r"<[^>]+>", " ", value)
    return html.unescape(re.sub(r"\s+", " ", value)).strip()


def pdf_text(content: bytes) -> str:
    try:
        reader = PdfReader(io.BytesIO(content))
        return "\n".join((page.extract_text() or "") for page in reader.pages)[:100_000]
    except Exception:  # noqa: BLE001
        return ""


def safe_filename(value: str) -> str:
    name = Path(value.replace("\\", "/")).name
    name = re.sub(r"[\x00-\x1f<>:\"/\\|?*]", "_", name).strip(" .")
    return (name or "attachment")[:180]


def detect_role(text: str) -> str:
    rules = [
        ("结构工程师", ("结构", "机械设计")),
        ("机器人 / 嵌入式实习生", ("嵌入式", "固件", "单片机")),
        ("硬件工程师", ("硬件", "电子工程")),
        ("AI 全栈工程师", ("全栈", "前端", "后端", "web", "软件开发")),
    ]
    lowered = text.lower()
    for role, keywords in rules:
        if any(keyword in lowered for keyword in keywords):
            return role
    return ""


def detect_name(subject: str, display_name: str, resume_text: str) -> str:
    ignored = {
        "应聘", "简历", "求职", "实习", "岗位", "结构", "机械", "硬件", "工程师",
        "嵌入式", "全栈", "软件", "个人", "附件", "毕业生", "招聘",
    }
    boundary_name = re.compile(
        r"(?:^|[-_—\s])([\u4e00-\u9fff]{2,4})(?=[（(\-\s_—]|$)"
    )
    candidates = boundary_name.findall(subject[:80])
    candidates += CHINESE_NAME_RE.findall(display_name[:20])
    candidates += CHINESE_NAME_RE.findall(resume_text[:200])
    for candidate in candidates:
        if candidate not in ignored and not any(word in candidate for word in ignored):
            return candidate
    return display_name.strip()[:40] or "待确认（邮件导入）"


def build_fields(message: dict[str, Any], attachment_text: str) -> dict[str, Any]:
    subject = str(message.get("subject", ""))
    body = decoded_body(message)
    sender = message.get("head_from") or {}
    sender_email = str(sender.get("mail_address", "")).strip().lower()
    display_name = str(sender.get("name", "")).strip()
    combined = "\n".join((subject, body, attachment_text))
    role = detect_role(combined)
    phone_match = PHONE_RE.search(combined)
    email_match = EMAIL_RE.search(combined)
    source_id = str(message.get("smtp_message_id") or message.get("message_id") or "")
    fields: dict[str, Any] = {
        "姓名": detect_name(subject, display_name, attachment_text),
        "来源": "HR 邮箱导入",
        "来源邮件 Message ID": source_id,
        # Keep delivery disabled until every supported attachment is safely copied.
        "确认邮件状态": "无需发送",
        "补充说明": "HR 邮箱自动导入；岗位与应聘类型由系统初步识别，请 HR 复核。",
    }
    if sender_email or email_match:
        fields["联系邮箱"] = sender_email or str(email_match.group(0)).lower()
    if phone_match:
        fields["联系电话"] = phone_match.group(1)
    if role:
        fields["应聘岗位"] = role
    if any(keyword in combined for keyword in ("实习", "在校", "应届", "毕业生")):
        fields["应聘类型"] = "实习岗位"
        fields["工作经验"] = "在校生 / 应届生"
    return fields


def eligible_for_auto_reply(fields: dict[str, Any]) -> bool:
    address = str(fields.get("联系邮箱", "")).strip().lower()
    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", address):
        return False
    local, domain = address.rsplit("@", 1)
    normalized_local = local.replace("_", "-").replace(".", "-")
    if domain in BLOCKED_SENDER_DOMAINS:
        return False
    if any(normalized_local.startswith(prefix) for prefix in BLOCKED_SENDER_PREFIXES):
        return False
    if not fields.get("应聘岗位"):
        return False
    name = str(fields.get("姓名", "")).strip()
    return bool(name and not name.startswith("待确认"))


def message_fingerprint(message_id: str) -> str:
    return hashlib.sha256(message_id.encode("utf-8")).hexdigest()[:12]


def process_message(
    config: Config,
    client: FeishuClient,
    store: StateStore,
    message: dict[str, Any],
    existing: dict[str, str],
) -> None:
    message_id = str(message.get("message_id", ""))
    internal_date_ms = int(message.get("internal_date", 0) or 0)
    smtp_message_id = str(message.get("smtp_message_id") or message_id)
    fingerprint = message_fingerprint(message_id)
    state = store.get_import(message_id)
    if state and state["status"] == "done":
        return
    if smtp_message_id in existing and not state:
        store.save_import(
            message_id,
            smtp_message_id,
            internal_date_ms,
            "done",
            existing[smtp_message_id],
        )
        return

    attachments: list[tuple[str, str, bytes]] = []
    attachment_text = ""
    for attachment in message.get("attachments", []):
        if attachment.get("is_inline"):
            continue
        attachment_id = str(attachment.get("id", ""))
        filename = safe_filename(str(attachment.get("filename", "attachment")))
        if not attachment_id or Path(filename).suffix.lower() not in SAFE_EXTENSIONS:
            continue
        content = client.attachment_bytes(
            message_id, attachment_id, config.max_attachment_bytes
        )
        attachments.append((attachment_id, filename, content))
        if Path(filename).suffix.lower() == ".pdf":
            attachment_text += "\n" + pdf_text(content)

    if not attachments:
        store.save_import(
            message_id, smtp_message_id, internal_date_ms, "done", error="no_resume"
        )
        LOG.info("Skipped mail without a supported resume mail=%s", fingerprint)
        return

    fields = build_fields(message, attachment_text)
    should_reply = eligible_for_auto_reply(fields)
    record_id = str(state["record_id"] or "") if state else ""
    if not record_id:
        record_id = client.create_application(fields)
        store.save_import(
            message_id, smtp_message_id, internal_date_ms, "record_created", record_id
        )
        existing[smtp_message_id] = record_id

    for attachment_id, filename, content in attachments:
        if store.attachment_done(message_id, attachment_id):
            continue
        client.upload_attachment(record_id, filename, content)
        store.mark_attachment_done(message_id, attachment_id)
    if should_reply:
        client.update_application(record_id, {"确认邮件状态": "待发送"})
    store.save_import(message_id, smtp_message_id, internal_date_ms, "done", record_id)
    LOG.info("Imported application mail=%s", fingerprint)


def process_once(config: Config, client: FeishuClient, store: StateStore) -> None:
    watermark = store.watermark()
    existing = client.existing_source_ids()
    messages: list[dict[str, Any]] = []
    for message_id in client.list_message_ids():
        message = client.get_message(message_id)
        if int(message.get("internal_date", 0) or 0) >= watermark:
            messages.append(message)
    messages.sort(key=lambda item: int(item.get("internal_date", 0) or 0))
    for message in messages:
        message_id = str(message.get("message_id", ""))
        internal_date_ms = int(message.get("internal_date", 0) or 0)
        try:
            process_message(config, client, store, message, existing)
        except Exception as exc:  # noqa: BLE001
            smtp_id = str(message.get("smtp_message_id") or message_id)
            store.save_import(
                message_id,
                smtp_id,
                internal_date_ms,
                "failed",
                error=str(exc)[:300],
            )
            LOG.exception("Import failed mail=%s", message_fingerprint(message_id))
            break
        store.set_watermark(max(store.watermark(), internal_date_ms + 1))


def touch(path: str) -> None:
    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.touch()


def main() -> int:
    logging.basicConfig(
        level=os.getenv("LOG_LEVEL", "INFO"),
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
    config = Config.load()
    store = StateStore(config.db_path, config.initial_start_ms)
    client = FeishuClient(config)
    try:
        while True:
            try:
                process_once(config, client, store)
                touch(config.heartbeat_path)
            except Exception:  # noqa: BLE001
                LOG.exception("Mailbox polling cycle failed")
            time.sleep(config.poll_seconds)
    finally:
        store.close()


if __name__ == "__main__":
    raise SystemExit(main())
