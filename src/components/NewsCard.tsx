import type { NewsItem } from "@/data/news";

type NewsCardProps = {
  item: NewsItem;
  large?: boolean;
};

export default function NewsCard({ item, large = false }: NewsCardProps) {
  return (
    <article className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-zinc-700/60 bg-[#141414] hover-soft">
      <div
        className={`relative w-full ${large ? "aspect-[16/9]" : "aspect-[16/10]"}`}
        style={{ backgroundColor: item.color }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-5xl font-bold text-white/20 select-none">
            {item.initial}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-center gap-2 text-xs text-zinc-500">
          <span className="rounded-md bg-zinc-800 px-2 py-0.5 font-medium text-zinc-300">
            {item.category}
          </span>
          <span>{item.date}</span>
        </div>
        <h3
          className={`font-semibold text-white ${
            large ? "text-xl tracking-tight" : "text-[15px]"
          }`}
        >
          {item.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm text-zinc-400">
          {item.excerpt}
        </p>
      </div>
    </article>
  );
}
