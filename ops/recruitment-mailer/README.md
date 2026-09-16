# Recruitment acknowledgement mailer

This directory contains the private worker used to acknowledge new recruitment applications. The website remains a static public site; the worker runs separately on a private Docker host and exposes no HTTP port.

## Flow

```text
Public application form
  -> Feishu Base application table
      -> Feishu workflow: link role, notify recruiting group, create screening task
      -> polling mail worker
          -> private SMTP relay
          -> candidate acknowledgement email
          -> delivery state written back to Feishu Base
```

Polling is intentional: it avoids opening an inbound webhook on the private host. SQLite makes each Base record idempotent, and `START_FROM_MS` prevents historical applications from being mailed when the worker is enabled for the first time.

SMTP acceptance and Base status synchronization are separate states. Once SMTP accepts a message, a later Base write failure may be retried, but the email itself must never be sent again.

## Required Base contract

The application table must provide these source fields:

- `姓名`
- `应聘岗位`
- `联系邮箱`
- `投递时间`（Base 的创建时间字段，用于启用边界保护）

The worker writes only these operational fields:

- `确认邮件状态`: `待发送`, `已发送`, `发送失败`, or `无需发送`
- `确认邮件发送时间`
- `确认邮件 Message ID`
- `确认邮件失败原因`

The Feishu application only needs the application-identity scopes `base:record:retrieve` and `base:record:update`, plus data access to this Base. Do not grant Drive, IM, mail, contacts, or organization-wide Base access to this worker unless a separate feature explicitly requires it.

## Configuration and deployment

1. Copy `environment.example` to `.env` on the private deployment host.
2. Fill `.env` through the host's secret-management channel. Never paste production values into source files, issues, build logs, or chat transcripts.
3. Set `START_FROM_MS` to the Unix millisecond timestamp immediately before first activation.
4. Ensure the existing SMTP relay and this service share the private Docker network named by `MAIL_NETWORK_NAME`.
5. Validate Base access without sending mail:

```bash
docker compose build
docker compose run --rm recruitment-mailer --once
```

6. Start and inspect the worker:

```bash
docker compose up -d
docker compose ps
docker logs --tail 100 qicore-recruitment-mailer
```

7. Only after an authorized person confirms the recipient and message preview, send a test:

```bash
docker compose run --rm recruitment-mailer --test-email candidate@example.com
```

To update the worker, copy the reviewed files from this directory to the private host, then run `docker compose build && docker compose up -d`. Runtime `.env` and the named state volume must remain on the host.

## Candidate email copy

Subject: `我们已收到你的投递｜QiCore 招聘`

```text
{姓名}，你好！

我们已收到你对「{岗位}」岗位的申请，材料现已进入招聘流程。

我们会认真阅读你的经历与作品。若与当前岗位匹配，招聘团队会通过你填写的邮箱或电话联系你。

你无需重复投递。如需补充材料或更正信息，请发送至 hr@qicore.ai。

感谢你关注 QiCore，也感谢你愿意和我们一起，把想法做成产品。

QiCore 招聘团队
hr@qicore.ai
```

The message deliberately avoids promising a response deadline or interview outcome. The message is sent from `noreply@qicore.tech`; candidates are directed to `hr@qicore.ai` for corrections or supplementary materials.

The HTML version uses a text-only QiCore wordmark so the message does not depend on remote images or image loading permissions.

## Security and privacy rules

- Never commit App IDs tied to a real tenant, App Secrets, Base tokens, table IDs, SMTP credentials, internal hostnames/IPs, deploy hooks, private form URLs, candidate records, or production timestamps.
- Keep `.env` mode restricted on the host and rotate any credential that appears in source control, logs, screenshots, or chat.
- The mailer must remain on a private network with no published port. SMTP authentication stays in the relay; this worker only reaches the relay over the private Docker network.
- Local idempotency state stores the Base record ID, a SHA-256 digest of the recipient address, delivery status, message ID, retry count, and bounded error text. It does not duplicate candidate names, phone numbers, resumes, or plaintext email addresses.
- Logs identify Base records, not candidates. Recipient addresses in delivery errors are redacted before logging or persistence; do not add raw form payloads or recipient addresses to logs.
- Invalid email syntax is not sent. The failure reason is written to the corresponding Base record for HR correction.
- HTML content escapes candidate-provided values to prevent markup injection; mail headers strip line breaks and cap length.
- Keep recruiting access least-privileged and periodically remove departed collaborators. Define retention and deletion rules for resumes and application records in Feishu Base.
- Review staged changes with a secret scanner before every public push.

## End-to-end acceptance test

Use a dedicated test candidate and a real mailbox that the tester controls:

1. Submit the public form once and upload a non-sensitive test résumé.
2. Confirm one new Base record is created and automatically linked to the selected role.
3. Confirm the recruiting group receives one notification and one screening task is created.
4. Confirm one acknowledgement email arrives and can be replied to.
5. Confirm the Base record shows `已发送`, a send time, and a Message ID.
6. Wait for another polling cycle and confirm no duplicate email is sent.
7. In a separate non-production test, enter invalid email syntax and confirm the record becomes `发送失败` without an outbound message.

If any stage fails, keep the candidate record, record ID, and service logs private. Share only redacted error codes during troubleshooting.
