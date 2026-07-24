"use client";

import { useEffect, useRef, useState } from "react";
import { SoundWaveform } from "./SoundWaveform";

export const JAPAN_SOUNDS = [
  {
    title: "FamilyMart entrance",
    src: "/audio/japan-familymart.mp3",
  },
  { title: "Door chime", src: "/audio/japan-door-chime.ogg" },
  {
    title: "Cuckoo crossing",
    src: "/audio/japan-crosswalk-cuckoo.mp3",
  },
  {
    title: "Shibuya announcement",
    src: "/audio/japan-mamonaku-shibuya.mp3",
  },
  {
    title: "Rail crossing",
    src: "/audio/japan-rail-crossing.mp3",
  },
  {
    title: "Shinkansen passing",
    src: "/audio/japan-shinkansen-pass.mp3",
  },
  {
    title: "Summer crickets",
    src: "/audio/japan-summer-crickets.mp3",
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
  const indexRef = useRef(0);
  const mountedRef = useRef(true);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
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

  useEffect(
    () => () => {
      mountedRef.current = false;
      operationTokenRef.current += 1;
      desiredPlayingRef.current = false;
      audioRef.current?.pause();
      graphRef.current?.source.disconnect?.();
      graphRef.current?.analyser?.disconnect?.();
      void graphRef.current?.context.close();
    },
    [],
  );

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
        await graphRef.current.context.resume();
      }
      return graphRef.current.analyser;
    }
    if (graphUnavailableRef.current) return null;

    const AudioContextClass = audioContextConstructor();
    const audio = audioRef.current;
    if (!AudioContextClass || !audio) {
      markWaveformUnavailable();
      return null;
    }

    const context = new AudioContextClass();
    let source: MediaElementAudioSourceNode | null = null;

    try {
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
        return nextAnalyser;
      } catch {
        source.disconnect?.();
        source.connect(context.destination);
        graphRef.current = { context, source, analyser: null };
        markWaveformUnavailable();
        return null;
      }
    } catch {
      if (source) {
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
        void context.close();
      }
      markWaveformUnavailable();
      return null;
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
    setPlaybackError(null);
    setStatus("Starting…");

    enqueueOperation(async () => {
      const audio = audioRef.current;
      if (!audio) return;
      await ensureAudioGraph();

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
          setPlaying(false);
          setPlaybackError("Couldn’t play this sound");
        }
      }
    });
  }

  function requestPause() {
    const token = ++operationTokenRef.current;
    desiredPlayingRef.current = false;
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
      audio.pause();
      audio.src = JAPAN_SOUNDS[normalized].src;
      audio.currentTime = 0;

      if (!desiredPlayingRef.current) {
        if (mountedRef.current && token === operationTokenRef.current) {
          setStatus("Press play");
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
          setPlaying(false);
          setPlaybackError("Couldn’t play this sound");
        }
      }
    });
  }

  function handleEnded() {
    const nextIndex = (indexRef.current + 1) % JAPAN_SOUNDS.length;
    operationTokenRef.current += 1;
    desiredPlayingRef.current = false;
    indexRef.current = nextIndex;
    if (audioRef.current) {
      audioRef.current.src = JAPAN_SOUNDS[nextIndex].src;
      audioRef.current.currentTime = 0;
    }
    setPlaying(false);
    setPlaybackError(null);
    setStatus("Press play");
    setIndex(nextIndex);
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
        <span>{JAPAN_SOUNDS.length} field recordings</span>
      </header>

      <div className="soundsBody">
        <button
          className="soundPlay"
          type="button"
          aria-label={`${playing ? "Pause" : "Play"} ${current.title}`}
          aria-pressed={playing}
          onClick={() =>
            desiredPlayingRef.current ? requestPause() : requestPlay()
          }
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            {playing ? (
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
        onEnded={handleEnded}
        onError={() => {
          operationTokenRef.current += 1;
          desiredPlayingRef.current = false;
          setPlaying(false);
          setPlaybackError("Sound unavailable");
        }}
      />
    </section>
  );
}
