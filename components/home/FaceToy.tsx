"use client";

import { useEffect, useRef } from "react";

const FACE_BASE_URL = "https://face.virpo.sk/faces/";
const MIN_GAZE = -15;
const MAX_GAZE = 15;
const GAZE_STEP = 3;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}

function quantize(value: number) {
  const raw = MIN_GAZE + ((value + 1) * (MAX_GAZE - MIN_GAZE)) / 2;
  return clamp(
    Math.round(raw / GAZE_STEP) * GAZE_STEP,
    MIN_GAZE,
    MAX_GAZE,
  );
}

function sanitize(value: number) {
  return value.toFixed(1).replace("-", "m").replace(".", "p");
}

export function getFaceImageUrl(horizontal: number, vertical: number) {
  return `${FACE_BASE_URL}gaze_px${sanitize(horizontal)}_py${sanitize(vertical)}_256.webp`;
}

export function FaceToy() {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const image = imageRef.current;
    if (
      !container ||
      !image ||
      typeof window.matchMedia !== "function" ||
      !window.matchMedia("(pointer: fine)").matches
    ) {
      return;
    }

    const trackPointer = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const horizontal = clamp(
        (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2),
        -1,
        1,
      );
      const vertical = clamp(
        (rect.top + rect.height / 2 - event.clientY) / (rect.height / 2),
        -1,
        1,
      );

      image.src = getFaceImageUrl(quantize(horizontal), quantize(vertical));
    };

    window.addEventListener("pointermove", trackPointer, { passive: true });
    return () => window.removeEventListener("pointermove", trackPointer);
  }, []);

  return (
    <section className="tile faceToy" aria-label="Peter's interactive face">
      <div className="faceTracker" ref={containerRef}>
        <img
          ref={imageRef}
          className="faceImage"
          src={getFaceImageUrl(0, 0)}
          alt="Peter Hraska"
          width="256"
          height="256"
        />
      </div>
    </section>
  );
}
