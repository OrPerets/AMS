"use client";

type ScrollContainer = HTMLElement & { dataset: DOMStringMap };

const LOCK_ATTR = "scrollLockCount";

function getScrollContainer(): ScrollContainer | null {
  if (typeof document === "undefined") {
    return null;
  }

  return document.querySelector<ScrollContainer>('[data-scroll-container="app"]');
}

export function lockAppScroll() {
  const container = getScrollContainer();
  if (!container) {
    return () => undefined;
  }

  const count = Number(container.dataset[LOCK_ATTR] || "0");
  if (count === 0) {
    container.dataset.prevOverflowY = container.style.overflowY || "";
    container.style.overflowY = "hidden";
    document.body.style.overflow = "hidden";
  }

  container.dataset[LOCK_ATTR] = String(count + 1);

  return () => {
    const current = Number(container.dataset[LOCK_ATTR] || "0");
    if (current <= 1) {
      container.style.overflowY = container.dataset.prevOverflowY || "";
      document.body.style.overflow = "";
      delete container.dataset[LOCK_ATTR];
      delete container.dataset.prevOverflowY;
      return;
    }

    container.dataset[LOCK_ATTR] = String(current - 1);
  };
}
