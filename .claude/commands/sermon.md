---
description: Publish a new sermon message — creates the markdown file, uploads the audio to the server, commits, and pushes.
---

Publish the weekly sermon message. The user provides the title (and optionally the date) as arguments.

**Inputs from `$ARGUMENTS`:**
- The title (e.g., `Luke 15 - Family`)
- Optionally a date in `YYYY-MM-DD` format. If absent, use the most recent Sunday on or before today.
- Optionally a 1–2 sentence summary for the podcast episode description.

**Recording location:** `~/Desktop/YYYY-MM-DD.<ext>` — usually `.m4a`, but may come off the recorder as `.wav`/`.aiff`/`.mp3`.

**Steps:**

1. Determine the date. If not in arguments, compute the most recent Sunday (use `date` command).
2. Locate the recording for that date on the Desktop (`~/Desktop/YYYY-MM-DD.*`). If none exists, stop and tell me.
   - If it's already `~/Desktop/YYYY-MM-DD.m4a`, use it as-is.
   - Otherwise, transcode it to spoken-word AAC at `~/Desktop/YYYY-MM-DD.m4a` (keep the original). Match the catalog format: AAC-LC, **mono**, **22050 Hz**, **48 kbps**. Prefer Apple's AudioToolbox encoder (`aac_at` — same engine as the "Spoken Word" preset), falling back to ffmpeg's native `aac` if unavailable:
     ```
     enc=$(ffmpeg -hide_banner -encoders 2>/dev/null | grep -q aac_at && echo aac_at || echo aac)
     ffmpeg -y -i ~/Desktop/YYYY-MM-DD.<ext> -c:a "$enc" -b:a 48k -ac 1 -ar 22050 ~/Desktop/YYYY-MM-DD.m4a
     ```
   - All later steps operate on the resulting `~/Desktop/YYYY-MM-DD.m4a`.
3. Get file size in bytes and duration:
   - Size: `stat -f %z ~/Desktop/YYYY-MM-DD.m4a`
   - Duration: `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ~/Desktop/YYYY-MM-DD.m4a`
   - Convert duration to `MM:SS` (round to nearest second, no leading zero on minutes — match prior format like `26:43`, `28:05`).
4. Determine the episode summary (used as the podcast episode description in `/feed.xml`):
   - If a summary was provided in `$ARGUMENTS`, use it.
   - Otherwise, transcribe the recording with Whisper and write a concise 1–2 sentence summary of what the sermon actually covers (scripture/topic). Stay factual to the transcript — do not embellish or invent.
     ```
     PATH="$HOME/Library/Python/3.9/bin:$PATH" mlx_whisper ~/Desktop/YYYY-MM-DD.m4a \
       --model mlx-community/whisper-base.en-mlx --output-dir /tmp --output-name sermon-YYYY-MM-DD
     # then summarize /tmp/sermon-YYYY-MM-DD.txt into 1–2 sentences
     ```
   - If transcription isn't possible, ask me for a one-line summary, or omit the `summary` line (the feed falls back to the title).
5. Create `messages/YYYY-MM-DD.md` with this exact frontmatter format (match existing files in `messages/`):
   ```
   ---
   title: "<title>"
   date: "<YYYYMMDD>T100000-0500"
   file: "https://cflcn.org/sermons/<YYYY-MM-DD>.m4a"
   length: "<bytes>"
   duration: "<MM:SS>"
   summary: "<summary>"
   ---
   ```
   Note the trailing blank line after the closing `---`. Omit the `summary` line if no summary was given (do not write an empty string).
6. Upload the audio: `scp ~/Desktop/YYYY-MM-DD.m4a thecross:~/sermons/`
7. Commit with the message format used in `git log` (e.g., `Message: 2026-05-17`):
   - `git add messages/YYYY-MM-DD.md`
   - `git commit -m "Message: YYYY-MM-DD"`
8. Push: `git push`
9. Post to Slack via incoming webhook. The webhook URL is in env var `SLACK_SERMON_WEBHOOK_URL`. If the var is unset, skip this step and warn me — do NOT prompt or hardcode a URL.
   - Web URL for the post: `https://www.thecrossorlando.org/messages/YYYY/MM/DD/` (note: year/month/day path segments, not the filename)
   - Payload: `{"text": "New message posted: *<title>* — <web URL>"}`
   - Command:
     ```
     curl -sS -X POST -H 'Content-Type: application/json' \
       --data "{\"text\":\"New message posted: *<title>* — <web URL>\"}" \
       "$SLACK_SERMON_WEBHOOK_URL"
     ```
   - Confirm the response is `ok`.
10. Report the final commit SHA, confirm upload completed, and confirm Slack post sent (or skipped).

**Reference samples** (look at these to confirm format if anything is unclear):
- `messages/2026-05-17.md`
- `messages/2026-05-10.md`
- `messages/2026-05-03.md`

$ARGUMENTS
