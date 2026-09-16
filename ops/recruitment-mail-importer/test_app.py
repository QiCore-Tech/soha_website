import base64
import os
import tempfile
import unittest

import app


class RecruitmentMailImporterTests(unittest.TestCase):
    def test_detect_role(self):
        self.assertEqual(app.detect_role("应聘机械结构设计岗位"), "结构工程师")
        self.assertEqual(
            app.detect_role("嵌入式实习生 STM32"), "机器人 / 嵌入式实习生"
        )
        self.assertEqual(app.detect_role("Web 前后端开发"), "AI 全栈工程师")

    def test_build_fields_uses_sender_and_no_send_status(self):
        body = base64.b64encode("一周实习五天，电话 13800138000".encode()).decode()
        fields = app.build_fields(
            {
                "message_id": "mail-id",
                "smtp_message_id": "smtp-id",
                "subject": "李明（嵌入式实习生）",
                "body_plain_text": body,
                "head_from": {"name": "Newton", "mail_address": "person@example.com"},
            },
            "",
        )
        self.assertEqual(fields["姓名"], "李明")
        self.assertEqual(fields["联系电话"], "13800138000")
        self.assertEqual(fields["联系邮箱"], "person@example.com")
        self.assertEqual(fields["确认邮件状态"], "无需发送")
        self.assertEqual(fields["应聘类型"], "实习岗位")
        self.assertTrue(app.eligible_for_auto_reply(fields))

    def test_auto_reply_rejects_internal_and_noreply_senders(self):
        base = {"姓名": "李明", "应聘岗位": "硬件工程师"}
        self.assertFalse(
            app.eligible_for_auto_reply({**base, "联系邮箱": "person@qicore.ai"})
        )
        self.assertFalse(
            app.eligible_for_auto_reply({**base, "联系邮箱": "no-reply@example.com"})
        )
        self.assertFalse(
            app.eligible_for_auto_reply({"姓名": "李明", "联系邮箱": "person@example.com"})
        )

    def test_detect_name_prefers_delimited_name_in_long_subject(self):
        self.assertEqual(
            app.detect_name(
                "示例大学27届毕业生实习简历-李明-应聘机械结构设计岗位",
                "李明",
                "",
            ),
            "李明",
        )

    def test_state_watermark_and_idempotency(self):
        with tempfile.TemporaryDirectory() as directory:
            path = os.path.join(directory, "state.sqlite3")
            store = app.StateStore(path, 123)
            self.assertEqual(store.watermark(), 123)
            store.save_import("mail", "smtp", 200, "done", "rec")
            self.assertEqual(store.get_import("mail")["record_id"], "rec")
            store.mark_attachment_done("mail", "attachment")
            self.assertTrue(store.attachment_done("mail", "attachment"))
            store.close()


if __name__ == "__main__":
    unittest.main()
