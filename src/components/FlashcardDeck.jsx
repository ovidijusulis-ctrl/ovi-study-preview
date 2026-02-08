import { useEffect, useState } from "preact/hooks";
import { deck, loadDeck, removeCard } from "../stores/deckStore.js";

export default function FlashcardDeck({ episodeId = "" }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Load saved deck from localStorage on mount
  useEffect(() => {
    if (episodeId) loadDeck(episodeId);
  }, [episodeId]);

  // Subscribe to deck signal
  const cards = deck.value;

  // Keep index in bounds when cards change
  useEffect(() => {
    if (index >= cards.length && cards.length > 0) {
      setIndex(cards.length - 1);
      setFlipped(false);
    }
  }, [cards.length, index]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "ArrowLeft") {
        setIndex((current) => Math.max(0, current - 1));
        setFlipped(false);
      }
      if (event.key === "ArrowRight") {
        setIndex((current) => Math.min(cards.length - 1, current + 1));
        setFlipped(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cards.length]);

  // Empty state
  if (cards.length === 0) {
    return (
      <div class="card">
        <h2>Your Flashcards</h2>
        <p class="muted" style={{ textAlign: "center", padding: "24px 0" }}>
          Tap any word in the transcript above to add it to your flashcard deck.
          <br />
          <span style={{ fontSize: "13px" }}>You can save up to 10 cards.</span>
        </p>
      </div>
    );
  }

  const current = cards[index];
  const onPrev = () => {
    setIndex((value) => Math.max(0, value - 1));
    setFlipped(false);
  };
  const onNext = () => {
    setIndex((value) => Math.min(cards.length - 1, value + 1));
    setFlipped(false);
  };
  const onRemove = (e) => {
    e.stopPropagation();
    removeCard(current.word);
  };

  return (
    <div class="card flashcard-deck">
      <h2>Your Flashcards</h2>
      <p class="flashcard-counter">
        {index + 1} of {cards.length}
        <span style={{ color: "var(--text-light)", marginLeft: "8px", fontSize: "13px" }}>
          ({cards.length}/10 cards)
        </span>
      </p>

      <div class="flashcard-frame">
        <button
          class={`flashcard ${flipped ? "is-flipped" : ""}`}
          type="button"
          onClick={() => setFlipped((value) => !value)}
          aria-label="Flip flashcard"
        >
          <span class="flashcard-face flashcard-front">
            <span class="flashcard-word">{current.word}</span>
            {current.isVocabWord && (
              <span
                style={{
                  fontSize: "11px",
                  color: "var(--primary-blue)",
                  background: "rgba(37,99,235,0.08)",
                  padding: "2px 8px",
                  borderRadius: "8px",
                  marginTop: "4px",
                }}
              >
                Today's vocabulary
              </span>
            )}
            <span class="muted">Tap to flip</span>
          </span>

          <span class="flashcard-face flashcard-back">
            {current.definition && (
              <span class="flashcard-definition">{current.definition}</span>
            )}
            {current.sentence && (
              <span class="flashcard-example">"{current.sentence}"</span>
            )}
            {!current.definition && !current.sentence && (
              <span class="flashcard-definition muted">No definition available</span>
            )}
            <span class="muted">Tap to flip</span>
          </span>
        </button>
      </div>

      <div class="flashcard-nav">
        <button
          class="button button-secondary"
          type="button"
          onClick={onPrev}
          disabled={index === 0}
        >
          Prev
        </button>
        <button
          class="flashcard-remove-btn"
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${current.word} from deck`}
        >
          Remove
        </button>
        <button
          class="button button-secondary"
          type="button"
          onClick={onNext}
          disabled={index === cards.length - 1}
        >
          Next
        </button>
      </div>
    </div>
  );
}
