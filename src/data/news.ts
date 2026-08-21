export type NewsItem = {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  color: string;
  initial: string;
  type: "news" | "article";
};

const colors = [
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
  "#ef4444",
  "#a855f7",
  "#14b8a6",
  "#f97316",
];

function makeItem(
  id: string,
  title: string,
  excerpt: string,
  category: string,
  date: string,
  type: "news" | "article",
  colorIndex: number,
): NewsItem {
  return {
    id,
    title,
    excerpt,
    category,
    date,
    type,
    color: colors[colorIndex % colors.length],
    initial: title.charAt(0).toUpperCase(),
  };
}

export const featuredNews: NewsItem[] = [
  makeItem(
    "featured-1",
    "OpenAI drops a new multimodal model",
    "What builders should know about the release and how it changes product roadmaps.",
    "Breaking",
    "Mar 21, 2026",
    "news",
    0,
  ),
  makeItem(
    "featured-2",
    "The rise of AI agents in startups",
    "Why teams are shipping agent workflows faster than traditional SaaS features.",
    "Insight",
    "Mar 20, 2026",
    "article",
    1,
  ),
  makeItem(
    "featured-3",
    "Rundown Weekly: top tools shipping now",
    "A curated roundup of the strongest launches from the last seven days.",
    "Roundup",
    "Mar 19, 2026",
    "news",
    2,
  ),
];

export const newsItems: NewsItem[] = [
  makeItem(
    "news-1",
    "Google DeepMind publishes new research",
    "Fresh papers on reasoning and efficiency land this week.",
    "Research",
    "Mar 18, 2026",
    "news",
    3,
  ),
  makeItem(
    "news-2",
    "Anthropic expands enterprise offering",
    "New controls and deployment options for larger teams.",
    "Business",
    "Mar 18, 2026",
    "news",
    4,
  ),
  makeItem(
    "news-3",
    "Voice AI funding hits a new high",
    "Investors double down on realtime speech and agents.",
    "Funding",
    "Mar 17, 2026",
    "news",
    5,
  ),
  makeItem(
    "news-4",
    "Apple quietly tests on-device models",
    "Early signals point to deeper local AI across apps.",
    "Products",
    "Mar 16, 2026",
    "news",
    6,
  ),
  makeItem(
    "news-5",
    "Regulation update for EU AI Act",
    "What compliance timelines mean for founders shipping now.",
    "Policy",
    "Mar 15, 2026",
    "news",
    7,
  ),
  makeItem(
    "news-6",
    "Midjourney rolls out new editing tools",
    "Faster iteration for designers and creative teams.",
    "Tools",
    "Mar 14, 2026",
    "news",
    8,
  ),
];

export const articleItems: NewsItem[] = [
  makeItem(
    "article-1",
    "How we built a $1M ARR AI product",
    "A founder story on shipping fast with a lean stack.",
    "Founders",
    "Mar 13, 2026",
    "article",
    9,
  ),
  makeItem(
    "article-2",
    "The best AI writing stack in 2026",
    "Tools that actually improve drafts without fluff.",
    "Guides",
    "Mar 12, 2026",
    "article",
    0,
  ),
  makeItem(
    "article-3",
    "Prompting patterns that scale",
    "Practical techniques product teams use in production.",
    "Playbooks",
    "Mar 11, 2026",
    "article",
    1,
  ),
  makeItem(
    "article-4",
    "Designing AI-first interfaces",
    "UX principles for generative product experiences.",
    "Design",
    "Mar 10, 2026",
    "article",
    2,
  ),
  makeItem(
    "article-5",
    "Evaluating LLM apps in production",
    "Metrics and workflows that catch failures early.",
    "Engineering",
    "Mar 9, 2026",
    "article",
    3,
  ),
  makeItem(
    "article-6",
    "From prototype to paid users",
    "Growth lessons from AI startups that converted.",
    "Growth",
    "Mar 8, 2026",
    "article",
    4,
  ),
];
