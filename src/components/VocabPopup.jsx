import { useEffect, useState, useCallback } from "preact/hooks";
import { deck, addCard, isInDeck } from "../stores/deckStore.js";
import { lookupWord } from "../utils/dictionary.js";

/**
 * Speak text using the Web Speech API.
 * Returns a function to cancel speech.
 */
function speak(text, rate = 0.85) {
  if (!window.speechSynthesis || !text) return () => {};
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  utterance.lang = "en-US";
  window.speechSynthesis.speak(utterance);
  return () => window.speechSynthesis.cancel();
}

export default function VocabPopup() {
  const [entry, setEntry] = useState(null);
  const [lookup, setLookup] = useState(null); // dictionary API result
  const [loading, setLoading] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  // Subscribe to deck signal so button state re-renders
  const deckCards = deck.value;

  // Close popup
  const close = useCallback(() => {
    setEntry(null);
    setLookup(null);
    setLoading(false);
    setSpeaking(false);
    window.speechSynthesis?.cancel();
  }, []);

  useEffect(() => {
    let lastScroll = window.scrollY;

    const openHandler = (event) => {
      if (!event?.detail?.word) return;
      lastScroll = window.scrollY;
      setAddedFeedback(false);
      setSpeaking(false);
      window.speechSynthesis?.cancel();

      const word = event.detail.word;
      const sentence = event.detail.sentence || "";

      setEntry({ word, sentence });
      setLookup(null);
      setLoading(true);

      // Fire dictionary lookup in background (with timeout fallback)
      const timeout = new Promise((resolve) => setTimeout(() => resolve(null), 5000));
      Promise.race([lookupWord(word), timeout])
        .then((result) => {
          setLookup(result);
          setLoading(false);
        })
        .catch(() => {
          setLookup(null);
          setLoading(false);
        });
    };

    const keyHandler = (event) => {
      if (event.key === "Escape") close();
    };

    const scrollHandler = () => {
      if (Math.abs(window.scrollY - lastScroll) > 150) {
        close();
        lastScroll = window.scrollY;
      }
    };

    // Dismiss on tap outside
    const pointerHandler = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest(".vocab-bottom-sheet")) return;
      if (target.closest(".vocab-overlay")) {
        close();
        return;
      }
      if (target.closest("[data-word]")) return;
      close();
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
      window.speechSynthesis?.cancel();
    };
  }, [close]);

  if (!entry) return null;

  const alreadyInDeck = isInDeck(entry.word);
  const deckFull = deck.value.length >= 20;

  const definition = lookup?.definition || "";
  const rawDefinition = lookup?.rawDefinition || "";
  const phonetic = lookup?.phonetic || "";
  const partOfSpeech = lookup?.partOfSpeech || "";
  const example = lookup?.example || "";

  const handleAdd = () => {
    const success = addCard({
      word: entry.word,
      sentence: entry.sentence,
      definition: definition,
      phonetic: phonetic,
      partOfSpeech: partOfSpeech,
      example: example,
    });
    if (success) {
      setAddedFeedback(true);
      setTimeout(() => setAddedFeedback(false), 1500);
    }
  };

  const handleSpeak = (text, e) => {
    if (e) e.stopPropagation();
    setSpeaking(true);
    window.speechSynthesis?.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85;
    utterance.lang = "en-US";
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis?.speak(utterance);
  };

  return (
    <>
      {/* Overlay for desktop — clicking it closes the popup */}
      <div class="vocab-overlay" onClick={close} />

      <div
        class="vocab-bottom-sheet"
        role="complementary"
        aria-label={`Definition for ${entry.word}`}
      >
        <div class="vocab-sheet-handle" />

        {/* Word + voice button */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <h3 style={{ margin: 0 }}>{entry.word}</h3>
          <button
            class={`voice-btn ${speaking ? "is-speaking" : ""}`}
            type="button"
            onClick={(e) => handleSpeak(entry.word, e)}
            aria-label={`Listen to ${entry.word}`}
            title="Listen"
          >
            &#x1f50a;
          </button>
        </div>

        {/* Phonetic + part of speech */}
        {phonetic && <p class="vocab-phonetic">{phonetic}</p>}
        {partOfSpeech && <span class="vocab-pos">{partOfSpeech}</span>}

        {/* Definition */}
        {loading ? (
          <p class="vocab-loading">Looking up definition...</p>
        ) : definition ? (
          <div style={{ marginBottom: "6px" }}>
            <p style={{ margin: "0 0 4px" }}>
              <strong>Simple meaning:</strong> {definition}
            </p>
            {rawDefinition && rawDefinition !== definition && (
              <details>
                <summary style={{ cursor: "pointer", fontSize: "13px" }}>
                  See original dictionary wording
                </summary>
                <p class="muted" style={{ fontSize: "13px", marginTop: "6px", marginBottom: 0 }}>
                  {rawDefinition}
                </p>
              </details>
            )}
          </div>
        ) : (
          <p class="muted" style={{ fontSize: "13px", marginBottom: "6px" }}>
            Definition not found in dictionary.
          </p>
        )}

        {/* Sentence context from episode */}
        {entry.sentence && (
          <p class="muted" style={{ fontSize: "13px", marginTop: "4px" }}>
            <strong>In this episode:</strong> {entry.sentence}
          </p>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", gap: "8px", marginTop: "10px", alignItems: "center", flexWrap: "wrap" }}>
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
              Deck full (20/20)
            </button>
          ) : (
            <button class="button button-primary" type="button" onClick={handleAdd}>
              + Add to Flashcards ({deck.value.length}/20)
            </button>
          )}

          <button
            class="button button-secondary"
            type="button"
            onClick={close}
            style={{ marginLeft: "auto" }}
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}
