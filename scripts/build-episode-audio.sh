#!/usr/bin/env bash
# Wrap a bare sermon recording in intro/outro music with a spoken episode ID.
#
#   build-episode-audio.sh <bare-audio> <title> <author> <output.m4a>
#
# Prints SERMON_OFFSET=<seconds> — the point at which the sermon starts in the
# output. Every VTT timestamp must be shifted by that amount or the transcript
# seek buttons land in the wrong place.
#
# Deterministic: identical inputs produce a byte-identical output.
set -euo pipefail

BARE="$1"; TITLE="$2"; AUTHOR="$3"; OUT="$4"
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MUSIC="$REPO/assets/audio/intro-gymnopedie-harp.mp3"
VENV="$HOME/.local/share/thecrossorlando/ttsenv"
VOICE=am_michael

# espeakng-loader ships a build-machine path that does not exist; point it at brew's
export ESPEAK_DATA_PATH=/opt/homebrew/share/espeak-ng-data
export PHONEMIZER_ESPEAK_LIBRARY=/opt/homebrew/lib/libespeak-ng.dylib

MUS_IN=4.0      # music lead-in is near-silent for ~1s and thin until ~4s
MUS_OUT=148.3   # the recording's own ending, which resolves naturally
BED=0.25        # music level under the announcement (-12 dB; harp is sparse)
LIFT=0.35       # brief swell after the announcement, before the sermon enters
FADE=6.5        # linear. curve=exp collapses to silence in ~1s and sounds worse than a hard cut
OVERLAP=5.0     # outro music fades in under the closing words
# -map_metadata -1 below is load-bearing: ffmpeg copies tags from input 0, which is
# the music bed, so without it every episode ships tagged as the Satie recording.

# episode date for the date tag, from the output filename (YYYY-MM-DD.m4a)
EP_DATE=""
if [[ "$(basename "$OUT")" =~ ^([0-9]{4}-[0-9]{2}-[0-9]{2})\. ]]; then EP_DATE="${BASH_REMATCH[1]}"; fi

T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
say() { awk "BEGIN{printf \"%.3f\", $1}"; }
ms()  { awk "BEGIN{printf \"%d\", ($1)*1000+0.5}"; }   # adelay wants integer milliseconds

# --- announcement. "Acts 11 - Collaborative" reads badly aloud; comma instead.
SPOKEN_TITLE="${TITLE// - /, }"
TEXT="You're listening to the Cross Orlando. This week's message is ${SPOKEN_TITLE}, with ${AUTHOR}."
"$VENV/bin/python" "$REPO/scripts/tts-vo.py" "$TEXT" "$VOICE" "$T/vo.wav" >/dev/null
ffmpeg -hide_banner -loglevel error -y -i "$T/vo.wav" \
  -af "loudnorm=I=-18:TP=-3:LRA=7" -ar 22050 -ac 1 "$T/vo_n.wav"
VO_DUR=$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$T/vo_n.wav")

# --- timings derive from the announcement length, so a longer title still lands right
VO_AT=4.0
LIFT_A=$(say "$VO_AT + $VO_DUR + 0.15")
LIFT_B=$(say "$LIFT_A + 0.6")
FADE_A=$(say "$LIFT_B + 0.1")
SERMON_AT=$(say "$FADE_A + 0.4")
INTRO_LEN=$(say "$SERMON_AT + $FADE + 1")

SERMON_DUR=$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$BARE")
OUTRO_AT=$(say "$SERMON_AT + $SERMON_DUR - $OVERLAP")

# --- beds, normalised to a fixed -20 LUFS so the duck maths holds if the track is swapped
ffmpeg -hide_banner -loglevel error -y -ss $MUS_IN -t "$INTRO_LEN" -i "$MUSIC" \
  -af "loudnorm=I=-20:TP=-3:LRA=11,afade=t=in:st=0:d=1.2,aformat=sample_fmts=s16:sample_rates=22050:channel_layouts=mono" "$T/intro.wav"
ffmpeg -hide_banner -loglevel error -y -ss $MUS_OUT -t 18 -i "$MUSIC" \
  -af "loudnorm=I=-20:TP=-3:LRA=11,aformat=sample_fmts=s16:sample_rates=22050:channel_layouts=mono" "$T/outro.wav"

INTRO_VOL="if(lt(t,3.5),1,if(lt(t,4.0),1-(1-$BED)*(t-3.5)/0.5,if(lt(t,$LIFT_A),$BED,if(lt(t,$LIFT_B),$BED+($LIFT-$BED)*(t-$LIFT_A)/0.6,$LIFT))))"
OUTRO_VOL="if(lt(t,$OVERLAP),0.30*t/$OVERLAP,if(lt(t,7.0),0.30+0.70*(t-$OVERLAP)/2.0,1.0))"

ffmpeg -hide_banner -loglevel error -y \
 -i "$T/intro.wav" -i "$T/vo_n.wav" -i "$BARE" -i "$T/outro.wav" \
 -filter_complex "\
 [0]volume='$INTRO_VOL':eval=frame,afade=t=out:st=$FADE_A:d=$FADE:curve=tri[mus];\
 [1]adelay=$(ms "$VO_AT")|$(ms "$VO_AT")[vo];\
 [2]aformat=sample_fmts=s16:sample_rates=22050:channel_layouts=mono,adelay=$(ms "$SERMON_AT")|$(ms "$SERMON_AT")[serm];\
 [3]volume='$OUTRO_VOL':eval=frame,afade=t=out:st=11:d=7:curve=tri,adelay=$(ms "$OUTRO_AT")|$(ms "$OUTRO_AT")[out];\
 [mus][vo][serm][out]amix=inputs=4:normalize=0:duration=longest,\
 loudnorm=I=-16:TP=-2:LRA=7:linear=true,\
 aformat=sample_fmts=s16:sample_rates=22050:channel_layouts=mono[mix]" \
 -map "[mix]" \
 -map_metadata -1 \
 -metadata title="$TITLE" \
 -metadata artist="$AUTHOR" \
 -metadata album_artist="the Cross Orlando" \
 -metadata album="the Cross Orlando" \
 -metadata genre="Podcast" \
 ${EP_DATE:+-metadata date="$EP_DATE"} \
 -c:a "$(ffmpeg -hide_banner -encoders 2>/dev/null | grep -q aac_at && echo aac_at || echo aac)" \
 -b:a 48k -ac 1 -ar 22050 "$OUT"

echo "SERMON_OFFSET=$SERMON_AT"
