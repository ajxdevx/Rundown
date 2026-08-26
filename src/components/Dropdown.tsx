"use client";

import { Check, ChevronDown } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";

export type DropdownOption = {
  value: string;
  label: string;
};

type DropdownProps = {
  options: readonly DropdownOption[] | readonly string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  "aria-label"?: string;
};

function normalizeOptions(
  options: readonly DropdownOption[] | readonly string[],
): DropdownOption[] {
  return options.map((option) =>
    typeof option === "string" ? { value: option, label: option } : option,
  );
}

export default function Dropdown({
  options,
  value,
  onChange,
  placeholder = "Select…",
  disabled = false,
  id,
  className = "",
  "aria-label": ariaLabel,
}: DropdownProps) {
  const autoId = useId();
  const triggerId = id ?? autoId;
  const listId = `${triggerId}-listbox`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const [scrollMetrics, setScrollMetrics] = useState({
    thumbHeight: 0,
    thumbTop: 0,
    visible: false,
  });
  const items = normalizeOptions(options);
  const selected = items.find((item) => item.value === value) ?? null;

  const updateScrollbar = useCallback(() => {
    const el = listRef.current;
    if (!el) return;

    const { scrollTop, scrollHeight, clientHeight } = el;
    const needsScroll = scrollHeight > clientHeight + 1;
    if (!needsScroll) {
      setScrollMetrics({ thumbHeight: 0, thumbTop: 0, visible: false });
      return;
    }

    const trackHeight = clientHeight;
    const thumbHeight = Math.max(
      28,
      (clientHeight / scrollHeight) * trackHeight,
    );
    const maxThumbTop = trackHeight - thumbHeight;
    const thumbTop =
      maxThumbTop <= 0
        ? 0
        : (scrollTop / (scrollHeight - clientHeight)) * maxThumbTop;

    setScrollMetrics({
      thumbHeight,
      thumbTop,
      visible: true,
    });
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }

    const place = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      setPos({
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
      });
    };

    place();
    const raf = requestAnimationFrame(() => {
      place();
      updateScrollbar();
    });
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, updateScrollbar]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function onThumbPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    const list = listRef.current;
    if (!list) return;

    const startY = e.clientY;
    const startScrollTop = list.scrollTop;
    const { scrollHeight, clientHeight } = list;
    const maxScroll = scrollHeight - clientHeight;
    const maxThumbTop = clientHeight - scrollMetrics.thumbHeight;

    const onMove = (ev: PointerEvent) => {
      if (maxThumbTop <= 0 || maxScroll <= 0) return;
      const delta = ev.clientY - startY;
      const next =
        startScrollTop + (delta / maxThumbTop) * maxScroll;
      list.scrollTop = Math.min(maxScroll, Math.max(0, next));
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  const menu =
    open && mounted
      ? createPortal(
          <div
            ref={menuRef}
            style={
              pos
                ? { top: pos.top, left: pos.left, width: pos.width }
                : { top: 0, left: 0, visibility: "hidden" }
            }
            className="fixed z-[120] overflow-hidden rounded-xl border border-zinc-700/70 bg-[#161616] shadow-[0_16px_40px_rgba(0,0,0,0.55)]"
          >
            <div className="relative">
              <ul
                ref={listRef}
                id={listId}
                role="listbox"
                aria-labelledby={triggerId}
                onScroll={updateScrollbar}
                className="scrollbar-hide max-h-56 overflow-y-auto p-1.5 pr-3"
              >
                {items.map((item) => {
                  const isSelected = item.value === value;
                  return (
                    <li key={item.value} role="presentation">
                      <button
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          onChange(item.value);
                          setOpen(false);
                        }}
                        className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm hover-soft ${
                          isSelected
                            ? "bg-zinc-800 text-white"
                            : "text-zinc-400"
                        }`}
                      >
                        <span className="min-w-0 truncate">{item.label}</span>
                        {isSelected && (
                          <Check
                            className="size-4 shrink-0 text-white"
                            strokeWidth={2}
                          />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>

              {scrollMetrics.visible && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute top-1.5 right-1.5 bottom-1.5 w-1.5"
                >
                  <div
                    className="pointer-events-auto absolute right-0 w-1.5 cursor-grab rounded-full bg-zinc-600 active:cursor-grabbing"
                    style={{
                      height: scrollMetrics.thumbHeight,
                      transform: `translateY(${scrollMetrics.thumbTop}px)`,
                    }}
                    onPointerDown={onThumbPointerDown}
                  />
                </div>
              )}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        onClick={() => {
          if (!disabled) setOpen((v) => !v);
        }}
        className={`flex h-12 w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-zinc-700/70 bg-[#111111] px-4 text-left text-sm outline-none transition-colors duration-200 focus:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-60 ${
          open ? "border-zinc-500" : ""
        } ${selected ? "text-white" : "text-zinc-600"}`}
      >
        <span className="min-w-0 truncate">
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={`size-4 shrink-0 text-zinc-500 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          strokeWidth={1.75}
        />
      </button>
      {menu}
    </div>
  );
}
