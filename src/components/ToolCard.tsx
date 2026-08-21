import type { Tool } from "@/data/tools";

type ToolCardProps = {
  tool: Tool;
};

export default function ToolCard({ tool }: ToolCardProps) {
  return (
    <article className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-zinc-700/60 bg-[#141414] transition-colors hover:border-zinc-600">
      <div
        className="relative aspect-[16/10] w-full"
        style={{ backgroundColor: tool.color }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-5xl font-bold text-white/25 select-none">
            {tool.initial}
          </span>
        </div>
      </div>

      <div className="flex items-start gap-3 p-4">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
          style={{ backgroundColor: tool.color }}
        >
          {tool.initial}
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold text-white">
            {tool.name}
          </h3>
          <p className="mt-0.5 line-clamp-2 text-sm text-zinc-400">
            {tool.description}
          </p>
        </div>
      </div>
    </article>
  );
}
