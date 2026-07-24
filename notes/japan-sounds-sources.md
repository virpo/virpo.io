# Japan Sounds Sources

Downloaded on 2026-04-08 and updated on 2026-04-09 for module lab prototypes.

Note: some prototype sounds now come from Freesound previews. Check license fit before shipping them publicly. The strongest replacement `cuckoo` is `CC0`; the current `piyo` and `Mamonaku Shibuya` candidates are `BY-NC`.

- `audio/japan-closed-crossing.mp3`
- `audio/japan-yamanote-approaching.mp3`
- `audio/japan-park-crows.mp3`
- `audio/japan-familymart-welcome.mp3`
  Source: https://www.tiktok.com/@japan_vision_/video/7574165962543467796
  Source title: `These sounds make me miss Japan`
  Added on 2026-07-24 at Peter's request.
  Excerpts: `0–3.116667s`, `6.85–10.066667s`, `15.25–17.783333s`,
  and `17.783333–22.731995s`.
  Notes: the crossing, Yamanote, and crow moments use short crossfaded repeats
  to reach 7.5s. FamilyMart combines the clean Panasonic chime below with the
  clerk greeting from the final TikTok excerpt. The shipped page does not load
  TikTok.

- `audio/japan-tennoji-announcement.mp3`
  Source page: https://freesound.org/people/timcam/sounds/381934/
  Preview file used: https://cdn.freesound.org/previews/381/381934_392538-hq.mp3
  License: CC0 https://creativecommons.org/publicdomain/zero/1.0/
  Excerpt: `15.2–22.7s`
  Notes: 48 kHz stereo source; exported as a 7.5s loudness-matched MP3.

- `audio/japan-minminzemi.mp3`
  Source page: https://commons.wikimedia.org/wiki/File:Singing_cicada_audio.ogg
  Source file: https://commons.wikimedia.org/wiki/Special:Redirect/file/Singing%20cicada%20audio.ogg
  License: CC BY-SA 4.0
  Excerpt: `8.0–15.5s`
  Notes: Minminzemi recorded in Shiki, Saitama; selected by Peter for its
  anime-summer character and exported as a 7.5s loudness-matched MP3.

- `audio/japan-departure-melody.mp3`
  Source: `audio/aratana.mp3`, documented below
  Excerpt: `0–7.5s`

- `audio/japan-railway-crossing-long.mp3`
  Source: `audio/japan-rail-crossing.mp3`, documented below
  Excerpt: `3.5–11.0s`

- `audio/japan-faregate-chime.mp3`
- `audio/japan-crosswalk-cuckoo.mp3`
  Notes: extended to 7.5s with a short crossfaded repeat and loudness-matched
  with the rest of the sequence.

- `audio/japan-door-chime.ogg`
  Source: existing local file copied from `audio/train-chime.ogg`
  Original source: https://commons.wikimedia.org/wiki/Category:Sounds_of_rail_transport_in_Japan
  File path used: `Keio_7103chime_close.ogg`

- `audio/japan-familymart.mp3`
  Source: https://www2.panasonic.biz/jp/densetsu/ha/signal/chime/sounds/product03/ec5347_m02.wav
  Notes: Panasonic convenience-store chime asset, trimmed to 6.44s

- `audio/japan-crosswalk-cuckoo.mp3`
  Source page: https://freesound.org/people/hrhk/sounds/98154/
  Preview file used: https://cdn.freesound.org/previews/98/98154_1301136-lq.mp3
  License: CC0 https://creativecommons.org/publicdomain/zero/1.0/
  Notes: local fallback only now. The module’s preferred prototype source is a YouTube pair-style clip: https://www.youtube.com/watch?v=hwao-5UI754

- `audio/japan-crosswalk-piyo.mp3`
  Source page: https://freesound.org/people/Trinity101/sounds/70051/
  Preview file used: https://cdn.freesound.org/previews/70/70051_1002557-lq.mp3
  License: BY-NC 3.0 https://creativecommons.org/licenses/by-nc/3.0/
  Notes: local fallback only now. The module’s preferred prototype source is a YouTube pair-style clip: https://www.youtube.com/watch?v=opqh-AEiAsw

- `audio/japan-mamonaku-shibuya.mp3`
  Source page: https://freesound.org/people/shojibeat9629/sounds/611457/
  Preview file used: https://cdn.freesound.org/previews/611/611457_13252528-lq.mp3
  License: BY-NC 4.0 https://creativecommons.org/licenses/by-nc/4.0/
  Notes: local fallback only now. The module’s preferred prototype source is a YouTube clip specifically for the Shibuya arrival announcement: https://www.youtube.com/watch?v=MS31alvlsK8

- Japan Sounds YouTube pair sources
  `Cuckoo / Ka-kakko`: https://www.youtube.com/watch?v=hwao-5UI754
  `Piyo / Piyo-piyo`: https://www.youtube.com/watch?v=opqh-AEiAsw
  `Mamonaku Shibuya`: https://www.youtube.com/watch?v=MS31alvlsK8
  Notes: the module now prefers these YouTube sources via the YouTube Iframe API when it can load them. Local audio files remain as fallback so the queue still works if YouTube is blocked.

- `audio/japan-rail-crossing.mp3`
  Source: https://commons.wikimedia.org/wiki/Special:FilePath/Level%20crossing%20in%20Japan%20-%20Tokyo%20-%20near%20Ebaramachi%20Station%20-%202022%20Oct%2024.ogg
  Notes: full 21.08s source kept, per module review

- `audio/japan-summer-crickets.mp3`
  Source: https://commons.wikimedia.org/wiki/Special:FilePath/Suzumushi%2006z3286.ogg
  Notes: trimmed to 10s

- `audio/tokyo-crosswalk.ogg`
  Source: https://commons.wikimedia.org/wiki/File:Toryanse-crosswalk-oji-2011.ogg
  License: Wikimedia Commons file page

- `audio/train-chime.ogg`
  Source: https://commons.wikimedia.org/wiki/Category:Sounds_of_rail_transport_in_Japan
  File path used: `Keio_7103chime_close.ogg`
  License: Wikimedia Commons file/category page

- `audio/wind-chime.ogg`
  Source: https://commons.wikimedia.org/wiki/Special:FilePath/Sound%20of%20Wind%20chime%20in%20slight%20breeze%20include%20daily%20life%20noises.ogg
  License: Wikimedia Commons file path target

- `audio/sh3.mp3`, `audio/seseragi.mp3`, `audio/ogawav1.mp3`, `audio/bellb.mp3`, `audio/melody.mp3`, `audio/aratana.mp3`, `audio/hananohorokobi.mp3`, `audio/thirdman.mp3`
  Source repo: https://github.com/morgansleeper/Yamanotes
  Used for the Yamanote line module and some Japan sounds radio queue items

- `Window Seat` embed
  Source video: https://www.youtube.com/watch?v=RMpM2Qu3QC8
  Title via YouTube oEmbed on 2026-04-09: `Japanese Train ASMR - MOUNT FUJI to TOKYO (Side View) 1 HOUR`
