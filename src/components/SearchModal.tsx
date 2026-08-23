"use client";

import { ArrowUpRight, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  searchSections,
  type SearchItem,
  type SearchSection,
} from "@/data/search";
import Popup, { PopupCloseButton } from "./Popup";

type SearchModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function SearchModal({ open, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all");
  const [activeId, setActiveId] = useState(searchSections[0]?.items[0]?.id ?? "");
  const inputRef = useRef<HTMLInputElement>(null);
  const prevOpen = useRef(false);

  useEffect(() => {
    if (open && !prevOpen.current) {
      setQuery("");
      setTab("all");
      setActiveId(searchSections[0]?.items[0]?.id ?? "");
      const t = setTimeout(() => inputRef.current?.focus(), 20);
      prevOpen.current = true;
      return () => clearTimeout(t);
    }
    if (!open) prevOpen.current = false;
  }, [open]);

  const filteredSections = useMemo(() => {
    const q = query.trim().toLowerCase();

    return searchSections
      .map((section) => ({
        ...section,
        items: q
          ? section.items.filter(
              (item) =>
                item.title.toLowerCase().includes(q) ||
                item.subtitle.toLowerCase().includes(q) ||
                section.label.toLowerCase().includes(q),
            )
          : section.items,
      }))
      .filter((section) => section.items.length > 0);
  }, [query]);

  const visibleSections = useMemo(() => {
    if (tab === "all") return filteredSections;
    return filteredSections.filter((section) => section.id === tab);
  }, [filteredSections, tab]);

  const flatItems = useMemo(
    () => visibleSections.flatMap((section) => section.items),
    [visibleSections],
  );

  const activeItem =
    flatItems.find((item) => item.id === activeId) ?? flatItems[0] ?? null;

  const activeSectionLabel =
    searchSections.find((section) =>
      section.items.some((item) => item.id === activeItem?.id),
    )?.label ?? "Result";

  useEffect(() => {
    if (!flatItems.length) {
      setActiveId("");
      return;
    }
    if (!flatItems.some((item) => item.id === activeId)) {
      setActiveId(flatItems[0].id);
    }
  }, [flatItems, activeId]);

  const totalCount = filteredSections.reduce(
    (sum, section) => sum + section.items.length,
    0,
  );

  return (
    <Popup
      open={open}
      onClose={onClose}
      align="top"
      label="Search"
      panelClassName="flex h-[min(620px,78vh)] w-full max-w-3xl flex-col bg-[#222222]"
    >
      <div className="shrink-0 px-5 pt-5 pb-4">
        <div className="flex items-center gap-3 rounded-2xl bg-[#1a1a1a] px-4 py-3">
          <Search className="size-5 shrink-0 text-zinc-500" strokeWidth={1.75} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tools, discover, trending, collections..."
            className="min-w-0 flex-1 bg-transparent font-[family-name:var(--font-brand)] text-lg text-white outline-none placeholder:text-zinc-500"
          />
          <kbd className="hidden rounded-md bg-[#222222] px-2 py-1 text-[11px] text-zinc-500 sm:inline">
            Esc
          </kbd>
          <PopupCloseButton onClick={onClose} />
        </div>

        <div className="mt-4 flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabButton
            label="All"
            count={totalCount}
            active={tab === "all"}
            onClick={() => setTab("all")}
          />
          {searchSections.map((section) => {
            const count =
              filteredSections.find((s) => s.id === section.id)?.items.length ??
              0;
            return (
              <TabButton
                key={section.id}
                label={section.label}
                count={count}
                active={tab === section.id}
                onClick={() => setTab(section.id)}
              />
            );
          })}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 border-t border-zinc-700/40 md:grid-cols-2">
        <div className="scrollbar-hide min-h-0 overflow-y-auto p-3 md:border-r md:border-zinc-700/40">
          {visibleSections.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-4 py-12 text-center">
              <p className="text-sm font-medium text-zinc-300">No matches</p>
              <p className="text-xs text-zinc-500">Try a different keyword</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {visibleSections.map((section) => (
                <ResultSection
                  key={section.id}
                  section={section}
                  showTitle={tab === "all" || visibleSections.length > 1}
                  activeId={activeItem?.id}
                  onSelect={setActiveId}
                />
              ))}
            </div>
          )}
        </div>

        <div className="scrollbar-hide hidden min-h-0 overflow-y-auto p-5 md:block">
          {activeItem ? (
            <Preview item={activeItem} sectionLabel={activeSectionLabel} />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-zinc-500">
              Pick something to preview
            </div>
          )}
        </div>
      </div>
    </Popup>
  );
}

function TabButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer rounded-lg px-3 py-1.5 text-sm whitespace-nowrap transition-colors duration-200 hover:bg-zinc-800 hover:text-white ${
        active ? "bg-zinc-800 font-medium text-white" : "text-zinc-400"
      }`}
    >
      {label}
      <span className="ml-1.5 text-xs text-zinc-500">{count}</span>
    </button>
  );
}

function ResultSection({
  section,
  showTitle,
  activeId,
  onSelect,
}: {
  section: SearchSection;
  showTitle: boolean;
  activeId?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      {showTitle && (
        <h3 className="mb-2 px-3 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
          {section.label}
        </h3>
      )}
      <div className="flex flex-col gap-0.5">
        {section.items.map((item) => {
          const active = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              onMouseEnter={() => onSelect(item.id)}
              onFocus={() => onSelect(item.id)}
              onClick={() => onSelect(item.id)}
              className={`group flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-200 hover:bg-zinc-800 hover:text-white ${
                active ? "bg-zinc-800 text-white" : "text-zinc-400"
              }`}
            >
              <div
                className="flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                style={{ backgroundColor: item.color }}
              >
                {item.initial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">
                  {item.title}
                </p>
                <p className="truncate text-xs text-zinc-400">{item.subtitle}</p>
              </div>
              <ArrowUpRight
                className={`size-4 shrink-0 transition-opacity duration-200 ${
                  active
                    ? "text-zinc-400 opacity-100"
                    : "opacity-0 group-hover:opacity-100"
                }`}
                strokeWidth={1.75}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Preview({
  item,
  sectionLabel,
}: {
  item: SearchItem;
  sectionLabel: string;
}) {
  return (
    <div className="flex h-full flex-col">
      <div
        className="relative mb-5 aspect-[16/10] w-full overflow-hidden rounded-2xl"
        style={{ backgroundColor: item.color }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-6xl font-bold text-white/20 select-none">
            {item.initial}
          </span>
        </div>
      </div>

      <h2 className="font-[family-name:var(--font-brand)] text-2xl font-bold tracking-tight text-white">
        {item.title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">
        {item.subtitle}
      </p>

      <button
        type="button"
        className="mt-auto flex h-11 w-full cursor-pointer items-center justify-between rounded-2xl bg-white px-3 text-sm font-semibold text-black transition-colors duration-200 hover:bg-zinc-200"
      >
        <span>Open {sectionLabel.toLowerCase()}</span>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-black text-white">
          <ArrowUpRight className="size-4" strokeWidth={2.25} />
        </span>
      </button>
    </div>
  );
}
