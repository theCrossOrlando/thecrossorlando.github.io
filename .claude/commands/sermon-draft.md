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
5. Write `messages/YYYY-MM-DD.md`:
   ```
   ---
   title: "<title or TBD>"
   date: "<YYYYMMDD>T100000-0500"
   file: "https://cflcn.org/sermons/<YYYY-MM-DD>.m4a"
   length: "<bytes>"
   duration: "<MM:SS>"
   ---
   ```
6. Report the file path and any placeholder fields the user still needs to fill in.

$ARGUMENTS
