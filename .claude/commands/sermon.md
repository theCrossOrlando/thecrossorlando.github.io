---
description: Publish a new sermon message — creates the markdown file, uploads the audio to the server, commits, and pushes.
---

Publish the weekly sermon message. The user provides the title (and optionally the date) as arguments.

**Inputs from `$ARGUMENTS`:**
- The title (e.g., `Luke 15 - Family`)
- Optionally a date in `YYYY-MM-DD` format. If absent, use the most recent Sunday on or before today.
- Optionally a 1–2 sentence summary for the podcast episode description.

**Recording location:** `~/Desktop/YYYY-MM-DD.<ext>` — usually `.m4a`, but may come off the recorder as `.wav`/`.aiff`/`.mp3`.

**Order matters.** The published audio is the bare sermon wrapped in intro/outro music with a spoken announcement in front of it. Whisper must transcribe the **bare** sermon (otherwise it transcribes the music and announcement), but `length`, `duration`, and every transcript timestamp must describe the **wrapped** file. Getting this order wrong silently shifts every seek button in the transcript by the intro length. Steps below are in the only correct order.

**Steps:**

1. Determine the date. If not in arguments, compute the most recent Sunday (use `date` command).
2. Locate the recording for that date on the Desktop (`~/Desktop/YYYY-MM-DD.*`). If none exists, stop and tell me. Transcode it to **`~/Desktop/YYYY-MM-DD-bare.m4a`** — the bare sermon, which is an intermediate, not the published file. Match the catalog format: AAC-LC, **mono**, **22050 Hz**, **48 kbps**. Prefer Apple's AudioToolbox encoder (`aac_at` — same engine as the "Spoken Word" preset), falling back to ffmpeg's native `aac` if unavailable:
   ```
   enc=$(ffmpeg -hide_banner -encoders 2>/dev/null | grep -q aac_at && echo aac_at || echo aac)
   ffmpeg -y -i ~/Desktop/YYYY-MM-DD.<ext> -c:a "$enc" -b:a 48k -ac 1 -ar 22050 ~/Desktop/YYYY-MM-DD-bare.m4a
   ```
   Keep the original. If the source is already an `.m4a` in the right format, copy it to the `-bare` name rather than re-encoding.
3. Transcribe the **bare** file — always produce a **VTT** (needed for the timestamped transcript body), and a plain `.txt` for summarizing:
   ```
   PATH="$HOME/Library/Python/3.9/bin:$PATH" mlx_whisper ~/Desktop/YYYY-MM-DD-bare.m4a \
     --model mlx-community/whisper-base.en-mlx --output-dir /tmp --output-name sermon-YYYY-MM-DD \
     --output-format all
   ```
   This writes `/tmp/sermon-YYYY-MM-DD.{txt,vtt,srt,json}`. (`whisper-base.en-mlx` runs in seconds on Apple Silicon; if `mlx_whisper` is unavailable, stop and ask me.)
4. Determine the episode summary (used as the podcast episode description in `/feed.xml`):
   - If a summary was provided in `$ARGUMENTS`, use it.
   - Otherwise, write a concise 1–2 sentence summary from `/tmp/sermon-YYYY-MM-DD.txt` of what the sermon actually covers (scripture/topic). Stay factual to the transcript — do not embellish or invent.
5. Determine the `scripture` references. This drives the BibleGateway links on the message page and the messages index, so **do not skip it** — every sermon published between 2026-06-29 and 2026-08-16 silently lost its links because this step didn't exist.
   - Read the passages out of `/tmp/sermon-YYYY-MM-DD.txt`. Use the passage(s) actually **read and worked through**, not every verse mentioned in passing.
   - Format: `Book Chapter`, semicolon-separated, primary passage first — e.g. `"Psalm 68"`, `"1 Peter 2; Isaiah 28"`. Numbered books take a space after the numeral (`1 Peter`, not `1Peter`) even when the title doesn't. Narrow to verses (`"Matthew 25:14-30"`) or a chapter range (`"Isaiah 40-43"`) when the sermon stays inside one. One or two references is the norm; three is rare.
   - Verify each reference resolves before writing it — a mis-numbered chapter produces a link to the wrong passage, which is worse than no link.
6. Wrap the bare sermon into the published audio. This adds the harp intro, the spoken episode announcement, and the outro:
   ```
   ./scripts/build-episode-audio.sh ~/Desktop/YYYY-MM-DD-bare.m4a "<title>" "<author>" ~/Desktop/YYYY-MM-DD.m4a
   ```
   `<author>` is the speaker — `Ben Hoyer` unless `$ARGUMENTS` names a guest. The script prints `SERMON_OFFSET=<seconds>`; **capture that value**, step 7 needs it. It is deterministic: identical inputs give a byte-identical file, so a re-run is always safe.
   - Requires the Kokoro venv at `~/.local/share/thecrossorlando/ttsenv`. If it's missing, stop and tell me — do not fall back to `say`, whose voice is markedly worse and would be audibly inconsistent with previously published episodes.
7. Shift the transcript to match the wrapped audio, using the offset from step 6:
   ```
   node scripts/offset-vtt.mjs /tmp/sermon-YYYY-MM-DD.vtt <SERMON_OFFSET> > /tmp/sermon-YYYY-MM-DD-offset.vtt
   ```
   Sanity-check that the first cue now starts at roughly the offset, not `00:00`.
8. Get file size and duration **of the wrapped file** (`~/Desktop/YYYY-MM-DD.m4a`, not the `-bare` one):
   - Size: `stat -f %z ~/Desktop/YYYY-MM-DD.m4a`
   - Duration: `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ~/Desktop/YYYY-MM-DD.m4a`
   - Convert duration to `MM:SS` (round to nearest second, no leading zero on minutes — match prior format like `26:43`, `28:05`).
9. Render the transcript body from the **offset** VTT (~30s paragraphs, each led by a clickable seek button). Use the repo's checked-in renderer so every sermon's markup is identical — do **not** hand-write the HTML or reinvent the grouping:
   ```
   node scripts/render-transcript.mjs /tmp/sermon-YYYY-MM-DD-offset.vtt > /tmp/body-YYYY-MM-DD.html
   ```
10. Create `messages/YYYY-MM-DD.md` = frontmatter, then a blank line, then the rendered transcript body. Frontmatter format (match existing files in `messages/`):
   ```
   ---
   title: "<title>"
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
   Exactly one blank line between the closing `---` and the first `<p>`, and a trailing newline at EOF. Keep this key order; `scripture` goes last. Omit the `summary` line if no summary was given (do not write an empty string). Omit `podcast_author` when Ben preached — it defaults to `Ben Hoyer`, and it is only set for a guest speaker (e.g. `Aaron Moore`, `Bryan Rosenfarb`, `Brandi-Michelle Rhodes`), which `$ARGUMENTS` will name as "from <speaker>". If transcription failed and there is no VTT, write frontmatter only.
11. Verify the build before committing: `npm run build:html`, then confirm the new `_site/messages/YYYY/MM/DD/index.html` has a `<p class="scripture">` with one `biblegateway.com` link per reference, and that the newest `<item>` in `_site/feed.xml` carries the right `<itunes:author>` and `<itunes:duration>`. Also confirm the first seek button's `data-t` matches the offset from step 6 — if it reads `0`, the wrong VTT was rendered. Finally check the audio's own tags: `ffprobe -v error -show_entries format_tags -of default=nw=1 ~/Desktop/YYYY-MM-DD.m4a` should show the episode title, the speaker as `artist`, and `album=the Cross Orlando`. If it shows a piece of music instead, `-map_metadata -1` was lost from the build script and ffmpeg has copied the tags off the music bed.
12. Upload the audio: `scp ~/Desktop/YYYY-MM-DD.m4a thecross:~/sermons/`
   - `scp` transfers via the SFTP subsystem, which chroots to a different root than an interactive `ssh` shell — so `ssh thecross ls ~/sermons` will NOT show the file. Verify with SFTP or the public URL instead: `curl -sI https://cflcn.org/sermons/YYYY-MM-DD.m4a` should return `200` with a `content-length` equal to the byte size from step 8.
13. Commit with the message format used in `git log` (e.g., `Message: 2026-05-17`):
   - `git add messages/YYYY-MM-DD.md`
   - `git commit -m "Message: YYYY-MM-DD"`
14. Stop and ask before pushing. Do not `git push` without an explicit yes in chat, and do not post to Slack until the push has happened — the Slack link 404s until the site deploys.
15. Post to Slack via incoming webhook. The webhook URL is in env var `SLACK_SERMON_WEBHOOK_URL`. If the var is unset, skip this step and warn me — do NOT prompt or hardcode a URL.
   - Web URL for the post: `https://www.thecrossorlando.org/messages/YYYY/MM/DD/` (note: year/month/day path segments, not the filename)
   - Payload: `{"text": "New message posted: *<title>* — <web URL>"}`
   - Command:
     ```
     curl -sS -X POST -H 'Content-Type: application/json' \
       --data "{\"text\":\"New message posted: *<title>* — <web URL>\"}" \
       "$SLACK_SERMON_WEBHOOK_URL"
     ```
   - Confirm the response is `ok`.
16. Report the final commit SHA, confirm upload completed, and confirm Slack post sent (or skipped).

**Reference samples** (look at these to confirm format if anything is unclear):
- `messages/2026-08-30.md` — guest speaker, first episode with the wrapped intro/outro audio
- `messages/2026-08-16.md` — guest speaker (`podcast_author`) plus two `scripture` references
- `messages/2026-05-17.md`
- `messages/2026-05-10.md`
- `messages/2026-05-03.md`

$ARGUMENTS
