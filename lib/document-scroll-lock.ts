type SavedStyles = {
  bodyOverflow: string;
  bodyPosition: string;
  bodyTop: string;
  bodyWidth: string;
  rootOverflow: string;
  scrollY: number;
};

let lockCount = 0;
let savedStyles: SavedStyles | null = null;

export function lockDocumentScroll(): () => void {
  if (typeof window === "undefined" || typeof document === "undefined") return () => undefined;

  lockCount += 1;
  if (lockCount === 1) {
    const body = document.body;
    const root = document.documentElement;
    savedStyles = {
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyWidth: body.style.width,
      rootOverflow: root.style.overflow,
      scrollY: window.scrollY,
    };

    root.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${savedStyles.scrollY}px`;
    body.style.width = "100%";
    root.dataset.scrollLocked = "true";
  }

  let released = false;
  return () => {
    if (released) return;
    released = true;
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount !== 0 || !savedStyles) return;

    const restore = savedStyles;
    savedStyles = null;
    const body = document.body;
    const root = document.documentElement;
    body.style.overflow = restore.bodyOverflow;
    body.style.position = restore.bodyPosition;
    body.style.top = restore.bodyTop;
    body.style.width = restore.bodyWidth;
    root.style.overflow = restore.rootOverflow;
    delete root.dataset.scrollLocked;
    window.scrollTo({ top: restore.scrollY, behavior: "instant" });
  };
}
