import { useEffect, useState } from "preact/hooks";

export default function VocabPopup() {
  const [entry, setEntry] = useState(null);

  useEffect(() => {
    let lastScroll = window.scrollY;

    const openHandler = (event) => {
      if (!event?.detail?.word) return;
      lastScroll = window.scrollY;
      setEntry({
        word: event.detail.word,
        definition: event.detail.definition || "",
        example: event.detail.example || "",
      });
    };

    const keyHandler = (event) => {
      if (event.key === "Escape") setEntry(null);
    };

    // Dismiss on significant scroll
    const scrollHandler = () => {
      if (Math.abs(window.scrollY - lastScroll) > 150) {
        setEntry(null);
        lastScroll = window.scrollY;
      }
    };

    // Dismiss on tap outside sheet while keeping vocab taps active
    const pointerHandler = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest(".vocab-bottom-sheet")) return;
      if (target.closest("[data-vocab-word]")) return;
      setEntry(null);
    };

    window.addEventListener("open-vocab-popup", openHandler);
    window.addEventListener("keydown", keyHandler);
    window.addEventListener("scroll", scrollHandler, { passive: true });
    window.addEventListener("pointerdown", pointerHandler);

    return () => {
      window.removeEventListener("open-vocab-popup", openHandler);
      window.removeEventListener("keydown", keyHandler);
      window.removeEventListener("scroll", scrollHandler);
      window.removeEventListener("pointerdown", pointerHandler);
    };
  }, []);

  if (!entry) return null;

  return (
    <div
      class="vocab-bottom-sheet"
      role="complementary"
      aria-label={`Definition for ${entry.word}`}
    >
      <div class="vocab-sheet-handle" />
      <h3>{entry.word}</h3>
      <p>{entry.definition}</p>
      <p class="muted">
        <strong>Example:</strong> {entry.example}
      </p>
      <button
        class="button button-primary"
        type="button"
        onClick={() => setEntry(null)}
        style={{ marginTop: "8px" }}
      >
        Got it
      </button>
    </div>
  );
}
