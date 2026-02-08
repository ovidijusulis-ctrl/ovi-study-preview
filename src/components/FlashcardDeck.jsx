import { useEffect, useMemo, useState } from "preact/hooks";

export default function FlashcardDeck({ cards = [] }) {
  const deck = useMemo(() => cards, [cards]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "ArrowLeft") {
        setIndex((current) => Math.max(0, current - 1));
        setFlipped(false);
      }
      if (event.key === "ArrowRight") {
        setIndex((current) => Math.min(deck.length - 1, current + 1));
        setFlipped(false);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [deck.length]);

  if (deck.length === 0) {
    return (
      <div class="card">
        <h2>Vocabulary Flashcards</h2>
        <p class="muted">No vocabulary cards are available for this episode.</p>
      </div>
    );
  }

  const current = deck[index];
  const onPrev = () => {
    setIndex((value) => Math.max(0, value - 1));
    setFlipped(false);
  };
  const onNext = () => {
    setIndex((value) => Math.min(deck.length - 1, value + 1));
    setFlipped(false);
  };

  return (
    <div class="card flashcard-deck">
      <h2>Vocabulary Flashcards</h2>
      <p class="flashcard-counter">
        {index + 1} of {deck.length}
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
            <span class="muted">Tap to flip</span>
          </span>

          <span class="flashcard-face flashcard-back">
            <span class="flashcard-definition">{current.definition}</span>
            <span class="flashcard-example">{current.example}</span>
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
          class="button button-secondary"
          type="button"
          onClick={onNext}
          disabled={index === deck.length - 1}
        >
          Next
        </button>
      </div>
    </div>
  );
}
