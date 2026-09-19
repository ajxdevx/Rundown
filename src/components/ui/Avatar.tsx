type AvatarProps = {
  name?: string | null;
  src?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

const sizeClass = {
  sm: "size-8 text-xs",
  md: "size-9 text-sm",
  lg: "size-10 text-sm",
  xl: "size-16 text-lg",
} as const;

function initialsFrom(name?: string | null) {
  const cleaned = (name ?? "").trim();
  if (!cleaned) return "?";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return cleaned.slice(0, 2).toUpperCase();
}

export function Avatar({
  name,
  src,
  size = "md",
  className = "",
}: AvatarProps) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        className={`shrink-0 rounded-full object-cover ${sizeClass[size]} ${className}`}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-surface font-semibold tracking-tight text-ink ${sizeClass[size]} ${className}`}
    >
      {initialsFrom(name)}
    </span>
  );
}
