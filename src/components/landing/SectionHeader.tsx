type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
  id?: string;
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  className = "",
  id,
}: SectionHeaderProps) {
  const alignClass = align === "center" ? "mx-auto text-center" : "text-left";

  return (
    <div className={`max-w-3xl ${alignClass} ${className}`}>
      {eyebrow ? (
        <p className="text-sm font-medium tracking-wide text-muted sm:text-base">
          {eyebrow}
        </p>
      ) : null}
      <h2
        id={id}
        className={`font-[family-name:var(--font-brand)] text-3xl font-semibold tracking-tight text-ink sm:text-4xl ${
          eyebrow ? "mt-2" : ""
        }`}
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}
