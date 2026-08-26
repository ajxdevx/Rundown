"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import {
  createCollection,
  fetchUserCollections,
  requestSignIn,
  type UserCollection,
} from "@/data/toolActions";
import { fetchToolsByIds, type Tool } from "@/data/tools";
import BrowseToolsView from "@/components/BrowseToolsView";

export default function CollectionsPage() {
  const { user, status, authLoading } = useAuth();
  const [collections, setCollections] = useState<UserCollection[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tools, setTools] = useState<Tool[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void fetchUserCollections(user.id).then((result) => {
      if (cancelled) return;
      setCollections(result.collections);
      setError(result.error);
      setSelectedId(result.collections[0]?.id ?? null);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  useEffect(() => {
    const selected = collections.find((c) => c.id === selectedId);
    if (!selected) {
      setTools([]);
      return;
    }

    let cancelled = false;
    void fetchToolsByIds(selected.toolIds).then((result) => {
      if (cancelled) return;
      setTools(result.tools);
    });

    return () => {
      cancelled = true;
    };
  }, [collections, selectedId]);

  if (authLoading || loading) {
    return (
      <div className="w-full px-4 py-6 sm:px-5" aria-busy>
        <div className="auth-skeleton mb-6 h-7 w-48 rounded" />
      </div>
    );
  }

  if (status !== "authenticated" || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-zinc-700/60 bg-[#141414] px-6 py-10 text-center">
          <p className="text-[15px] font-semibold text-white">Collections</p>
          <p className="mt-1 text-sm text-zinc-400">
            Sign in to create and manage collections.
          </p>
          <button
            type="button"
            onClick={() => requestSignIn()}
            className="mt-5 inline-flex h-10 cursor-pointer items-center rounded-xl bg-white px-4 text-sm font-semibold text-black"
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full px-4 py-6 sm:px-5">
        <div className="rounded-2xl border border-zinc-700/60 bg-[#141414] px-6 py-12 text-center">
          <p className="text-[15px] font-semibold text-white">
            Couldn&apos;t load collections
          </p>
          <p className="mt-1 text-sm text-zinc-400">{error}</p>
          <Link href="/" className="mt-4 inline-block text-sm text-zinc-300">
            Back home
          </Link>
        </div>
      </div>
    );
  }

  const selected = collections.find((c) => c.id === selectedId);

  return (
    <div className="w-full px-4 py-6 sm:px-5">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white sm:text-2xl">
            Collections
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            {collections.length} collection
            {collections.length === 1 ? "" : "s"}
          </p>
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim() || !user) return;
            void createCollection(user.id, name).then((created) => {
              setCollections((prev) => [created, ...prev]);
              setSelectedId(created.id);
              setName("");
            });
          }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New collection"
            className="h-10 w-44 rounded-xl border border-zinc-700/60 bg-[#141414] px-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-500 sm:w-56"
          />
          <button
            type="submit"
            className="h-10 cursor-pointer rounded-xl bg-white px-3 text-sm font-semibold text-black"
          >
            Create
          </button>
        </form>
      </div>

      {collections.length > 0 ? (
        <div className="mb-6 flex flex-wrap gap-2">
          {collections.map((collection) => (
            <button
              key={collection.id}
              type="button"
              onClick={() => setSelectedId(collection.id)}
              className={`cursor-pointer rounded-xl px-3 py-1.5 text-sm transition-colors ${
                selectedId === collection.id
                  ? "bg-white text-black"
                  : "border border-zinc-700/60 bg-[#141414] text-zinc-300 hover:text-white"
              }`}
            >
              {collection.name}
            </button>
          ))}
        </div>
      ) : null}

      <BrowseToolsView
        title={selected?.name ?? "Collection"}
        subtitle={
          selected
            ? `${tools.length} tool${tools.length === 1 ? "" : "s"}`
            : undefined
        }
        tools={tools}
        emptyMessage={
          collections.length === 0
            ? "Create a collection to get started."
            : "This collection is empty. Add tools from a tool page."
        }
        showFeatured={false}
      />
    </div>
  );
}
