---
description: Create only the messages/YYYY-MM-DD.md file from the Desktop recording — no upload, no commit. Useful when the title isn't decided yet.
---

Draft a sermon message file from the Desktop recording. Does NOT upload, commit, or push.

**Inputs from `$ARGUMENTS`:**
- Optionally a title. If absent, use `"TBD"` as a placeholder.
- Optionally a date in `YYYY-MM-DD` format. If absent, use the most recent Sunday on or before today.

**Steps:**

1. Determine the date (default: most recent Sunday).
2. Verify `~/Desktop/YYYY-MM-DD.m4a` exists. If not, stop.
3. Get file size in bytes: `stat -f %z ~/Desktop/YYYY-MM-DD.m4a`
4. Get duration: `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ~/Desktop/YYYY-MM-DD.m4a`. Convert to `MM:SS` rounded to nearest second (match prior format).
5. Transcribe with Whisper (VTT for the transcript body, txt for a summary):
   ```
   PATH="$HOME/Library/Python/3.9/bin:$PATH" mlx_whisper ~/Desktop/YYYY-MM-DD.m4a \
     --model mlx-community/whisper-base.en-mlx --output-dir /tmp --output-name sermon-YYYY-MM-DD \
     --output-format all
   ```
   Then render the timestamped transcript body with the repo's checked-in renderer (identical markup for every sermon — do not hand-write it):
   ```
   node scripts/render-transcript.mjs /tmp/sermon-YYYY-MM-DD.vtt > /tmp/body-YYYY-MM-DD.html
   ```
   Optionally write a factual 1–2 sentence `summary` from `/tmp/sermon-YYYY-MM-DD.txt`. If Whisper is unavailable, skip the body (frontmatter only).
6. Determine the `scripture` references from `/tmp/sermon-YYYY-MM-DD.txt` — the passage(s) actually read and worked through, not every verse mentioned in passing. Format: `Book Chapter`, semicolon-separated, primary first (`"Psalm 68"`, `"1 Peter 2; Isaiah 28"`); numbered books take a space after the numeral (`1 Peter`, not `1Peter`); narrow to verses or a chapter range when the sermon stays inside one (`"Matthew 25:14-30"`, `"Isaiah 40-43"`). This drives the BibleGateway links on the message page — fill it in even when the title is still `TBD`, since a missing `scripture` is easy to forget later and six sermons were published without it.
7. Write `messages/YYYY-MM-DD.md` = frontmatter, one blank line, then the rendered transcript body (trailing newline at EOF):
   ```
   ---
   title: "<title or TBD>"
   date: "<YYYYMMDD>T100000-0500"
   file: "https://cflcn.org/sermons/<YYYY-MM-DD>.m4a"
   length: "<bytes>"
   duration: "<MM:SS>"
   podcast_author: "<guest speaker>"
   summary: "<summary>"
   scripture: "<references>"
   ---

   <contents of /tmp/body-YYYY-MM-DD.html>
   ```
   Keep this key order; `scripture` goes last. Omit `summary` if none was written. Omit `podcast_author` when Ben preached (it defaults to `Ben Hoyer`); set it only for a guest speaker.
8. Report the file path and any placeholder fields the user still needs to fill in.

$ARGUMENTS
