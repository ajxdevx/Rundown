import FeaturedCarousel from "@/components/FeaturedCarousel";
import SubmitToolBar from "@/components/SubmitToolBar";
import ToolCard from "@/components/ToolCard";
import { tools } from "@/data/tools";

export default function HomeContent() {
  return (
    <div className="w-full px-4 py-6 sm:px-5">
      <section className="mb-8">
        <FeaturedCarousel />
      </section>

      <section className="mb-8">
        <SubmitToolBar />
      </section>

      <section>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </section>
    </div>
  );
}
