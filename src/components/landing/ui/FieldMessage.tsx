"use client";

type FieldMessageProps = {
  id?: string;
  children: string;
  tone?: "error" | "hint" | "success";
};

export function FieldMessage({
  id,
  children,
  tone = "error",
}: FieldMessageProps) {
  const toneClass =
    tone === "error"
      ? "text-danger"
      : tone === "success"
        ? "text-success"
        : "text-muted-soft";

  return (
    <p
      id={id}
      className={`mt-1.5 text-xs ${toneClass}`}
      role={tone === "error" ? "alert" : undefined}
    >
      {children}
    </p>
  );
}
