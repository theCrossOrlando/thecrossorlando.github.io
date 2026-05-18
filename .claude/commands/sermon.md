---
description: Publish a new sermon message — creates the markdown file, uploads the audio to the server, commits, and pushes.
---

Publish the weekly sermon message. The user provides the title (and optionally the date) as arguments.

**Inputs from `$ARGUMENTS`:**
- The title (e.g., `Luke 15 - Family`)
- Optionally a date in `YYYY-MM-DD` format. If absent, use the most recent Sunday on or before today.

**Recording location:** `~/Desktop/YYYY-MM-DD.m4a`

**Steps:**

1. Determine the date. If not in arguments, compute the most recent Sunday (use `date` command).
2. Verify the recording exists at `~/Desktop/YYYY-MM-DD.m4a`. If not, stop and tell me.
3. Get file size in bytes and duration:
   - Size: `stat -f %z ~/Desktop/YYYY-MM-DD.m4a`
   - Duration: `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ~/Desktop/YYYY-MM-DD.m4a`
   - Convert duration to `MM:SS` (round to nearest second, no leading zero on minutes — match prior format like `26:43`, `28:05`).
4. Create `messages/YYYY-MM-DD.md` with this exact frontmatter format (match existing files in `messages/`):
   ```
   ---
   title: "<title>"
   date: "<YYYYMMDD>T100000-0500"
   file: "https://cflcn.org/sermons/<YYYY-MM-DD>.m4a"
   length: "<bytes>"
   duration: "<MM:SS>"
   ---
   ```
   Note the trailing blank line after the closing `---`.
5. Upload the audio: `scp ~/Desktop/YYYY-MM-DD.m4a thecross:~/sermons/`
6. Commit with the message format used in `git log` (e.g., `Message: 2026-05-17`):
   - `git add messages/YYYY-MM-DD.md`
   - `git commit -m "Message: YYYY-MM-DD"`
7. Push: `git push`
8. Post to Slack via incoming webhook. The webhook URL is in env var `SLACK_SERMON_WEBHOOK_URL`. If the var is unset, skip this step and warn me — do NOT prompt or hardcode a URL.
   - Web URL for the post: `https://www.thecrossorlando.org/messages/YYYY/MM/DD/` (note: year/month/day path segments, not the filename)
   - Payload: `{"text": "New message posted: *<title>* — <web URL>"}`
   - Command:
     ```
     curl -sS -X POST -H 'Content-Type: application/json' \
       --data "{\"text\":\"New message posted: *<title>* — <web URL>\"}" \
       "$SLACK_SERMON_WEBHOOK_URL"
     ```
   - Confirm the response is `ok`.
9. Report the final commit SHA, confirm upload completed, and confirm Slack post sent (or skipped).

**Reference samples** (look at these to confirm format if anything is unclear):
- `messages/2026-05-17.md`
- `messages/2026-05-10.md`
- `messages/2026-05-03.md`

$ARGUMENTS
