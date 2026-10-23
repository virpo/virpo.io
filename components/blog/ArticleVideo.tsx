/** A short muted loop in a post: plays inline like a GIF, with a still poster until it loads. */
export function ArticleVideo({ src, poster, title, label }: { src: string; poster?: string; title?: string; label: string }) {
  return (
    <figure className="articleMedia">
      <video src={src} poster={poster} autoPlay muted loop playsInline preload="metadata" aria-label={label} width={1280} height={720} />
      {title ? <figcaption>{title}</figcaption> : null}
    </figure>
  );
}
