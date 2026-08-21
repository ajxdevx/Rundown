type TooltipProps = {
  label: string;
  side?: "left" | "right";
};

export default function Tooltip({ label, side = "right" }: TooltipProps) {
  const isRight = side === "right";

  return (
    <span
      className={`pointer-events-none absolute top-1/2 z-[200] w-max -translate-y-1/2 scale-95 opacity-0 transition-all duration-200 ease-out group-hover:scale-100 group-hover:opacity-100 ${
        isRight
          ? "left-full ml-3.5 translate-x-1 group-hover:translate-x-0"
          : "right-full mr-3.5 -translate-x-1 group-hover:translate-x-0"
      }`}
    >
      <span
        className={`relative block w-max whitespace-nowrap rounded-lg bg-[#242424] px-3 py-1.5 text-[13px] font-semibold tracking-tight text-zinc-100 ${
          isRight
            ? "before:absolute before:top-1/2 before:-left-1 before:size-2 before:-translate-y-1/2 before:rotate-45 before:bg-[#242424]"
            : "before:absolute before:top-1/2 before:-right-1 before:size-2 before:-translate-y-1/2 before:rotate-45 before:bg-[#242424]"
        }`}
      >
        {label}
      </span>
    </span>
  );
}
