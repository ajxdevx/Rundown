import NewsCard from "@/components/NewsCard";
import {
  articleItems,
  featuredNews,
  newsItems,
} from "@/data/news";

export default function NewsContent() {
  const [hero, ...restFeatured] = featuredNews;

  return (
    <div className="w-full px-4 py-6 sm:px-5">
      <section className="mb-10">
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <h1 className="font-[family-name:var(--font-brand)] text-2xl font-bold tracking-tight text-white sm:text-3xl">
              News
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Featured stories from the AI world
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <div className="lg:col-span-3">
            {hero && <NewsCard item={hero} large />}
          </div>
          <div className="flex flex-col gap-4 lg:col-span-2">
            {restFeatured.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </section>

      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Latest News</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {newsItems.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Articles</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {articleItems.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
