---
description: Post (or repost) a sermon announcement to Slack via the incoming webhook. Use to retry if /sermon's Slack step failed.
---

Post a sermon link to the Slack channel.

**Inputs from `$ARGUMENTS`:**
- Optionally a date in `YYYY-MM-DD`. If absent, use the most recent Sunday on or before today.

**Steps:**

1. Determine the date (default: most recent Sunday).
2. Verify `messages/YYYY-MM-DD.md` exists. Read the `title` from the frontmatter.
3. Verify `SLACK_SERMON_WEBHOOK_URL` is set. If unset, stop and tell me to add it to my shell profile (`~/.zshrc` or `~/.bashrc`).
4. Build the web URL: `https://www.thecrossorlando.org/messages/YYYY/MM/DD/`
5. Post:
   ```
   curl -sS -X POST -H 'Content-Type: application/json' \
     --data "{\"text\":\"New message posted: *<title>* — <web URL>\"}" \
     "$SLACK_SERMON_WEBHOOK_URL"
   ```
6. Confirm response is `ok`. If not, show me the response body.

$ARGUMENTS
