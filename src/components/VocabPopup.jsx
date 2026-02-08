import { useEffect, useState } from "preact/hooks";
import { deck, addCard, isInDeck } from "../stores/deckStore.js";

export default function VocabPopup() {
  const [entry, setEntry] = useState(null);
  const [addedFeedback, setAddedFeedback] = useState(false);

  // Subscribe to deck signal so button state re-renders
  const deckCards = deck.value;

  useEffect(() => {
    let lastScroll = window.scrollY;

    const openHandler = (event) => {
      if (!event?.detail?.word) return;
      lastScroll = window.scrollY;
      setAddedFeedback(false);
      setEntry({
        word: event.detail.word,
        definition: event.detail.definition || "",
        example: event.detail.example || "",
        sentence: event.detail.sentence || "",
        isVocabWord: event.detail.isVocabWord || false,
      });
    };

    const keyHandler = (event) => {
      if (event.key === "Escape") setEntry(null);
    };

    const scrollHandler = () => {
      if (Math.abs(window.scrollY - lastScroll) > 150) {
        setEntry(null);
        lastScroll = window.scrollY;
      }
    };

    // Dismiss on tap outside — updated selector for new data-word attribute
    const pointerHandler = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest(".vocab-bottom-sheet")) return;
      if (target.closest("[data-word]")) return;
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

  const alreadyInDeck = isInDeck(entry.word);
  const deckFull = deck.value.length >= 10;

  const handleAdd = () => {
    const success = addCard({
      word: entry.word,
      sentence: entry.sentence,
      definition: entry.definition,
      isVocabWord: entry.isVocabWord,
    });
    if (success) {
      setAddedFeedback(true);
      setTimeout(() => setAddedFeedback(false), 1500);
    }
  };

  return (
    <div
      class="vocab-bottom-sheet"
      role="complementary"
      aria-label={`Definition for ${entry.word}`}
    >
      <div class="vocab-sheet-handle" />
      <h3>{entry.word}</h3>

      {entry.definition && <p>{entry.definition}</p>}

      {entry.sentence && (
        <p class="muted" style={{ fontSize: "13px", marginTop: "4px" }}>
          <strong>Sentence:</strong> {entry.sentence}
        </p>
      )}

      {entry.example && entry.isVocabWord && (
        <p class="muted" style={{ fontSize: "13px", marginTop: "4px" }}>
          <strong>Example:</strong> {entry.example}
        </p>
      )}

      <div style={{ display: "flex", gap: "8px", marginTop: "10px", alignItems: "center" }}>
        {addedFeedback ? (
          <button
            class="button button-secondary"
            type="button"
            disabled
            style={{ background: "#dcfce7", borderColor: "#16a34a", color: "#16a34a" }}
          >
            Added!
          </button>
        ) : alreadyInDeck ? (
          <button class="button button-secondary" type="button" disabled style={{ opacity: 0.6 }}>
            In your deck
          </button>
        ) : deckFull ? (
          <button class="button button-secondary" type="button" disabled style={{ opacity: 0.5 }}>
            Deck full (10/10)
          </button>
        ) : (
          <button class="button button-primary" type="button" onClick={handleAdd}>
            + Add to Flashcards ({deck.value.length}/10)
          </button>
        )}

        <button
          class="button button-secondary"
          type="button"
          onClick={() => setEntry(null)}
          style={{ marginLeft: "auto" }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
