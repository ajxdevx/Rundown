const PLACEHOLDER_COLORS = [
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
  "#6366f1",
  "#84cc16",
];

export type Tool = {
  id: string;
  name: string;
  description: string;
  category: string;
  color: string;
  initial: string;
};

function pickColor(i: number) {
  return PLACEHOLDER_COLORS[i % PLACEHOLDER_COLORS.length];
}

const names = [
  "Anything",
  "Raycast",
  "Voicenotes",
  "Vellum",
  "Cluely",
  "Rankhog",
  "Notion AI",
  "Perplexity",
  "Midjourney",
  "Runway",
  "Cursor",
  "Framer",
  "Jasper",
  "Copy.ai",
  "ElevenLabs",
  "Descript",
  "Linear",
  "Loom",
  "Gamma",
  "Tome",
];

const descriptions = [
  "Ship products faster with AI-assisted workflows.",
  "Supercharge your desktop productivity.",
  "Capture and organize voice notes instantly.",
  "Build and evaluate LLM apps with confidence.",
  "Research and summarize anything in seconds.",
  "Rank higher with AI-powered SEO insights.",
  "Write, plan, and collaborate with AI.",
  "Ask the web and get cited answers.",
  "Generate stunning visuals from text.",
  "Create and edit video with generative AI.",
  "AI pair programming for modern teams.",
  "Design and publish sites without code.",
  "Marketing copy that converts.",
  "Generate ads, blogs, and social posts.",
  "Natural voice generation and cloning.",
  "Edit audio and video like a doc.",
  "Issue tracking built for speed.",
  "Async video messaging for teams.",
  "Beautiful decks in minutes.",
  "AI storytelling for presentations.",
];

const categories = [
  "Writing",
  "Productivity",
  "Audio & Voice",
  "Coding",
  "Research",
  "SEO",
  "Chat & Assistants",
  "Image",
  "Video",
  "Design",
  "Marketing",
  "Automation",
];

export const featuredTools: Tool[] = Array.from({ length: 8 }, (_, i) => ({
  id: `featured-${i}`,
  name: names[i],
  description: descriptions[i],
  category: categories[i % categories.length],
  color: pickColor(i),
  initial: names[i].charAt(0),
}));

export const tools: Tool[] = Array.from({ length: 12 }, (_, i) => {
  const idx = i + 8;
  return {
    id: `tool-${i}`,
    name: names[idx % names.length],
    description: descriptions[idx % descriptions.length],
    category: categories[idx % categories.length],
    color: pickColor(idx),
    initial: names[idx % names.length].charAt(0),
  };
});
