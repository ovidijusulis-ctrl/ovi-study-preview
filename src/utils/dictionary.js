/**
 * Free Dictionary API client with in-memory cache.
 * Fetches definitions from https://api.dictionaryapi.dev
 * Used by VocabPopup for live word lookup.
 */

const cache = new Map();

/**
 * Look up a word in the Free Dictionary API.
 * @param {string} word - The word to look up
 * @returns {Promise<{word: string, phonetic: string, partOfSpeech: string, definition: string, example: string} | null>}
 */
export async function lookupWord(word) {
  const key = word.toLowerCase().trim();
  if (!key || key.length < 2) return null;
  if (cache.has(key)) return cache.get(key);

  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(key)}`
    );

    if (!res.ok) {
      cache.set(key, null);
      return null;
    }

    const data = await res.json();
    const entry = data[0];
    if (!entry) {
      cache.set(key, null);
      return null;
    }

    // Extract the best phonetic (prefer one with text)
    const phonetic =
      entry.phonetic ||
      entry.phonetics?.find((p) => p.text)?.text ||
      "";

    // Get the first meaning
    const meaning = entry.meanings?.[0];
    const partOfSpeech = meaning?.partOfSpeech || "";
    const def = meaning?.definitions?.[0];
    const definition = def?.definition || "";
    const example = def?.example || "";

    const result = {
      word: entry.word || key,
      phonetic,
      partOfSpeech,
      definition,
      example,
    };
    cache.set(key, result);
    return result;
  } catch (_e) {
    cache.set(key, null);
    return null;
  }
}
