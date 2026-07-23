type ImageDetails = {
  src: string;
  alt: string;
  caption?: string;
};

const imageDimensions: Record<string, { width: number; height: number }> = {
  "/assets/blog/pegboard-sketch.jpg": { width: 1200, height: 1600 },
  "/assets/blog/pegboard-finished.jpg": { width: 1000, height: 1283 },
};

export function ImagePair({ left, right }: { left: ImageDetails; right: ImageDetails }) {
  return (
    <figure className="articleMedia articleImagePair">
      {[left, right].map((image) => {
        const dimensions = imageDimensions[image.src];

        return (
          <span className="articleImagePairItem" key={image.src}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.src}
              alt={image.alt}
              width={dimensions?.width}
              height={dimensions?.height}
              loading="lazy"
              decoding="async"
            />
            {image.caption ? <span className="articleImageCaption">{image.caption}</span> : null}
          </span>
        );
      })}
    </figure>
  );
}
