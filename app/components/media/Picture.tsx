import { getImageProps } from "next/image";
import type { CSSProperties } from "react";
import type { Anim, Photo } from "../../data/media";

type Common = {
  className?: string;
  style?: CSSProperties;
  /** Above-the-fold images can opt out of lazy loading. */
  eager?: boolean;
};

// 1×1 transparent GIF: holds the slot (width/height stay set) until the real image.
const BLANK = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

/**
 * Static photo through Next's optimiser (resized, WebP) rendered as a plain <img>,
 * so it costs no client JS. Decorative by default (alt="").
 *
 * Deferred by default: the real src/srcset are attached by MotionDirector once the
 * page is idle, then the image fades in. Nothing decorative competes with the
 * first paint (this is what kept mobile LCP high). `eager` opts out.
 */
export function Photo({ photo, sizes, alt = "", className, style, eager }: Common & {
  photo: Photo;
  sizes: string;
  alt?: string;
}) {
  const { props } = getImageProps({
    src: photo.src,
    width: photo.width,
    height: photo.height,
    alt,
    sizes,
    loading: eager ? "eager" : "lazy",
  });
  const merged = { ...props.style, ...style };
  if (eager) {
    // eslint-disable-next-line @next/next/no-img-element -- optimised via getImageProps
    return <img {...props} alt={alt} className={className} style={merged} />;
  }
  const { src, srcSet, sizes: sz, ...rest } = props;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- optimised via getImageProps
    <img
      {...rest}
      src={BLANK}
      data-defer=""
      data-src={src}
      data-srcset={srcSet}
      data-sizes={sz}
      alt={alt}
      className={className}
      style={merged}
    />
  );
}

/**
 * Animated WebP. Served as-is (the optimiser would flatten it). It starts on its
 * tiny still frame; MotionDirector swaps in the live animation only once the page
 * is idle and the area is on screen (and back to the still while paused or
 * off-screen). This keeps ~1 MB of animation out of the critical loading path.
 * Under prefers-reduced-motion the <source> pins the still frame.
 */
export function AnimatedImage({ anim, className, style, eager }: Common & { anim: Anim }) {
  return (
    <picture>
      <source media="(prefers-reduced-motion: reduce)" srcSet={anim.still} />
      {/* Animated WebP bypasses the optimiser, which would flatten it to one frame. */}
      <img
        src={anim.still}
        data-live={anim.src}
        data-still={anim.still}
        width={anim.width}
        height={anim.height}
        alt=""
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        className={className}
        style={style}
      />
    </picture>
  );
}
