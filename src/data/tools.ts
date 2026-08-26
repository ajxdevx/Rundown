import { supabase } from "@/lib/supabase";

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

export type NamedItem = {
  name: string;
  slug: string;
};

export type ToolMedia = {
  id: string;
  url: string;
  altText: string | null;
  sortOrder: number;
  mediaType: string | null;
};

export type ToolReview = {
  id: string;
  toolId: string;
  userId: string;
  rating: number;
  reviewText: string | null;
  createdAt: string;
  updatedAt: string;
  authorName: string | null;
  authorAvatar: string | null;
};

export type ToolFaqItem = {
  question: string;
  answer: string;
};

export type ToolContent = {
  about: string | null;
  whatIsIt: string | null;
  whoIsItFor: string | null;
  howItWorks: string | null;
  pricingDetails: string | null;
  pros: string[];
  cons: string[];
  honestReview: string | null;
  faq: ToolFaqItem[];
};

/** Frontend tool shape used by cards / carousel / detail. */
export type Tool = {
  id: string;
  name: string;
  description: string;
  fullDescription: string | null;
  category: string;
  categorySlug: string | null;
  color: string;
  initial: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  pricingType: string | null;
  startingPrice: number | null;
  currency: string | null;
  billingPeriod: string | null;
  company: string | null;
  companySlug: string | null;
  isFeatured: boolean;
  isTrending: boolean;
  isVerified: boolean;
  features: NamedItem[];
  tags: NamedItem[];
  screenshots: ToolMedia[];
  reviews: ToolReview[];
  ratingAvg: number | null;
  ratingCount: number;
  updatedAt: string | null;
  slug: string;
  content: ToolContent | null;
};

type NamedRel = {
  id?: string;
  name: string;
  slug?: string;
  logo_url?: string | null;
};

type MediaRow = {
  id: string;
  url: string;
  alt_text: string | null;
  sort_order: number | null;
  media_type: string | null;
};

type ReviewRow = {
  id: string;
  tool_id: string;
  user_id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  updated_at: string;
};

type ContentRow = {
  about: string | null;
  what_is_it: string | null;
  who_is_it_for: string | null;
  how_it_works: string | null;
  pricing_details: string | null;
  pros: unknown;
  cons: unknown;
  honest_review: string | null;
  faq: unknown;
};

type ToolRow = {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  logo_url: string | null;
  website_url: string | null;
  pricing_type: string | null;
  starting_price: number | null;
  currency: string | null;
  billing_period: string | null;
  is_featured: boolean | null;
  is_trending: boolean | null;
  is_verified: boolean | null;
  status: string;
  updated_at: string | null;
  company: NamedRel | NamedRel[] | null;
  category: NamedRel | NamedRel[] | null;
  tool_features:
    | {
        feature: NamedRel | NamedRel[] | null;
      }[]
    | null;
  tool_tags:
    | {
        tag: NamedRel | NamedRel[] | null;
      }[]
    | null;
  tool_media?: MediaRow[] | null;
  tool_reviews?: ReviewRow[] | null;
  tool_content?: ContentRow | ContentRow[] | null;
};

function pickColor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PLACEHOLDER_COLORS[Math.abs(hash) % PLACEHOLDER_COLORS.length];
}

function asOne<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function relItem(
  value: NamedRel | NamedRel[] | null | undefined,
): NamedItem | null {
  const item = asOne(value);
  if (!item?.name) return null;
  return {
    name: item.name,
    slug: item.slug || item.name.toLowerCase().replace(/\s+/g, "-"),
  };
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function asFaqList(value: unknown): ToolFaqItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const question =
        typeof row.question === "string" ? row.question.trim() : "";
      const answer = typeof row.answer === "string" ? row.answer.trim() : "";
      if (!question && !answer) return null;
      return { question, answer };
    })
    .filter((item): item is ToolFaqItem => Boolean(item));
}

function mapToolContent(
  value: ContentRow | ContentRow[] | null | undefined,
): ToolContent | null {
  const row = asOne(value);
  if (!row) return null;

  const content: ToolContent = {
    about: row.about?.trim() || null,
    whatIsIt: row.what_is_it?.trim() || null,
    whoIsItFor: row.who_is_it_for?.trim() || null,
    howItWorks: row.how_it_works?.trim() || null,
    pricingDetails: row.pricing_details?.trim() || null,
    pros: asStringList(row.pros),
    cons: asStringList(row.cons),
    honestReview: row.honest_review?.trim() || null,
    faq: asFaqList(row.faq),
  };

  const hasAny =
    content.about ||
    content.whatIsIt ||
    content.whoIsItFor ||
    content.howItWorks ||
    content.pricingDetails ||
    content.honestReview ||
    content.pros.length > 0 ||
    content.cons.length > 0 ||
    content.faq.length > 0;

  return hasAny ? content : null;
}

async function attachReviewAuthors(
  reviews: ToolReview[],
): Promise<ToolReview[]> {
  const ids = [...new Set(reviews.map((r) => r.userId).filter(Boolean))];
  if (ids.length === 0) return reviews;

  const { data } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", ids);

  const byId = new Map(
    (data ?? []).map((p) => [
      p.id as string,
      {
        name:
          (p.display_name as string | null) ||
          (p.username as string | null) ||
          null,
        avatar: (p.avatar_url as string | null) || null,
      },
    ]),
  );

  return reviews.map((review) => {
    const author = byId.get(review.userId);
    return {
      ...review,
      authorName: author?.name ?? null,
      authorAvatar: author?.avatar ?? null,
    };
  });
}

export function mapToolRow(row: ToolRow): Tool {
  const features = (row.tool_features ?? [])
    .map((item) => relItem(item.feature))
    .filter((item): item is NamedItem => Boolean(item));

  const tags = (row.tool_tags ?? [])
    .map((item) => relItem(item.tag))
    .filter((item): item is NamedItem => Boolean(item));

  const company = relItem(row.company);
  const category = relItem(row.category);

  const screenshots = [...(row.tool_media ?? [])]
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((media) => ({
      id: media.id,
      url: media.url,
      altText: media.alt_text,
      sortOrder: media.sort_order ?? 0,
      mediaType: media.media_type,
    }));

  const reviews: ToolReview[] = [...(row.tool_reviews ?? [])]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .map((review) => ({
      id: review.id,
      toolId: review.tool_id,
      userId: review.user_id,
      rating: review.rating,
      reviewText: review.review_text,
      createdAt: review.created_at,
      updatedAt: review.updated_at,
      authorName: null,
      authorAvatar: null,
    }));

  const ratingCount = reviews.length;
  const ratingAvg =
    ratingCount > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / ratingCount
      : null;

  return {
    id: row.id,
    name: row.name,
    description: row.short_description?.trim() || row.name,
    fullDescription: row.description?.trim() || null,
    category: category?.name ?? "Uncategorized",
    categorySlug: category?.slug ?? null,
    color: pickColor(row.slug || row.name),
    initial: row.name.charAt(0).toUpperCase(),
    logoUrl: row.logo_url,
    websiteUrl: row.website_url,
    pricingType: row.pricing_type,
    startingPrice: row.starting_price,
    currency: row.currency,
    billingPeriod: row.billing_period,
    company: company?.name ?? null,
    companySlug: company?.slug ?? null,
    isFeatured: Boolean(row.is_featured),
    isTrending: Boolean(row.is_trending),
    isVerified: Boolean(row.is_verified),
    features,
    tags,
    screenshots,
    reviews,
    ratingAvg,
    ratingCount,
    updatedAt: row.updated_at ?? null,
    slug: row.slug,
    content: mapToolContent(row.tool_content),
  };
}

const TOOLS_SELECT = `
  id,
  name,
  slug,
  short_description,
  description,
  logo_url,
  website_url,
  pricing_type,
  starting_price,
  currency,
  billing_period,
  is_featured,
  is_trending,
  is_verified,
  status,
  updated_at,
  company:companies(id, name, slug, logo_url),
  category:categories!tools_primary_category_id_fkey(id, name, slug),
  tool_features(feature:features(id, name, slug)),
  tool_tags(tag:tags(id, name, slug)),
  tool_media(id, url, alt_text, sort_order, media_type),
  tool_reviews(id, tool_id, user_id, rating, review_text, created_at, updated_at)
`;

/** Lighter select for grids/carousels — skips media + reviews. */
const TOOLS_LIST_SELECT = `
  id,
  name,
  slug,
  short_description,
  description,
  logo_url,
  website_url,
  pricing_type,
  starting_price,
  currency,
  billing_period,
  is_featured,
  is_trending,
  is_verified,
  status,
  updated_at,
  company:companies(id, name, slug, logo_url),
  category:categories!tools_primary_category_id_fkey(id, name, slug),
  tool_features(feature:features(id, name, slug)),
  tool_tags(tag:tags(id, name, slug))
`;

const TOOL_DETAIL_SELECT = `
  ${TOOLS_SELECT.trim()},
  tool_content(
    about,
    what_is_it,
    who_is_it_for,
    how_it_works,
    pricing_details,
    pros,
    cons,
    honest_review,
    faq
  )
`;

async function hydrateTools(
  rows: ToolRow[],
  options?: { withAuthors?: boolean },
): Promise<Tool[]> {
  const tools = rows.map(mapToolRow);
  if (options?.withAuthors === false) return tools;

  const allReviews = tools.flatMap((tool) => tool.reviews);
  if (allReviews.length === 0) return tools;

  const withAuthors = await attachReviewAuthors(allReviews);
  const byId = new Map(withAuthors.map((review) => [review.id, review]));

  return tools.map((tool) => ({
    ...tool,
    reviews: tool.reviews.map((review) => byId.get(review.id) ?? review),
  }));
}

function mapListRows(rows: unknown[]): Tool[] {
  return (rows as ToolRow[]).map(mapToolRow);
}

export async function fetchActiveTools(): Promise<{
  tools: Tool[];
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("tools")
    .select(TOOLS_LIST_SELECT)
    .eq("status", "active")
    .order("name", { ascending: true });

  if (error) {
    return { tools: [], error: error.message || "Failed to load tools" };
  }

  return { tools: mapListRows(data ?? []), error: null };
}

export async function fetchActiveToolBySlug(slug: string): Promise<{
  tool: Tool | null;
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("tools")
    .select(TOOL_DETAIL_SELECT)
    .eq("status", "active")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    return { tool: null, error: error.message || "Failed to load tool" };
  }

  if (!data) {
    return { tool: null, error: null };
  }

  const [tool] = await hydrateTools([data as unknown as ToolRow]);
  return { tool, error: null };
}

export async function searchActiveTools(query: string): Promise<{
  tools: Tool[];
  error: string | null;
}> {
  const q = query.trim();
  if (!q) return fetchActiveTools();

  const { data, error } = await supabase
    .from("tools")
    .select(TOOLS_LIST_SELECT)
    .eq("status", "active")
    .or(
      `name.ilike.%${q}%,short_description.ilike.%${q}%,description.ilike.%${q}%`,
    )
    .order("name", { ascending: true })
    .limit(40);

  if (error) {
    return { tools: [], error: error.message || "Failed to search tools" };
  }

  return { tools: mapListRows(data ?? []), error: null };
}

export async function fetchToolsByCategorySlug(slug: string): Promise<{
  title: string;
  description: string | null;
  tools: Tool[];
  error: string | null;
  notFound: boolean;
}> {
  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id, name, slug, description")
    .eq("slug", slug)
    .maybeSingle();

  if (categoryError) {
    return {
      title: slug,
      description: null,
      tools: [],
      error: categoryError.message,
      notFound: false,
    };
  }
  if (!category) {
    return {
      title: slug,
      description: null,
      tools: [],
      error: null,
      notFound: true,
    };
  }

  const { data, error } = await supabase
    .from("tools")
    .select(TOOLS_LIST_SELECT)
    .eq("status", "active")
    .eq("primary_category_id", category.id)
    .order("name", { ascending: true });

  if (error) {
    return {
      title: category.name,
      description: category.description ?? null,
      tools: [],
      error: error.message,
      notFound: false,
    };
  }

  return {
    title: category.name,
    description: category.description ?? null,
    tools: mapListRows(data ?? []),
    error: null,
    notFound: false,
  };
}

export async function fetchToolsByCompanySlug(slug: string): Promise<{
  title: string;
  tools: Tool[];
  error: string | null;
}> {
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (companyError) {
    return { title: slug, tools: [], error: companyError.message };
  }
  if (!company) {
    return { title: slug, tools: [], error: null };
  }

  const { data, error } = await supabase
    .from("tools")
    .select(TOOLS_LIST_SELECT)
    .eq("status", "active")
    .eq("company_id", company.id)
    .order("name", { ascending: true });

  if (error) {
    return { title: company.name, tools: [], error: error.message };
  }

  return {
    title: company.name,
    tools: mapListRows(data ?? []),
    error: null,
  };
}

export async function fetchToolsByFeatureSlug(slug: string): Promise<{
  title: string;
  tools: Tool[];
  error: string | null;
}> {
  const { data: feature, error: featureError } = await supabase
    .from("features")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (featureError) {
    return { title: slug, tools: [], error: featureError.message };
  }
  if (!feature) {
    return { title: slug, tools: [], error: null };
  }

  const { data: links, error: linkError } = await supabase
    .from("tool_features")
    .select("tool_id")
    .eq("feature_id", feature.id);

  if (linkError) {
    return { title: feature.name, tools: [], error: linkError.message };
  }

  const toolIds = (links ?? []).map((row) => row.tool_id as string);
  if (toolIds.length === 0) {
    return { title: feature.name, tools: [], error: null };
  }

  const { data, error } = await supabase
    .from("tools")
    .select(TOOLS_LIST_SELECT)
    .eq("status", "active")
    .in("id", toolIds)
    .order("name", { ascending: true });

  if (error) {
    return { title: feature.name, tools: [], error: error.message };
  }

  return {
    title: feature.name,
    tools: mapListRows(data ?? []),
    error: null,
  };
}

export async function fetchToolsByTagSlug(slug: string): Promise<{
  title: string;
  tools: Tool[];
  error: string | null;
}> {
  const { data: tag, error: tagError } = await supabase
    .from("tags")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (tagError) {
    return { title: slug, tools: [], error: tagError.message };
  }
  if (!tag) {
    return { title: slug, tools: [], error: null };
  }

  const { data: links, error: linkError } = await supabase
    .from("tool_tags")
    .select("tool_id")
    .eq("tag_id", tag.id);

  if (linkError) {
    return { title: tag.name, tools: [], error: linkError.message };
  }

  const toolIds = (links ?? []).map((row) => row.tool_id as string);
  if (toolIds.length === 0) {
    return { title: tag.name, tools: [], error: null };
  }

  const { data, error } = await supabase
    .from("tools")
    .select(TOOLS_LIST_SELECT)
    .eq("status", "active")
    .in("id", toolIds)
    .order("name", { ascending: true });

  if (error) {
    return { title: tag.name, tools: [], error: error.message };
  }

  return {
    title: tag.name,
    tools: mapListRows(data ?? []),
    error: null,
  };
}

export async function fetchToolsByIds(ids: string[]): Promise<{
  tools: Tool[];
  error: string | null;
}> {
  if (ids.length === 0) return { tools: [], error: null };

  const { data, error } = await supabase
    .from("tools")
    .select(TOOLS_LIST_SELECT)
    .eq("status", "active")
    .in("id", ids);

  if (error) {
    return { tools: [], error: error.message || "Failed to load tools" };
  }

  const tools = mapListRows(data ?? []);
  const order = new Map(ids.map((id, index) => [id, index]));
  tools.sort(
    (a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999),
  );
  return { tools, error: null };
}

/** Featured carousel source: featured → trending → first tools. */
export function getFeaturedTools(tools: Tool[], limit = 8): Tool[] {
  const featured = tools.filter((tool) => tool.isFeatured);
  if (featured.length > 0) return featured.slice(0, limit);

  const trending = tools.filter((tool) => tool.isTrending);
  if (trending.length > 0) return trending.slice(0, limit);

  return tools.slice(0, limit);
}

/** Decorative previews for the auth modal only — not the catalog. */
const SHOWCASE_DEFAULTS = {
  fullDescription: null,
  websiteUrl: null,
  startingPrice: null,
  currency: null,
  billingPeriod: null,
  isVerified: false,
  logoUrl: null,
  pricingType: null,
  company: null,
  companySlug: null,
  categorySlug: null,
  isFeatured: false,
  isTrending: false,
  features: [] as NamedItem[],
  tags: [] as NamedItem[],
  screenshots: [] as ToolMedia[],
  reviews: [] as ToolReview[],
  ratingAvg: null,
  ratingCount: 0,
  updatedAt: null,
  content: null,
} as const;

export const showcaseTools: Tool[] = [
  {
    ...SHOWCASE_DEFAULTS,
    id: "showcase-1",
    name: "Anything",
    description: "Ship products faster with AI-assisted workflows.",
    category: "Productivity",
    color: PLACEHOLDER_COLORS[0],
    initial: "A",
    slug: "anything",
  },
  {
    ...SHOWCASE_DEFAULTS,
    id: "showcase-2",
    name: "Raycast",
    description: "Supercharge your desktop productivity.",
    category: "Productivity",
    color: PLACEHOLDER_COLORS[1],
    initial: "R",
    slug: "raycast",
  },
  {
    ...SHOWCASE_DEFAULTS,
    id: "showcase-3",
    name: "Voicenotes",
    description: "Capture and organize voice notes instantly.",
    category: "Audio & Voice",
    color: PLACEHOLDER_COLORS[2],
    initial: "V",
    slug: "voicenotes",
  },
  {
    ...SHOWCASE_DEFAULTS,
    id: "showcase-4",
    name: "Perplexity",
    description: "Ask the web and get cited answers.",
    category: "Research",
    color: PLACEHOLDER_COLORS[3],
    initial: "P",
    slug: "perplexity",
  },
  {
    ...SHOWCASE_DEFAULTS,
    id: "showcase-5",
    name: "Cursor",
    description: "AI pair programming for modern teams.",
    category: "Coding",
    color: PLACEHOLDER_COLORS[4],
    initial: "C",
    slug: "cursor",
  },
  {
    ...SHOWCASE_DEFAULTS,
    id: "showcase-6",
    name: "Midjourney",
    description: "Generate stunning visuals from text.",
    category: "Image",
    color: PLACEHOLDER_COLORS[5],
    initial: "M",
    slug: "midjourney",
  },
  {
    ...SHOWCASE_DEFAULTS,
    id: "showcase-7",
    name: "ElevenLabs",
    description: "Natural voice generation and cloning.",
    category: "Audio & Voice",
    color: PLACEHOLDER_COLORS[6],
    initial: "E",
    slug: "elevenlabs",
  },
  {
    ...SHOWCASE_DEFAULTS,
    id: "showcase-8",
    name: "Notion AI",
    description: "Write, plan, and collaborate with AI.",
    category: "Writing",
    color: PLACEHOLDER_COLORS[7],
    initial: "N",
    slug: "notion-ai",
  },
  {
    ...SHOWCASE_DEFAULTS,
    id: "showcase-9",
    name: "Runway",
    description: "Create and edit video with generative AI.",
    category: "Video",
    color: PLACEHOLDER_COLORS[8],
    initial: "R",
    slug: "runway",
  },
  {
    ...SHOWCASE_DEFAULTS,
    id: "showcase-10",
    name: "Gamma",
    description: "Beautiful decks in minutes.",
    category: "Presentations",
    color: PLACEHOLDER_COLORS[9],
    initial: "G",
    slug: "gamma",
  },
];
