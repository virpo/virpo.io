"use client";

import { useEffect } from "react";

/** While Peter picks a frame for the pictures in a post, ?frame=1…5 previews the candidates. */
export function FramePreview({ target }: { target: string }) {
  useEffect(() => {
    const frame = new URLSearchParams(location.search).get("frame");
    const article = document.getElementById(target);
    if (article && frame && /^[1-5]$/.test(frame)) article.dataset.frame = frame;
  }, [target]);
  return null;
}
