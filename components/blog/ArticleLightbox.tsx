"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Shot = { src: string; alt: string; caption: string };

/**
 * Pictures in a post open large on the page instead of in a new tab: a click on any linked image
 * opens it in a dialog. The round close key, a click anywhere outside the picture, or Escape closes
 * it; ← → step through the post's pictures. Without JavaScript the links still open the file.
 */
export function ArticleLightbox({ root }: { root: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const shots = useRef<Shot[]>([]);
  const [index, setIndex] = useState<number | null>(null);

  const open = useCallback((i: number) => {
    setIndex(i);
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  useEffect(() => {
    const container = document.getElementById(root);
    if (!container) return;
    const links = [...container.querySelectorAll<HTMLAnchorElement>("a.articleImageLink")];
    shots.current = links.map((link) => {
      const img = link.querySelector("img");
      const figure = link.closest("figure");
      const caption = link.parentElement?.querySelector(".articleImageCaption")?.textContent ?? figure?.querySelector("figcaption")?.textContent ?? "";
      return { src: link.href, alt: img?.alt ?? "", caption };
    });
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element).closest?.("a.articleImageLink");
      if (!link || event.metaKey || event.ctrlKey || event.shiftKey) return;
      event.preventDefault();
      open(links.indexOf(link as HTMLAnchorElement));
    };
    container.addEventListener("click", onClick);
    return () => container.removeEventListener("click", onClick);
  }, [root, open]);

  const close = () => ref.current?.close();
  const step = (delta: number) => setIndex((i) => (i === null ? i : (i + delta + shots.current.length) % shots.current.length));
  const shot = index === null ? null : shots.current[index];

  return (
    <dialog
      ref={ref}
      className="lightbox"
      aria-label={shot?.alt || "Picture"}
      onClose={() => setIndex(null)}
      onClick={(event) => {
        // a click on the backdrop or the empty space around the picture closes it
        if (!(event.target as Element).closest("img, button")) close();
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") step(1);
        if (event.key === "ArrowLeft") step(-1);
      }}
    >
      {shot ? (
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={shot.src} alt={shot.alt} />
          {shot.caption ? <figcaption>{shot.caption}</figcaption> : null}
        </figure>
      ) : null}
      <button type="button" className="lightboxClose" onClick={close} aria-label="Close" autoFocus>
        <span aria-hidden="true">✕</span>
      </button>
      {shots.current.length > 1 ? (
        <>
          <button type="button" className="lightboxStep" data-dir="prev" onClick={() => step(-1)} aria-label="Previous picture">
            <span aria-hidden="true">←</span>
          </button>
          <button type="button" className="lightboxStep" data-dir="next" onClick={() => step(1)} aria-label="Next picture">
            <span aria-hidden="true">→</span>
          </button>
        </>
      ) : null}
    </dialog>
  );
}
