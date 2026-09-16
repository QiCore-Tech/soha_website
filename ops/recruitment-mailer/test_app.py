import os
import hashlib
import tempfile
import unittest
from unittest.mock import patch

import app


class RecruitmentMailerTests(unittest.TestCase):
    def config(self, directory):
        return app.Config(
            app_id="example-app",
            app_secret="example-secret",
            base_token="example-base",
            table_id="example-table",
            start_from_ms=0,
            poll_seconds=30,
            smtp_host="smtp-relay",
            smtp_port=25,
            from_name="QiCore 招聘",
            from_address="noreply@example.com",
            reply_to="hr@example.com",
            db_path=os.path.join(directory, "state.db"),
            heartbeat_path=os.path.join(directory, "heartbeat"),
            max_attempts=5,
        )

    def test_valid_email(self):
        self.assertTrue(app.valid_email("candidate@example.com"))
        self.assertFalse(app.valid_email("candidate@example.com\nBcc:x@example.com"))
        self.assertFalse(app.valid_email("not-an-email"))

    def test_field_text(self):
        self.assertEqual(app.field_text([{"text": "A"}, {"name": "B"}]), "A B")
        self.assertEqual(app.field_text(None), "")

    def test_safe_error_redacts_email(self):
        message = app.safe_error(RuntimeError("Rejected candidate@example.com\nextra"))
        self.assertEqual(message, "Rejected [redacted-email] extra")

    def test_candidate_message_copy_and_reply_path(self):
        with tempfile.TemporaryDirectory() as directory:
            message = app.build_message(
                self.config(directory),
                recipient="candidate@example.com",
                candidate_name="候选人",
                role_name="测试岗位",
            )
            plain = message.get_body(preferencelist=("plain",)).get_content()
            self.assertEqual(message["Reply-To"], "hr@example.com")
            self.assertIn("材料现已进入招聘流程", plain)
            self.assertIn("无需重复投递", plain)

    def test_record_created_ms_uses_base_created_at_field(self):
        record = {"fields": {"投递时间": 1788192540000}}
        self.assertEqual(app.record_created_ms(record), 1788192540000)

    def test_base_sync_failure_never_retries_accepted_email(self):
        class FailingSyncClient:
            def list_applications(self):
                return [
                    {
                        "record_id": "rec1",
                        "fields": {
                            "投递时间": 1788192540000,
                            "联系邮箱": "candidate@example.com",
                            "姓名": "候选人",
                            "应聘岗位": "测试岗位",
                        },
                    }
                ]

            def update_application(self, _record_id, _fields):
                raise RuntimeError("Forbidden")

        with tempfile.TemporaryDirectory() as directory:
            config = self.config(directory)
            store = app.DeliveryStore(config.db_path)
            client = FailingSyncClient()
            with patch.object(app, "smtp_send") as send:
                app.process_once(config, client, store)
                app.process_once(config, client, store)
            self.assertEqual(send.call_count, 1)
            self.assertEqual(store.get("rec1")["status"], "sent")

    def test_mail_import_record_marked_no_send_is_skipped(self):
        class ImportedApplicationClient:
            def list_applications(self):
                return [
                    {
                        "record_id": "rec-imported",
                        "fields": {
                            "投递时间": 1788192540000,
                            "联系邮箱": "candidate@example.com",
                            "姓名": "候选人",
                            "应聘岗位": "测试岗位",
                            "确认邮件状态": "无需发送",
                        },
                    }
                ]

        with tempfile.TemporaryDirectory() as directory:
            config = self.config(directory)
            store = app.DeliveryStore(config.db_path)
            with patch.object(app, "smtp_send") as send:
                app.process_once(config, ImportedApplicationClient(), store)
            send.assert_not_called()
            self.assertIsNone(store.get("rec-imported"))

    def test_store_idempotency(self):
        with tempfile.TemporaryDirectory() as directory:
            store = app.DeliveryStore(os.path.join(directory, "state.db"))
            first = store.ensure_pending("rec1", "candidate@example.com")
            second = store.ensure_pending("rec1", "candidate@example.com")
            self.assertEqual(first["record_id"], second["record_id"])
            self.assertEqual(
                first["recipient"],
                hashlib.sha256(b"candidate@example.com").hexdigest(),
            )
            self.assertNotIn("candidate@example.com", first["recipient"])
            store.mark_sent("rec1", "<message@qicore.tech>", 123)
            self.assertEqual(store.get("rec1")["status"], "sent")


if __name__ == "__main__":
    unittest.main()
