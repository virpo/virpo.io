import type { ComponentPropsWithoutRef } from "react";
import { imageDimensions } from "./media-dimensions";

export function ArticleImage({ src, alt = "", title, ...props }: ComponentPropsWithoutRef<"img">) {
  const dimensions = typeof src === "string" ? imageDimensions[src] : undefined;

  return (
    <figure className="articleMedia">
      {/* Static-exported local editorial images do not need Next image processing. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        {...props}
        src={src}
        alt={alt}
        title={undefined}
        width={dimensions?.width}
        height={dimensions?.height}
        loading="lazy"
        decoding="async"
      />
      {title ? <figcaption>{title}</figcaption> : null}
    </figure>
  );
}
