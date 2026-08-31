---
description: Finish publishing a drafted sermon — wraps the audio with intro/outro, uploads, commits, and pushes. Use after /sermon-draft once the title is set.
---

Finish publishing the most recent sermon message. Assumes `messages/YYYY-MM-DD.md` already exists with the correct title.

**Inputs from `$ARGUMENTS`:**
- Optionally a date in `YYYY-MM-DD`. If absent, use the most recent Sunday on or before today.

**Why this command does audio work.** The published audio opens with a spoken announcement that names the title, so it cannot be built until the title is known — which is exactly what `/sermon-draft` leaves undone. The wrap therefore happens here, and it changes `length`, `duration`, and every transcript timestamp, so those get rewritten too.

**Steps:**

1. Determine the date (default: most recent Sunday).
2. Verify `messages/YYYY-MM-DD.md` exists and its `title:` is not `"TBD"`. If title is still `TBD`, stop and tell me to set it.
3. Verify `~/Desktop/YYYY-MM-DD-bare.m4a` exists (the un-wrapped sermon left by `/sermon-draft`). If only `~/Desktop/YYYY-MM-DD.m4a` exists and no `-bare`, the audio was produced by an older flow — stop and ask me, rather than wrapping an already-wrapped file.
4. Wrap the audio, reading the title from the message file's frontmatter and the speaker from `podcast_author` (defaulting to `Ben Hoyer` when absent):
   ```
   ./scripts/build-episode-audio.sh ~/Desktop/YYYY-MM-DD-bare.m4a "<title>" "<author>" ~/Desktop/YYYY-MM-DD.m4a
   ```
   Capture the printed `SERMON_OFFSET=<seconds>`.
5. Shift the transcript and re-render the body, so the seek buttons match the wrapped audio:
   ```
   node scripts/offset-vtt.mjs /tmp/sermon-YYYY-MM-DD.vtt <SERMON_OFFSET> > /tmp/sermon-YYYY-MM-DD-offset.vtt
   node scripts/render-transcript.mjs /tmp/sermon-YYYY-MM-DD-offset.vtt > /tmp/body-YYYY-MM-DD.html
   ```
   If `/tmp/sermon-YYYY-MM-DD.vtt` is gone (tmp is cleared on reboot), re-transcribe the `-bare` file first — see `/sermon` step 3. Do **not** offset an already-offset VTT; always start from the original.
6. Update `messages/YYYY-MM-DD.md`: replace the transcript body with the newly rendered HTML, and update `length` (`stat -f %z ~/Desktop/YYYY-MM-DD.m4a`) and `duration` (`ffprobe`, `MM:SS`) to describe the **wrapped** file. Leave the other frontmatter keys alone.
7. Verify the build: `npm run build:html`, then confirm the first seek button's `data-t` in `_site/messages/YYYY/MM/DD/index.html` matches the offset from step 4 — if it reads `0`, the un-offset VTT was rendered.
8. Upload: `scp ~/Desktop/YYYY-MM-DD.m4a thecross:~/sermons/`
   - Verify with `curl -sI https://cflcn.org/sermons/YYYY-MM-DD.m4a` — expect `200` and a `content-length` equal to the size from step 6. `ssh thecross ls ~/sermons` will NOT show it; scp chroots to a different root.
9. Commit:
   - `git add messages/YYYY-MM-DD.md`
   - `git commit -m "Message: YYYY-MM-DD"`
10. Stop and ask before pushing. Do not `git push` without an explicit yes in chat.
11. Push: `git push`
12. Post to Slack via incoming webhook stored in env var `SLACK_SERMON_WEBHOOK_URL`. If the var is unset, skip and warn — do NOT prompt or hardcode a URL.
   - Web URL: `https://www.thecrossorlando.org/messages/YYYY/MM/DD/`
   - Read the title out of the message file's frontmatter.
   - `curl -sS -X POST -H 'Content-Type: application/json' --data "{\"text\":\"New message posted: *<title>* — <web URL>\"}" "$SLACK_SERMON_WEBHOOK_URL"`
   - Confirm response is `ok`.
13. Report commit SHA and Slack status.

$ARGUMENTS
