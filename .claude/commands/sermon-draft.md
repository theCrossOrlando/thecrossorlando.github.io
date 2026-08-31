---
description: Create only the messages/YYYY-MM-DD.md file from the Desktop recording — no wrap, no upload, no commit. Useful when the title isn't decided yet.
---

Draft a sermon message file from the Desktop recording. Does NOT wrap the audio, upload, commit, or push.

**Inputs from `$ARGUMENTS`:**
- Optionally a title. If absent, use `"TBD"` as a placeholder.
- Optionally a date in `YYYY-MM-DD` format. If absent, use the most recent Sunday on or before today.

**What this deliberately leaves undone.** The published audio opens with a spoken announcement naming the title, so it cannot be built while the title is `TBD`. This command therefore stops at the **bare** sermon; `/sermon-publish` does the wrap once the title is set, and rewrites `length`, `duration`, and the transcript body at that point. The values written here are provisional and describe the un-wrapped audio.

**Steps:**

1. Determine the date (default: most recent Sunday).
2. Locate `~/Desktop/YYYY-MM-DD.*`. If none exists, stop. Transcode to **`~/Desktop/YYYY-MM-DD-bare.m4a`** (AAC-LC, mono, 22050 Hz, 48 kbps, preferring `aac_at`):
   ```
   enc=$(ffmpeg -hide_banner -encoders 2>/dev/null | grep -q aac_at && echo aac_at || echo aac)
   ffmpeg -y -i ~/Desktop/YYYY-MM-DD.<ext> -c:a "$enc" -b:a 48k -ac 1 -ar 22050 ~/Desktop/YYYY-MM-DD-bare.m4a
   ```
   Keep this file — `/sermon-publish` needs it, and wrapping an already-wrapped file would double the intro.
3. Transcribe the bare file with Whisper (VTT for the transcript body, txt for a summary):
   ```
   PATH="$HOME/Library/Python/3.9/bin:$PATH" mlx_whisper ~/Desktop/YYYY-MM-DD-bare.m4a \
     --model mlx-community/whisper-base.en-mlx --output-dir /tmp --output-name sermon-YYYY-MM-DD \
     --output-format all
   ```
   Then render the timestamped transcript body with the repo's checked-in renderer (identical markup for every sermon — do not hand-write it):
   ```
   node scripts/render-transcript.mjs /tmp/sermon-YYYY-MM-DD.vtt > /tmp/body-YYYY-MM-DD.html
   ```
   Render from the **un-offset** VTT here; the offset isn't known until the wrap. Optionally write a factual 1–2 sentence `summary` from `/tmp/sermon-YYYY-MM-DD.txt`. If Whisper is unavailable, skip the body (frontmatter only).
4. Provisional size and duration, from the **bare** file:
   - `stat -f %z ~/Desktop/YYYY-MM-DD-bare.m4a`
   - `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ~/Desktop/YYYY-MM-DD-bare.m4a`, as `MM:SS` rounded to the nearest second.
5. Determine the `scripture` references from `/tmp/sermon-YYYY-MM-DD.txt` — the passage(s) actually read and worked through, not every verse mentioned in passing. Format: `Book Chapter`, semicolon-separated, primary first (`"Psalm 68"`, `"1 Peter 2; Isaiah 28"`); numbered books take a space after the numeral (`1 Peter`, not `1Peter`); narrow to verses or a chapter range when the sermon stays inside one (`"Matthew 25:14-30"`, `"Isaiah 40-43"`). This drives the BibleGateway links on the message page — fill it in even when the title is still `TBD`, since a missing `scripture` is easy to forget later and six sermons were published without it.
6. Write `messages/YYYY-MM-DD.md` = frontmatter, one blank line, then the rendered transcript body (trailing newline at EOF):
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
7. Report the file path, any placeholder fields still to fill in, and state plainly that the audio is **not yet wrapped** — `length`, `duration`, and the transcript timestamps are provisional until `/sermon-publish` runs.

$ARGUMENTS
