export function scrollToId(id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
    block: "start",
  });
}

/** Strip leading # from hash hrefs. */
export function idFromHash(href: string) {
  return href.startsWith("#") ? href.slice(1) : href;
}
