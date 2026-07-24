"use client";

import { useEffect, useRef } from "react";

const BAR_COUNT = 24;

function idleEnergy(index: number) {
  return 0.13 + ((index * 7) % 6) * 0.055 + Math.sin(index * 1.7) * 0.035;
}

function paintBars(
  canvas: HTMLCanvasElement,
  values: ArrayLike<number> | null,
  smoothed: number[],
  reducedMotion: boolean,
) {
  if (typeof CanvasRenderingContext2D === "undefined") return;
  const context = canvas.getContext("2d");
  if (!context) return;

  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(240, Math.round(canvas.clientWidth || 320));
  const height = Math.max(64, Math.round(canvas.clientHeight || 80));
  const pixelWidth = Math.round(width * ratio);
  const pixelHeight = Math.round(height * ratio);
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }

  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#090909";

  const gap = Math.max(3, width * 0.012);
  const barWidth = Math.max(3, (width - gap * (BAR_COUNT - 1)) / BAR_COUNT);
  const center = height / 2;

  for (let index = 0; index < BAR_COUNT; index += 1) {
    const bin = values
      ? values[Math.floor((index / BAR_COUNT) * values.length)] / 255
      : idleEnergy(index);
    const target = Math.max(0.1, Math.min(1, bin));
    smoothed[index] = reducedMotion
      ? target
      : smoothed[index] * 0.68 + target * 0.32;
    const barHeight = Math.max(8, smoothed[index] * height * 0.9);
    const x = index * (barWidth + gap);
    const y = center - barHeight / 2;
    context.beginPath();
    context.roundRect(x, y, barWidth, barHeight, barWidth / 2);
    context.fill();
  }
}

export function SoundWaveform({
  analyser,
  playing,
  reducedMotion,
}: {
  analyser: AnalyserNode | null;
  playing: boolean;
  reducedMotion: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const smoothed = Array.from({ length: BAR_COUNT }, (_, index) =>
      idleEnergy(index),
    );
    let frame = 0;
    let cancelled = false;

    if (!playing || !analyser) {
      paintBars(canvas, null, smoothed, reducedMotion);
      return;
    }

    const frequencyData = new Uint8Array(analyser.frequencyBinCount);
    const draw = () => {
      if (cancelled) return;
      analyser.getByteFrequencyData(frequencyData);
      paintBars(canvas, frequencyData, smoothed, reducedMotion);
      frame = window.requestAnimationFrame?.(draw) ?? 0;
    };
    draw();

    return () => {
      cancelled = true;
      window.cancelAnimationFrame?.(frame);
    };
  }, [analyser, playing, reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className="soundWaveform"
      role="img"
      aria-label="Sound waveform"
      data-waveform-state={playing && analyser ? "live" : "idle"}
      data-reduced-motion={String(reducedMotion)}
    >
      Audio-reactive frequency bars for the current sound.
    </canvas>
  );
}
