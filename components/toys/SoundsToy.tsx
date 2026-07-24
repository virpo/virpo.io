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
  analyser: AnalyserNode;
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
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [status, setStatus] = useState("Press play");
  const [waveformUnavailable, setWaveformUnavailable] = useState(false);
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
      audioRef.current?.pause();
      graphRef.current?.source.disconnect?.();
      graphRef.current?.analyser.disconnect?.();
      void graphRef.current?.context.close();
    },
    [],
  );

  useEffect(() => {
    if (analyser) {
      analyser.smoothingTimeConstant = reducedMotion ? 0 : 0.72;
    }
  }, [analyser, reducedMotion]);

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
      graphUnavailableRef.current = true;
      setWaveformUnavailable(true);
      return null;
    }

    let context: AudioContext | null = null;
    try {
      context = new AudioContextClass();
      const source = context.createMediaElementSource(audio);
      const nextAnalyser = context.createAnalyser();
      nextAnalyser.fftSize = 64;
      nextAnalyser.smoothingTimeConstant = reducedMotion ? 0 : 0.72;
      source.connect(nextAnalyser);
      nextAnalyser.connect(context.destination);
      graphRef.current = {
        context,
        source,
        analyser: nextAnalyser,
      };
      if (context.state === "suspended") await context.resume();
      setWaveformUnavailable(false);
      setAnalyser(nextAnalyser);
      return nextAnalyser;
    } catch {
      graphUnavailableRef.current = true;
      setWaveformUnavailable(true);
      void context?.close();
      return null;
    }
  }

  async function play() {
    const audio = audioRef.current;
    if (!audio) return;
    await ensureAudioGraph();
    try {
      await audio.play();
      setPlaying(true);
      setStatus("Playing");
    } catch {
      setPlaying(false);
      setStatus("Couldn’t play this sound");
    }
  }

  function pause() {
    audioRef.current?.pause();
    setPlaying(false);
    setStatus("Paused · press play");
  }

  async function selectSound(nextIndex: number) {
    const audio = audioRef.current;
    const normalized =
      (nextIndex + JAPAN_SOUNDS.length) % JAPAN_SOUNDS.length;
    const continuePlaying = playing;
    setIndex(normalized);
    setPlaying(false);
    if (!audio) return;
    audio.pause();
    audio.src = JAPAN_SOUNDS[normalized].src;
    audio.currentTime = 0;
    if (continuePlaying) {
      try {
        await audio.play();
        setPlaying(true);
        setStatus("Playing");
      } catch {
        setStatus("Couldn’t play this sound");
      }
    } else {
      setStatus("Press play");
    }
  }

  function handleEnded() {
    const nextIndex = (index + 1) % JAPAN_SOUNDS.length;
    if (audioRef.current) {
      audioRef.current.src = JAPAN_SOUNDS[nextIndex].src;
      audioRef.current.currentTime = 0;
    }
    setPlaying(false);
    setStatus("Press play");
    setIndex(nextIndex);
  }

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
          onClick={playing ? pause : play}
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
            <span aria-live="polite">
              {waveformUnavailable
                ? "Live waveform unavailable · audio still plays"
                : status}
            </span>
          </div>
          <div className="soundSteps">
            <button
              type="button"
              aria-label="Previous sound"
              onClick={() => void selectSound(index - 1)}
            >
              <span aria-hidden="true">←</span>
            </button>
            <button
              type="button"
              aria-label="Next sound"
              onClick={() => void selectSound(index + 1)}
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
          setPlaying(false);
          setStatus("Sound unavailable");
        }}
      />
    </section>
  );
}
