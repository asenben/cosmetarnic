import Image from "next/image";

type AvatarProps = {
  name: string;
  // The picture's URL; without one the first letter of the name is shown.
  src?: string | null;
  // Size and text size, e.g. "size-9 text-sm".
  className?: string;
};

export default function Avatar({ name, src, className = "" }: AvatarProps) {
  return (
    <span
      aria-hidden
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-pale font-semibold text-brand uppercase ${className}`}
    >
      {src ? (
        // Served by our own API route, already small and cached, so the image optimizer is skipped.
        <Image src={src} alt="" fill sizes="112px" unoptimized className="object-cover" />
      ) : (
        name.charAt(0)
      )}
    </span>
  );
}
