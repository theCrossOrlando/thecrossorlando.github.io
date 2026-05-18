---
description: Finish publishing a drafted sermon — uploads the audio, commits, and pushes. Use after /sermon-draft once the title is set.
---

Finish publishing the most recent sermon message. Assumes `messages/YYYY-MM-DD.md` already exists with the correct title.

**Inputs from `$ARGUMENTS`:**
- Optionally a date in `YYYY-MM-DD`. If absent, use the most recent Sunday on or before today.

**Steps:**

1. Determine the date (default: most recent Sunday).
2. Verify `messages/YYYY-MM-DD.md` exists and its `title:` is not `"TBD"`. If title is still `TBD`, stop and tell me to set it.
3. Verify `~/Desktop/YYYY-MM-DD.m4a` exists.
4. Upload: `scp ~/Desktop/YYYY-MM-DD.m4a thecross:~/sermons/`
5. Commit:
   - `git add messages/YYYY-MM-DD.md`
   - `git commit -m "Message: YYYY-MM-DD"`
6. Push: `git push`
7. Report commit SHA.

$ARGUMENTS
