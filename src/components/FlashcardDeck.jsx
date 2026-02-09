import { useEffect, useState } from "preact/hooks";
import { deck, loadDeck, removeCard } from "../stores/deckStore.js";

/**
 * Speak text using the Web Speech API at a learner-friendly pace.
 */
function speak(text, onEnd) {
  if (!window.speechSynthesis || !text) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.85;
  utterance.lang = "en-US";
  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }
  window.speechSynthesis.speak(utterance);
}

export default function FlashcardDeck({ episodeId = "" }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [speaking, setSpeaking] = useState(false);

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

  // Cancel speech on unmount
  useEffect(() => {
    return () => window.speechSynthesis?.cancel();
  }, []);

  const handleSpeak = (text, e) => {
    if (e) e.stopPropagation();
    setSpeaking(true);
    speak(text, () => setSpeaking(false));
  };

  // Empty state
  if (cards.length === 0) {
    return (
      <div class="card">
        <h2>Your Flashcards</h2>
        <p class="flashcard-empty">
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
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  };
  const onNext = () => {
    setIndex((value) => Math.min(cards.length - 1, value + 1));
    setFlipped(false);
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  };
  const onRemove = (e) => {
    e.stopPropagation();
    window.speechSynthesis?.cancel();
    setSpeaking(false);
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
        <div
          class={`flashcard ${flipped ? "is-flipped" : ""}`}
          role="button"
          tabIndex={0}
          onClick={(e) => {
            // Only flip if they didn't click the voice button
            if (!e.target.closest(".voice-btn")) {
              setFlipped((value) => !value);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setFlipped((value) => !value);
            }
          }}
          aria-label="Flip flashcard"
        >
          {/* Front: word + phonetic + voice */}
          <div class="flashcard-face flashcard-front">
            <span class="flashcard-word">{current.word}</span>
            {current.phonetic && (
              <span class="flashcard-phonetic">{current.phonetic}</span>
            )}
            <button
              class={`voice-btn ${speaking && !flipped ? "is-speaking" : ""}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSpeak(current.word, e);
              }}
              aria-label={`Listen to ${current.word}`}
              title="Listen"
            >
              &#x1f50a;
            </button>
            <span class="muted" style={{ marginTop: "8px" }}>Tap to flip</span>
          </div>

          {/* Back: definition + sentence + voice */}
          <div class="flashcard-face flashcard-back">
            {current.definition ? (
              <span class="flashcard-definition">{current.definition}</span>
            ) : (
              <span class="flashcard-definition muted">No definition available</span>
            )}
            {current.sentence && (
              <span class="flashcard-example">"{current.sentence}"</span>
            )}
            <button
              class={`voice-btn ${speaking && flipped ? "is-speaking" : ""}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSpeak(current.sentence || current.word, e);
              }}
              aria-label="Listen to sentence"
              title="Listen to sentence"
              style={{ marginTop: "8px" }}
            >
              &#x1f50a;
            </button>
            <span class="muted" style={{ marginTop: "4px" }}>Tap to flip</span>
          </div>
        </div>
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
