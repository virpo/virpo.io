"use client";

import { useEffect, useRef, useState } from "react";
import { SoundWaveform } from "./SoundWaveform";

export const JAPAN_SOUNDS = [
  {
    title: "Departure melody",
    src: "/audio/aratana.mp3",
    startAt: 0,
    endAt: 4.6,
  },
  {
    title: "Station announcement",
    src: "/audio/japan-station-announce.mp3",
    startAt: 0,
    endAt: 4.5,
  },
  {
    title: "Fare gate",
    src: "/audio/japan-faregate-chime.mp3",
    startAt: 0,
    endAt: 3.4,
  },
  {
    title: "Railway crossing",
    src: "/audio/japan-rail-crossing.mp3",
    startAt: 3.5,
    endAt: 8,
  },
  {
    title: "Cuckoo crossing",
    src: "/audio/japan-crosswalk-cuckoo.mp3",
    startAt: 0,
    endAt: 4,
  },
  {
    title: "FamilyMart entrance",
    src: "/audio/japan-familymart.mp3",
    startAt: 0,
    endAt: 4.6,
  },
  {
    title: "Shinkansen passing",
    src: "/audio/japan-shinkansen-pass.mp3",
    startAt: 1,
    endAt: 5.5,
  },
  {
    title: "Summer cicadas",
    src: "/audio/japan-summer-crickets.mp3",
    startAt: 0.5,
    endAt: 5,
  },
  {
    title: "Fūrin",
    src: "/audio/wind-chime.ogg",
    startAt: 1,
    endAt: 5.5,
  },
] as const;

type AudioGraph = {
  context: AudioContext;
  source: MediaElementAudioSourceNode;
  analyser: AnalyserNode | null;
};

function audioContextConstructor() {
  return (
    window.AudioContext ??
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext
  );
}

export function SoundsToy() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const graphRef = useRef<AudioGraph | null>(null);
  const graphUnavailableRef = useRef(false);
  const operationQueueRef = useRef<Promise<void>>(Promise.resolve());
  const operationTokenRef = useRef(0);
  const pendingOperationsRef = useRef(0);
  const desiredPlayingRef = useRef(false);
  const autoAdvancingRef = useRef(false);
  const indexRef = useRef(0);
  const mountedRef = useRef(true);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [playbackDesired, setPlaybackDesired] = useState(false);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [status, setStatus] = useState("Press play");
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [waveformUnavailable, setWaveformUnavailable] = useState(false);
  const [switching, setSwitching] = useState(false);
  const current = JAPAN_SOUNDS[index];

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = JAPAN_SOUNDS[0].src;
      audioRef.current.currentTime = JAPAN_SOUNDS[0].startAt;
    }
  }, []);

  useEffect(() => {
    if (!window.matchMedia) return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      operationTokenRef.current += 1;
      desiredPlayingRef.current = false;
      audioRef.current?.pause();
      graphRef.current?.source.disconnect?.();
      graphRef.current?.analyser?.disconnect?.();
      void graphRef.current?.context.close();
    };
  }, []);

  useEffect(() => {
    if (analyser) {
      analyser.smoothingTimeConstant = reducedMotion ? 0 : 0.72;
    }
  }, [analyser, reducedMotion]);

  function markWaveformUnavailable() {
    graphUnavailableRef.current = true;
    if (mountedRef.current) {
      setAnalyser(null);
      setWaveformUnavailable(true);
    }
  }

  async function ensureAudioGraph() {
    if (graphRef.current) {
      if (graphRef.current.context.state === "suspended") {
        try {
          await graphRef.current.context.resume();
        } catch {
          markWaveformUnavailable();
          return false;
        }
      }
      return true;
    }
    if (graphUnavailableRef.current) return true;

    const AudioContextClass = audioContextConstructor();
    const audio = audioRef.current;
    if (!AudioContextClass || !audio) {
      markWaveformUnavailable();
      return true;
    }

    let context: AudioContext | null = null;
    let source: MediaElementAudioSourceNode | null = null;

    try {
      context = new AudioContextClass();
      if (context.state === "suspended") await context.resume();

      const nextAnalyser = context.createAnalyser();
      nextAnalyser.fftSize = 64;
      nextAnalyser.smoothingTimeConstant = reducedMotion ? 0 : 0.72;
      source = context.createMediaElementSource(audio);

      try {
        source.connect(nextAnalyser);
        nextAnalyser.connect(context.destination);
        graphRef.current = {
          context,
          source,
          analyser: nextAnalyser,
        };
        if (mountedRef.current) {
          setWaveformUnavailable(false);
          setAnalyser(nextAnalyser);
        }
        return true;
      } catch {
        source.disconnect?.();
        source.connect(context.destination);
        graphRef.current = { context, source, analyser: null };
        markWaveformUnavailable();
        return true;
      }
    } catch {
      if (source && context) {
        // Once a media element is captured it must remain attached to a live
        // AudioContext. A direct route preserves audible playback.
        try {
          source.disconnect?.();
          source.connect(context.destination);
          graphRef.current = { context, source, analyser: null };
        } catch {
          graphRef.current = { context, source, analyser: null };
        }
      } else {
        void context?.close();
      }
      markWaveformUnavailable();
      return true;
    }
  }

  function enqueueOperation(operation: () => Promise<void>) {
    pendingOperationsRef.current += 1;
    setSwitching(true);
    operationQueueRef.current = operationQueueRef.current
      .catch(() => undefined)
      .then(operation)
      .catch(() => undefined)
      .finally(() => {
        pendingOperationsRef.current -= 1;
        if (mountedRef.current && pendingOperationsRef.current === 0) {
          setSwitching(false);
        }
      });
  }

  function requestPlay() {
    const token = ++operationTokenRef.current;
    desiredPlayingRef.current = true;
    setPlaybackDesired(true);
    setPlaybackError(null);
    setStatus("Starting…");

    enqueueOperation(async () => {
      const audio = audioRef.current;
      if (!audio) return;
      const segment = JAPAN_SOUNDS[indexRef.current];
      if (
        audio.currentTime < segment.startAt ||
        audio.currentTime >= segment.endAt
      ) {
        audio.currentTime = segment.startAt;
      }
      const canPlay = await ensureAudioGraph();
      if (!canPlay) {
        audio.pause();
        if (mountedRef.current && token === operationTokenRef.current) {
          desiredPlayingRef.current = false;
          setPlaybackDesired(false);
          setPlaying(false);
          setPlaybackError("Audio unavailable");
        }
        return;
      }

      try {
        await audio.play();
        if (!desiredPlayingRef.current) {
          audio.pause();
          return;
        }
        if (mountedRef.current && token === operationTokenRef.current) {
          setPlaying(true);
          setPlaybackError(null);
          setStatus("Playing");
        }
      } catch {
        if (mountedRef.current && token === operationTokenRef.current) {
          desiredPlayingRef.current = false;
          setPlaybackDesired(false);
          setPlaying(false);
          setPlaybackError("Couldn’t play this sound");
        }
      }
    });
  }

  function requestPause() {
    const token = ++operationTokenRef.current;
    desiredPlayingRef.current = false;
    setPlaybackDesired(false);
    audioRef.current?.pause();
    setPlaying(false);
    setPlaybackError(null);
    setStatus("Paused · press play");

    enqueueOperation(async () => {
      audioRef.current?.pause();
      if (mountedRef.current && token === operationTokenRef.current) {
        setPlaying(false);
      }
    });
  }

  function selectSound(nextIndex: number) {
    const normalized =
      (nextIndex + JAPAN_SOUNDS.length) % JAPAN_SOUNDS.length;
    const token = ++operationTokenRef.current;
    indexRef.current = normalized;
    setIndex(normalized);
    setPlaying(false);
    setPlaybackError(null);
    setStatus(desiredPlayingRef.current ? "Switching…" : "Press play");

    enqueueOperation(async () => {
      const audio = audioRef.current;
      if (!audio) return;
      try {
        audio.pause();
        audio.src = JAPAN_SOUNDS[normalized].src;
        audio.currentTime = JAPAN_SOUNDS[normalized].startAt;

        if (!desiredPlayingRef.current) {
          if (mountedRef.current && token === operationTokenRef.current) {
            setStatus("Press play");
          }
          return;
        }

        await audio.play();
        if (!desiredPlayingRef.current) {
          audio.pause();
          return;
        }
        if (mountedRef.current && token === operationTokenRef.current) {
          setPlaying(true);
          setPlaybackError(null);
          setStatus("Playing");
        }
      } catch {
        if (mountedRef.current && token === operationTokenRef.current) {
          desiredPlayingRef.current = false;
          setPlaybackDesired(false);
          setPlaying(false);
          setPlaybackError("Couldn’t play this sound");
        }
      } finally {
        autoAdvancingRef.current = false;
      }
    });
  }

  function finishSequence() {
    operationTokenRef.current += 1;
    desiredPlayingRef.current = false;
    autoAdvancingRef.current = false;
    setPlaybackDesired(false);
    indexRef.current = 0;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = JAPAN_SOUNDS[0].src;
      audioRef.current.currentTime = JAPAN_SOUNDS[0].startAt;
    }
    setPlaying(false);
    setPlaybackError(null);
    setStatus("Press play");
    setIndex(0);
  }

  function advanceSequence() {
    if (autoAdvancingRef.current) return;
    if (indexRef.current === JAPAN_SOUNDS.length - 1) {
      finishSequence();
      return;
    }
    autoAdvancingRef.current = true;
    selectSound(indexRef.current + 1);
  }

  function handleTimeUpdate() {
    const audio = audioRef.current;
    if (!audio || !desiredPlayingRef.current) return;
    if (audio.currentTime >= JAPAN_SOUNDS[indexRef.current].endAt) {
      advanceSequence();
    }
  }

  function handleEnded() {
    if (desiredPlayingRef.current) {
      advanceSequence();
    }
  }

  const visibleStatus =
    playbackError ??
    (waveformUnavailable ? `${status} · waveform unavailable` : status);

  return (
    <section
      className="tile soundsToy"
      data-sounds-toy
      aria-label="Familiar Japanese Sounds"
    >
      <header className="toyHeading soundsHeading">
        <h2>Familiar Japanese Sounds</h2>
        <span>
          {String(index + 1).padStart(2, "0")} /{" "}
          {String(JAPAN_SOUNDS.length).padStart(2, "0")}
        </span>
      </header>

      <div className="soundsBody">
        <button
          className="soundPlay"
          type="button"
          aria-label={`${playbackDesired ? "Pause" : "Play"} ${current.title}`}
          aria-pressed={playbackDesired}
          onClick={() =>
            desiredPlayingRef.current ? requestPause() : requestPlay()
          }
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            {playbackDesired ? (
              <path d="M6 5h4v14H6V5Zm8 0h4v14h-4V5Z" />
            ) : (
              <path d="m8 5 11 7-11 7V5Z" />
            )}
          </svg>
        </button>

        <SoundWaveform
          analyser={analyser}
          playing={playing}
          reducedMotion={reducedMotion}
        />

        <div className="soundMeta">
          <div>
            <strong>{current.title}</strong>
            <span aria-live="polite">{visibleStatus}</span>
          </div>
          <div
            className="soundSteps"
            role="group"
            aria-label="Sound navigation"
            aria-busy={switching}
          >
            <button
              type="button"
              aria-label="Previous sound"
              onClick={() => selectSound(indexRef.current - 1)}
            >
              <span aria-hidden="true">←</span>
            </button>
            <button
              type="button"
              aria-label="Next sound"
              onClick={() => selectSound(indexRef.current + 1)}
            >
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </div>

      <audio
        ref={audioRef}
        preload="metadata"
        onLoadedMetadata={() => {
          const audio = audioRef.current;
          const segment = JAPAN_SOUNDS[indexRef.current];
          if (
            audio &&
            (audio.currentTime < segment.startAt ||
              audio.currentTime >= segment.endAt)
          ) {
            audio.currentTime = segment.startAt;
          }
        }}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onError={() => {
          operationTokenRef.current += 1;
          desiredPlayingRef.current = false;
          setPlaybackDesired(false);
          setPlaying(false);
          setPlaybackError("Sound unavailable");
        }}
      />
    </section>
  );
}
