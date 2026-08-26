import { supabase } from "@/lib/supabase";
import type { Tool, ToolReview } from "@/data/tools";
import { fetchToolsByIds } from "@/data/tools";

export type UserCollection = {
  id: string;
  name: string;
  description: string | null;
  toolIds: string[];
};

function mapReview(row: {
  id: string;
  tool_id: string;
  user_id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  updated_at: string;
}): ToolReview {
  return {
    id: row.id,
    toolId: row.tool_id,
    userId: row.user_id,
    rating: row.rating,
    reviewText: row.review_text,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    authorName: null,
    authorAvatar: null,
  };
}

export function requestSignIn() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("rundown:open-signup"));
  }
}

export async function isToolSaved(
  userId: string,
  toolId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("saved_tools")
    .select("tool_id")
    .eq("user_id", userId)
    .eq("tool_id", toolId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return Boolean(data);
}

export async function saveTool(userId: string, toolId: string) {
  const { error } = await supabase.from("saved_tools").insert({
    user_id: userId,
    tool_id: toolId,
  });
  if (error) throw new Error(error.message);
}

export async function unsaveTool(userId: string, toolId: string) {
  const { error } = await supabase
    .from("saved_tools")
    .delete()
    .eq("user_id", userId)
    .eq("tool_id", toolId);
  if (error) throw new Error(error.message);
}

export async function fetchSavedTools(userId: string): Promise<{
  tools: Tool[];
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("saved_tools")
    .select("tool_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return { tools: [], error: error.message };
  const ids = (data ?? []).map((row) => row.tool_id as string);
  return fetchToolsByIds(ids);
}

export async function fetchUserCollections(userId: string): Promise<{
  collections: UserCollection[];
  error: string | null;
}> {
  const { data: collections, error } = await supabase
    .from("collections")
    .select("id, name, description")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) return { collections: [], error: error.message };

  const ids = (collections ?? []).map((c) => c.id as string);
  if (ids.length === 0) return { collections: [], error: null };

  const { data: links, error: linkError } = await supabase
    .from("collection_tools")
    .select("collection_id, tool_id")
    .in("collection_id", ids);

  if (linkError) return { collections: [], error: linkError.message };

  const toolsByCollection = new Map<string, string[]>();
  for (const link of links ?? []) {
    const list = toolsByCollection.get(link.collection_id as string) ?? [];
    list.push(link.tool_id as string);
    toolsByCollection.set(link.collection_id as string, list);
  }

  return {
    collections: (collections ?? []).map((c) => ({
      id: c.id as string,
      name: c.name as string,
      description: (c.description as string | null) ?? null,
      toolIds: toolsByCollection.get(c.id as string) ?? [],
    })),
    error: null,
  };
}

export async function createCollection(
  userId: string,
  name: string,
  description?: string,
) {
  const { data, error } = await supabase
    .from("collections")
    .insert({
      user_id: userId,
      name: name.trim(),
      description: description?.trim() || null,
    })
    .select("id, name, description")
    .single();

  if (error) throw new Error(error.message);
  return {
    id: data.id as string,
    name: data.name as string,
    description: (data.description as string | null) ?? null,
    toolIds: [] as string[],
  };
}

export async function addToolToCollection(
  collectionId: string,
  toolId: string,
) {
  const { error } = await supabase.from("collection_tools").insert({
    collection_id: collectionId,
    tool_id: toolId,
  });
  if (error) throw new Error(error.message);
}

export async function removeToolFromCollection(
  collectionId: string,
  toolId: string,
) {
  const { error } = await supabase
    .from("collection_tools")
    .delete()
    .eq("collection_id", collectionId)
    .eq("tool_id", toolId);
  if (error) throw new Error(error.message);
}

export async function upsertReview(input: {
  userId: string;
  toolId: string;
  rating: number;
  reviewText: string;
  existingId?: string | null;
}) {
  const payload = {
    tool_id: input.toolId,
    user_id: input.userId,
    rating: input.rating,
    review_text: input.reviewText.trim() || null,
    updated_at: new Date().toISOString(),
  };

  if (input.existingId) {
    const { data, error } = await supabase
      .from("tool_reviews")
      .update(payload)
      .eq("id", input.existingId)
      .eq("user_id", input.userId)
      .select(
        "id, tool_id, user_id, rating, review_text, created_at, updated_at",
      )
      .single();
    if (error) throw new Error(error.message);
    return mapReview(data);
  }

  const { data, error } = await supabase
    .from("tool_reviews")
    .insert(payload)
    .select("id, tool_id, user_id, rating, review_text, created_at, updated_at")
    .single();
  if (error) throw new Error(error.message);
  return mapReview(data);
}

export async function deleteReview(userId: string, reviewId: string) {
  const { error } = await supabase
    .from("tool_reviews")
    .delete()
    .eq("id", reviewId)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export async function reportTool(input: {
  userId: string;
  toolId: string;
  reason: string;
  details?: string;
}) {
  const { error } = await supabase.from("tool_reports").insert({
    user_id: input.userId,
    tool_id: input.toolId,
    reason: input.reason,
    details: input.details?.trim() || null,
    status: "open",
  });
  if (error) throw new Error(error.message);
}

export async function shareToolLink(url: string): Promise<"copied" | "shared"> {
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ url });
      return "shared";
    } catch {
      // fall through to clipboard
    }
  }

  await navigator.clipboard.writeText(url);
  return "copied";
}
