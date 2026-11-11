import { getImageProps } from "next/image";
import type { MachineConfig } from "../data/machines";

/**
 * Decorative machine PNG. Uses getImageProps so the image is still resized and
 * served as WebP by Next, but renders a plain <img> with no client-side JS.
 * `data-emitter` lets the fog/bubble layer find the nozzle's reference box.
 */
export function MachineImage({
  machine,
  sizes,
  className,
}: {
  machine: MachineConfig;
  sizes: string;
  className?: string;
}) {
  const { props } = getImageProps({
    src: machine.src,
    alt: "",
    width: machine.width,
    height: machine.height,
    sizes,
  });
  return (
    <div data-emitter="" aria-hidden="true" className={className}>
      {/* eslint-disable-next-line @next/next/no-img-element -- optimised via getImageProps */}
      <img {...props} alt="" className="h-auto w-full" />
    </div>
  );
}
