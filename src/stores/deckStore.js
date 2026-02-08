/**
 * Shared flashcard deck store using Preact Signals.
 * Used by VocabPopup and FlashcardDeck to share state across islands.
 * Cards persist in localStorage keyed by episode ID.
 */
import { signal } from "@preact/signals";

const STORAGE_KEY = "ovi-deck-";
const MAX_CARDS = 10;

/** The current deck of saved flashcards */
export const deck = signal([]);

/** Current episode ID (set by loadDeck) */
let currentEpisodeId = null;

/**
 * Load saved deck from localStorage for a given episode.
 */
export function loadDeck(episodeId) {
  currentEpisodeId = episodeId;
  try {
    const saved = localStorage.getItem(STORAGE_KEY + episodeId);
    deck.value = saved ? JSON.parse(saved) : [];
  } catch (_) {
    deck.value = [];
  }
}

/**
 * Add a card to the deck. Returns true on success, false if full or duplicate.
 * Card shape: { word, sentence, definition, isVocabWord }
 */
export function addCard(card) {
  if (deck.value.length >= MAX_CARDS) return false;
  if (deck.value.some((c) => c.word.toLowerCase() === card.word.toLowerCase()))
    return false;

  deck.value = [...deck.value, card];
  persist();
  return true;
}

/**
 * Remove a card by word.
 */
export function removeCard(word) {
  deck.value = deck.value.filter((c) => c.word !== word);
  persist();
}

/**
 * Check if a word is already in the deck.
 */
export function isInDeck(word) {
  return deck.value.some(
    (c) => c.word.toLowerCase() === word.toLowerCase(),
  );
}

/** Save current deck to localStorage */
function persist() {
  if (!currentEpisodeId) return;
  try {
    localStorage.setItem(
      STORAGE_KEY + currentEpisodeId,
      JSON.stringify(deck.value),
    );
  } catch (_) {
    // localStorage full or unavailable — ignore
  }
}
