export type SearchItem = {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  initial: string;
  href?: string;
};

export type SearchSection = {
  id: string;
  label: string;
  items: SearchItem[];
};

function item(
  id: string,
  title: string,
  subtitle: string,
  color: string,
  href?: string,
): SearchItem {
  return {
    id,
    title,
    subtitle,
    color,
    initial: title.charAt(0).toUpperCase(),
    href,
  };
}

export const searchSections: SearchSection[] = [
  {
    id: "tools",
    label: "Tools",
    items: [],
  },
  {
    id: "discover",
    label: "Discover",
    items: [
      item("discover-1", "Fresh finds", "New tools added this week", "#14b8a6"),
      item("discover-2", "Hidden gems", "Underrated AI apps worth trying", "#f59e0b"),
      item("discover-3", "Editor picks", "Hand-picked by the Rondex team", "#ec4899"),
    ],
  },
  {
    id: "competition",
    label: "Competition",
    items: [
      item("comp-1", "Build challenge", "Ship an AI demo in 48 hours", "#f97316"),
      item("comp-2", "Prompt battle", "Best prompt wins community votes", "#8b5cf6"),
      item("comp-3", "Startup sprint", "Compete for featured placement", "#ef4444"),
    ],
  },
  {
    id: "trending",
    label: "Trending",
    items: [
      item("trend-1", "Voice agents", "Rising fast across product teams", "#06b6d4"),
      item("trend-2", "AI design kits", "Most saved tools this month", "#a855f7"),
      item("trend-3", "Auto research", "Top searched category right now", "#10b981"),
    ],
  },
  {
    id: "news",
    label: "News",
    items: [
      item("news-1", "How we built a $1M ARR AI...", "A founder story on shipping fast", "#ec4899"),
      item("news-2", "The best AI writing stack in 2026", "Tools that improve your drafts", "#f59e0b"),
      item("news-3", "Prompting patterns that scale", "Practical techniques for teams", "#06b6d4"),
      item("news-4", "Designing AI-first products", "UX for generative interfaces", "#a855f7"),
      item("news-5", "Evaluating LLM apps", "Metrics that catch failures early", "#14b8a6"),
      item("news-6", "From prototype to paid users", "Growth lessons from AI startups", "#f97316"),
    ],
  },
  {
    id: "collections",
    label: "Collections",
    items: [
      item("col-1", "Solo founder stack", "Everything to ship alone", "#3b82f6"),
      item("col-2", "Content studio", "Writing, video, and voice tools", "#8b5cf6"),
      item("col-3", "Dev productivity", "Coding assistants and workflows", "#10b981"),
    ],
  },
];

export const allSearchItems: SearchItem[] = searchSections.flatMap(
  (section) => section.items,
);
