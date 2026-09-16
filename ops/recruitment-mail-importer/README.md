# Recruitment mailbox importer

Private deployment worker that polls a Feishu public mailbox and imports new
applications into the recruitment Base every five minutes.

## Behaviour

- Imports only mail received after the persisted first-run watermark.
- Uses `来源邮件 Message ID` plus local SQLite state for idempotency.
- Copies PDF, Word and ZIP attachments without executing or extracting archives.
- Reads PDF text only to detect name, phone number, role and internship intent.
- Keeps `确认邮件状态 = 无需发送` while attachments are copied. Only after all
  attachments succeed, an eligible direct application becomes `待发送`.
- Auto-reply eligibility requires a valid external sender, a recognized role and
  candidate name, and at least one supported resume attachment. Internal,
  no-reply, platform-like or ambiguous mail remains `无需发送` for HR review.
- Does not log names, addresses, phone numbers, message bodies or attachment data.
- Lets the existing Base workflow handle role linking, group notification and the
  initial-screening task after the record is created.

## Required Feishu application permissions

- Read mailbox messages: `mail:user_mailbox.message:readonly`
- Existing Base/Drive permissions needed to create records and upload attachments
- The application must be allowed to access the target public mailbox

Grant only the public recruitment mailbox; do not grant access to unrelated mail.

## Deployment

Create a private `.env` from `environment.example`, set `IMPORT_START_FROM_MS` to
the deployment time, then run:

```sh
docker compose build
docker compose up -d
docker compose ps
```

The `.env`, SQLite volume, downloaded mail and candidate data must remain on the
private server. They must never be committed to the public website repository.
