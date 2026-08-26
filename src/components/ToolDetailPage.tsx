"use client";

import {
  ArrowLeft,
  BadgeCheck,
  Bookmark,
  BookmarkCheck,
  Flag,
  FolderPlus,
  Globe,
  ImageIcon,
  Link2,
  Star,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import Popup from "@/components/Popup";
import type { Tool, ToolReview } from "@/data/tools";
import {
  addToolToCollection,
  createCollection,
  deleteReview,
  fetchUserCollections,
  isToolSaved,
  removeToolFromCollection,
  reportTool,
  requestSignIn,
  saveTool,
  unsaveTool,
  upsertReview,
  type UserCollection,
} from "@/data/toolActions";
import { recordRecentTool } from "@/lib/recentTools";
import ToolContentSections, {
  getToolContentNavSections,
} from "@/components/ToolContentSections";
import ScrollRuler from "@/components/ScrollRuler";
import ShareToolModal from "@/components/ShareToolModal";

function formatLabel(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function Chip({
  children,
  href,
}: {
  children: React.ReactNode;
  href?: string | null;
}) {
  const className =
    "rounded-lg bg-zinc-800/80 px-2.5 py-1 text-xs font-medium text-zinc-300 hover-soft";
  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return <span className={className}>{children}</span>;
}

function Stars({
  value,
  onChange,
  size = "sm",
}: {
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md";
}) {
  const iconClass = size === "md" ? "size-5" : "size-3.5";
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => {
        const filled = i < Math.round(value);
        const star = (
          <Star
            className={`${iconClass} ${
              filled ? "fill-amber-400 text-amber-400" : "text-zinc-600"
            }`}
            strokeWidth={2}
          />
        );
        if (!onChange) {
          return <span key={i}>{star}</span>;
        }
        return (
          <button
            key={i}
            type="button"
            aria-label={`Rate ${i + 1} stars`}
            onClick={() => onChange(i + 1)}
            className="cursor-pointer rounded p-0.5 transition-transform hover:scale-110"
          >
            {star}
          </button>
        );
      })}
    </div>
  );
}

type ToolDetailPageProps = {
  tool: Tool;
  onToolChange?: (tool: Tool) => void;
};

export default function ToolDetailPage({
  tool,
  onToolChange,
}: ToolDetailPageProps) {
  const router = useRouter();
  const { user, profile, status } = useAuth();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [collections, setCollections] = useState<UserCollection[]>([]);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [reportReason, setReportReason] = useState("spam");
  const [reportDetails, setReportDetails] = useState("");
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);

  const ownReview = useMemo(
    () => tool.reviews.find((review) => review.userId === user?.id) ?? null,
    [tool.reviews, user?.id],
  );

  const navSections = useMemo(() => {
    const sections = [
      { id: "overview", label: "Overview" },
      ...getToolContentNavSections(tool.content),
    ];
    if (tool.screenshots.length > 0) {
      sections.push({ id: "screenshots", label: "Screenshots" });
    }
    sections.push({ id: "reviews", label: "Reviews" });
    return sections;
  }, [tool.content, tool.screenshots.length]);

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  };

  useEffect(() => {
    recordRecentTool({ id: tool.id, slug: tool.slug, name: tool.name });
  }, [tool.id, tool.slug, tool.name]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (collectionOpen || reportOpen || shareOpen) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      e.preventDefault();
      if (typeof window !== "undefined" && window.history.length > 1) {
        router.back();
        return;
      }
      router.push("/");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [collectionOpen, reportOpen, shareOpen, router]);

  useEffect(() => {
    if (!user) {
      setSaved(false);
      return;
    }
    let cancelled = false;
    void isToolSaved(user.id, tool.id)
      .then((value) => {
        if (!cancelled) setSaved(value);
      })
      .catch(() => {
        if (!cancelled) setSaved(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, tool.id]);

  useEffect(() => {
    if (ownReview) {
      setRating(ownReview.rating);
      setReviewText(ownReview.reviewText ?? "");
      setEditingReviewId(ownReview.id);
    } else {
      setRating(5);
      setReviewText("");
      setEditingReviewId(null);
    }
  }, [ownReview]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  };

  const requireAuth = () => {
    if (status === "authenticated" && user) return true;
    requestSignIn();
    showToast("Sign in to continue");
    return false;
  };

  const updateReviews = (reviews: ToolReview[]) => {
    const ratingCount = reviews.length;
    const ratingAvg =
      ratingCount > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / ratingCount
        : null;
    onToolChange?.({
      ...tool,
      reviews,
      ratingAvg,
      ratingCount,
    });
  };

  const toggleSave = async () => {
    if (!requireAuth() || !user) return;
    setBusy("save");
    try {
      if (saved) {
        await unsaveTool(user.id, tool.id);
        setSaved(false);
        showToast("Removed from saved");
      } else {
        await saveTool(user.id, tool.id);
        setSaved(true);
        showToast("Saved");
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not update save");
    } finally {
      setBusy(null);
    }
  };

  const openCollections = async () => {
    if (!requireAuth() || !user) return;
    setCollectionOpen(true);
    setBusy("collections");
    try {
      const result = await fetchUserCollections(user.id);
      if (result.error) throw new Error(result.error);
      setCollections(result.collections);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Could not load collections",
      );
    } finally {
      setBusy(null);
    }
  };

  const toggleCollection = async (collection: UserCollection) => {
    if (!user) return;
    setBusy(`collection-${collection.id}`);
    try {
      const hasTool = collection.toolIds.includes(tool.id);
      if (hasTool) {
        await removeToolFromCollection(collection.id, tool.id);
        setCollections((prev) =>
          prev.map((item) =>
            item.id === collection.id
              ? {
                  ...item,
                  toolIds: item.toolIds.filter((id) => id !== tool.id),
                }
              : item,
          ),
        );
        showToast("Removed from collection");
      } else {
        await addToolToCollection(collection.id, tool.id);
        setCollections((prev) =>
          prev.map((item) =>
            item.id === collection.id
              ? { ...item, toolIds: [...item.toolIds, tool.id] }
              : item,
          ),
        );
        showToast("Added to collection");
      }
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Could not update collection",
      );
    } finally {
      setBusy(null);
    }
  };

  const onCreateCollection = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !newCollectionName.trim()) return;
    setBusy("create-collection");
    try {
      const created = await createCollection(user.id, newCollectionName);
      await addToolToCollection(created.id, tool.id);
      setCollections((prev) => [
        { ...created, toolIds: [tool.id] },
        ...prev,
      ]);
      setNewCollectionName("");
      showToast("Collection created");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Could not create collection",
      );
    } finally {
      setBusy(null);
    }
  };

  const onSubmitReview = async (e: FormEvent) => {
    e.preventDefault();
    if (!requireAuth() || !user) return;
    setBusy("review");
    try {
      const savedReview = await upsertReview({
        userId: user.id,
        toolId: tool.id,
        rating,
        reviewText,
        existingId: editingReviewId,
      });
      const withAuthor: ToolReview = {
        ...savedReview,
        authorName: profile?.display_name || profile?.username || "You",
        authorAvatar: profile?.avatar_url ?? null,
      };
      const others = tool.reviews.filter((review) => review.userId !== user.id);
      updateReviews([withAuthor, ...others]);
      showToast(editingReviewId ? "Review updated" : "Review posted");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not save review");
    } finally {
      setBusy(null);
    }
  };

  const onDeleteReview = async () => {
    if (!user || !ownReview) return;
    setBusy("delete-review");
    try {
      await deleteReview(user.id, ownReview.id);
      updateReviews(tool.reviews.filter((review) => review.id !== ownReview.id));
      showToast("Review deleted");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not delete review");
    } finally {
      setBusy(null);
    }
  };

  const onReport = async (e: FormEvent) => {
    e.preventDefault();
    if (!requireAuth() || !user) return;
    setBusy("report");
    try {
      await reportTool({
        userId: user.id,
        toolId: tool.id,
        reason: reportReason,
        details: reportDetails,
      });
      setReportOpen(false);
      setReportDetails("");
      showToast("Report submitted");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not submit report");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="relative flex min-h-full flex-col bg-[#0a0a0a]">
      <div className="pointer-events-auto fixed top-1/2 left-[5.25rem] z-30 hidden -translate-y-1/2 sm:block sm:left-[5.5rem] lg:left-24 xl:left-[6.5rem] 2xl:left-28">
        <ScrollRuler sections={navSections} toolName={tool.name} />
      </div>

      <div className="sticky top-0 z-20 px-3 pt-3 pb-1">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium hover-soft-muted"
        >
          <ArrowLeft className="size-4" strokeWidth={2} />
          Back
        </button>
      </div>

      <div className="w-full px-8 pt-6 pb-6 sm:px-12 sm:pt-8 sm:pb-8 lg:px-16 xl:px-20 2xl:px-24">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[3fr_2fr] lg:gap-10 xl:gap-12">
          {/* Left */}
          <div className="min-w-0">
            <div id="overview" className="scroll-mt-6">
            <div className="flex items-start gap-4 sm:gap-5">
              <div
                className="flex size-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white sm:size-[4.5rem]"
                style={{ backgroundColor: tool.color }}
              >
                {tool.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={tool.logoUrl}
                    alt=""
                    className="size-9 object-contain sm:size-10"
                  />
                ) : (
                  tool.initial
                )}
              </div>

              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                    {tool.name}
                  </h1>
                  {tool.isVerified ? (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2 py-1 text-xs font-medium text-emerald-400">
                      <BadgeCheck className="size-3.5" strokeWidth={2} />
                      Verified
                    </span>
                  ) : null}
                  {tool.isFeatured ? (
                    <span className="rounded-lg bg-amber-500/15 px-2 py-1 text-xs font-medium text-amber-300">
                      Featured
                    </span>
                  ) : null}
                  {tool.isTrending ? (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2 py-1 text-xs font-medium text-emerald-300">
                      <TrendingUp className="size-3.5" strokeWidth={2} />
                      Trending
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setShareOpen(true)}
                    className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-700/60 bg-[#141414] px-2.5 text-xs font-medium text-zinc-300 hover-soft"
                  >
                    <Link2 className="size-3.5" strokeWidth={2} />
                    Share
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!requireAuth()) return;
                      setReportOpen(true);
                    }}
                    className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-700/60 bg-[#141414] px-2.5 text-xs font-medium text-zinc-300 hover-soft"
                  >
                    <Flag className="size-3.5" strokeWidth={2} />
                    Report
                  </button>
                </div>

                <p className="mt-1.5 text-sm text-zinc-400 sm:text-[15px]">
                  {tool.companySlug ? (
                    <Link
                      href={`/company/${tool.companySlug}`}
                      className="hover:text-white"
                    >
                      {tool.company}
                    </Link>
                  ) : (
                    tool.company
                  )}
                  {tool.company && tool.category ? " · " : null}
                  {tool.categorySlug ? (
                    <Link
                      href={`/categories/${tool.categorySlug}`}
                      className="hover:text-white"
                    >
                      {tool.category}
                    </Link>
                  ) : (
                    tool.category
                  )}
                </p>

                {tool.ratingCount > 0 ? (
                  <div className="mt-2 flex items-center gap-2 text-sm text-zinc-400">
                    <Stars value={tool.ratingAvg ?? 0} />
                    <span>
                      {(tool.ratingAvg ?? 0).toFixed(1)} · {tool.ratingCount}{" "}
                      review{tool.ratingCount === 1 ? "" : "s"}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            <p className="mt-5 text-[15px] text-zinc-400">{tool.description}</p>

            {tool.fullDescription &&
            tool.fullDescription !== tool.description ? (
              <p className="mt-3 text-[15px] leading-relaxed text-zinc-300 sm:text-base">
                {tool.fullDescription}
              </p>
            ) : null}

            <div
              className="mt-5 flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed border-zinc-700/60 bg-[#141414]"
              aria-label="Image placeholder"
            >
              <div className="flex flex-col items-center gap-2 text-zinc-500">
                <ImageIcon className="size-8" strokeWidth={1.5} />
                <span className="text-sm">Image coming soon</span>
              </div>
            </div>

            <p className="mt-3 text-xs text-zinc-500 sm:text-sm">
              Some outbound links may earn us a commission, which helps keep
              Rundown running.{" "}
              <span className="font-medium text-zinc-400 underline decoration-zinc-600 underline-offset-2">
                Learn more
              </span>
              .
            </p>
            </div>

            <ToolContentSections content={tool.content} />

            {tool.screenshots.length > 0 ? (
              <section id="screenshots" className="mt-10 scroll-mt-6">
                <h2 className="mb-3 font-mono text-xs font-medium tracking-wide text-zinc-500 uppercase">
                  Screenshots
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {tool.screenshots.map((shot) => (
                    <div
                      key={shot.id}
                      className="overflow-hidden rounded-2xl border border-zinc-700/60 bg-[#141414]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={shot.url}
                        alt={shot.altText || `${tool.name} screenshot`}
                        className="aspect-video w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section id="reviews" className="mt-10 scroll-mt-6">
              <h2 className="mb-3 font-mono text-xs font-medium tracking-wide text-zinc-500 uppercase">
                Reviews
              </h2>

              <form
                onSubmit={(e) => void onSubmitReview(e)}
                className="rounded-2xl border border-zinc-700/60 bg-[#141414] p-4"
              >
                <p className="mb-3 text-sm font-medium text-white">
                  {ownReview ? "Edit your review" : "Write a review"}
                </p>
                <Stars value={rating} onChange={setRating} size="md" />
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={4}
                  placeholder="Share your experience with this tool..."
                  className="mt-3 w-full resize-none rounded-xl border border-zinc-700/60 bg-[#0f0f0f] px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-500"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="submit"
                    disabled={busy === "review"}
                    className="inline-flex h-10 cursor-pointer items-center rounded-xl bg-white px-4 text-sm font-semibold text-black hover-primary disabled:opacity-60"
                  >
                    {ownReview ? "Update review" : "Post review"}
                  </button>
                  {ownReview ? (
                    <button
                      type="button"
                      onClick={() => void onDeleteReview()}
                      disabled={busy === "delete-review"}
                      className="inline-flex h-10 cursor-pointer items-center rounded-xl border border-zinc-700/60 px-4 text-sm font-medium text-zinc-300 hover-soft disabled:opacity-60"
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
              </form>

              <div className="mt-4 space-y-3">
                {tool.reviews.length === 0 ? (
                  <p className="text-sm text-zinc-500">No reviews yet.</p>
                ) : (
                  tool.reviews.map((review) => (
                    <article
                      key={review.id}
                      className="rounded-2xl border border-zinc-700/60 bg-[#141414] p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">
                            {review.authorName || "User"}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Stars value={review.rating} />
                      </div>
                      {review.reviewText ? (
                        <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                          {review.reviewText}
                        </p>
                      ) : null}
                    </article>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* Right */}
          <aside className="min-w-0 lg:sticky lg:top-6 lg:self-start">
            {tool.websiteUrl ? (
              <a
                href={tool.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white text-sm font-semibold text-black hover-primary"
              >
                <Globe className="size-4" strokeWidth={2} />
                Visit website
              </a>
            ) : null}

            <div className={`flex gap-2 ${tool.websiteUrl ? "mt-3" : ""}`}>
              <button
                type="button"
                onClick={() => void toggleSave()}
                disabled={busy === "save"}
                className="inline-flex h-10 min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-zinc-700/60 bg-[#141414] px-4 text-sm font-medium text-white hover-soft disabled:opacity-60"
              >
                {saved ? (
                  <BookmarkCheck className="size-4 text-amber-300" />
                ) : (
                  <Bookmark className="size-4" />
                )}
                {saved ? "Saved" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => void openCollections()}
                className="inline-flex h-10 min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-zinc-700/60 bg-[#141414] px-4 text-sm font-medium text-white hover-soft"
              >
                <FolderPlus className="size-4" />
                Collection
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-zinc-700/50 bg-[#1a1a1a] px-5 py-5">
              <h2 className="mb-5 text-center font-mono text-sm font-medium text-zinc-400">
                Stats
              </h2>

              <div className="space-y-4 font-mono text-sm">
                <div className="flex items-center gap-3">
                  <span className="shrink-0 text-zinc-400">Rating</span>
                  <span className="h-px min-w-4 flex-1 bg-zinc-700/70" />
                  {tool.ratingAvg != null ? (
                    <span className="inline-flex shrink-0 items-center gap-1.5 text-white">
                      <Star
                        className="size-3.5 fill-amber-400 text-amber-400"
                        strokeWidth={0}
                      />
                      {tool.ratingAvg.toFixed(1)}
                    </span>
                  ) : (
                    <span className="shrink-0 text-zinc-500">No ratings yet</span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="shrink-0 text-zinc-400">Price</span>
                  <span className="h-px min-w-4 flex-1 bg-zinc-700/70" />
                  <span className="shrink-0 text-white">
                    {tool.pricingType
                      ? formatLabel(tool.pricingType)
                      : "—"}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="shrink-0 text-zinc-400">Updated</span>
                  <span className="h-px min-w-4 flex-1 bg-zinc-700/70" />
                  <span className="shrink-0 text-white">
                    {tool.updatedAt
                      ? new Date(tool.updatedAt).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—"}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="shrink-0 text-zinc-400">Category</span>
                  <span className="h-px min-w-4 flex-1 bg-zinc-700/70" />
                  {tool.categorySlug ? (
                    <Link
                      href={`/categories/${tool.categorySlug}`}
                      className="shrink-0 rounded-md bg-zinc-800 px-2 py-0.5 text-xs text-zinc-200 hover-soft"
                    >
                      {tool.category}
                    </Link>
                  ) : (
                    <span className="shrink-0 rounded-md bg-zinc-800 px-2 py-0.5 text-xs text-zinc-200">
                      {tool.category}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {tool.features.length > 0 ? (
              <section className="mt-5">
                <h2 className="mb-3 font-mono text-xs font-medium tracking-wide text-zinc-500 uppercase">
                  Features
                </h2>
                <div className="flex flex-wrap gap-2">
                  {tool.features.map((feature) => (
                    <Chip key={feature.slug} href={`/feature/${feature.slug}`}>
                      {feature.name}
                    </Chip>
                  ))}
                </div>
              </section>
            ) : null}

            {tool.tags.length > 0 ? (
              <section className="mt-5">
                <h2 className="mb-3 font-mono text-xs font-medium tracking-wide text-zinc-500 uppercase">
                  Tags
                </h2>
                <div className="flex flex-wrap gap-2">
                  {tool.tags.map((tag) => (
                    <Chip key={tag.slug} href={`/tag/${tag.slug}`}>
                      {tag.name}
                    </Chip>
                  ))}
                </div>
              </section>
            ) : null}
          </aside>
        </div>
      </div>

      {toast ? (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-[120] -translate-x-1/2 rounded-xl border border-zinc-700/60 bg-[#1a1a1a] px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      ) : null}

      <ShareToolModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        tool={tool}
        onToast={showToast}
      />

      <Popup
        open={collectionOpen}
        onClose={() => setCollectionOpen(false)}
        label="Collections"
        showCloseButton
        panelClassName="w-full max-w-md bg-[#1a1a1a] p-5"
      >
        <h2 className="pr-10 text-lg font-semibold text-white">
          Add to collection
        </h2>
        <form onSubmit={(e) => void onCreateCollection(e)} className="mt-4 flex gap-2">
          <input
            value={newCollectionName}
            onChange={(e) => setNewCollectionName(e.target.value)}
            placeholder="New collection name"
            className="h-10 min-w-0 flex-1 rounded-xl border border-zinc-700/60 bg-[#0f0f0f] px-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-500"
          />
          <button
            type="submit"
            disabled={busy === "create-collection"}
            className="h-10 shrink-0 cursor-pointer rounded-xl bg-white px-3 text-sm font-semibold text-black disabled:opacity-60"
          >
            Create
          </button>
        </form>
        <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
          {collections.length === 0 ? (
            <p className="text-sm text-zinc-500">No collections yet.</p>
          ) : (
            collections.map((collection) => {
              const hasTool = collection.toolIds.includes(tool.id);
              return (
                <button
                  key={collection.id}
                  type="button"
                  onClick={() => void toggleCollection(collection)}
                  disabled={busy === `collection-${collection.id}`}
                  className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-zinc-700/60 bg-[#141414] px-3 py-2.5 text-left hover-soft disabled:opacity-60"
                >
                  <span className="truncate text-sm text-white">
                    {collection.name}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {hasTool ? "Remove" : "Add"}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </Popup>

      <Popup
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        label="Report tool"
        showCloseButton
        panelClassName="w-full max-w-md bg-[#1a1a1a] p-5"
      >
        <h2 className="pr-10 text-lg font-semibold text-white">Report tool</h2>
        <form onSubmit={(e) => void onReport(e)} className="mt-4 space-y-3">
          <select
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            className="h-10 w-full rounded-xl border border-zinc-700/60 bg-[#0f0f0f] px-3 text-sm text-white outline-none focus:border-zinc-500"
          >
            <option value="spam">Spam</option>
            <option value="incorrect">Incorrect information</option>
            <option value="broken">Broken / unavailable</option>
            <option value="offensive">Offensive content</option>
            <option value="other">Other</option>
          </select>
          <textarea
            value={reportDetails}
            onChange={(e) => setReportDetails(e.target.value)}
            rows={4}
            placeholder="Optional details"
            className="w-full resize-none rounded-xl border border-zinc-700/60 bg-[#0f0f0f] px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-500"
          />
          <button
            type="submit"
            disabled={busy === "report"}
            className="inline-flex h-10 cursor-pointer items-center rounded-xl bg-white px-4 text-sm font-semibold text-black disabled:opacity-60"
          >
            Submit report
          </button>
        </form>
      </Popup>
    </div>
  );
}
