/**
 * Free Dictionary API client with in-memory cache.
 * Fetches definitions from https://api.dictionaryapi.dev
 * Adds a learner-friendly plain-English cleanup layer.
 */

const cache = new Map();

const PHRASE_REPLACEMENTS = [
  [/\bthe act of\b/gi, "doing"],
  [/\bthe process of\b/gi, "the way of"],
  [/\bused to\b/gi, "used for"],
  [/\bobtain\b/gi, "get"],
  [/\butilize\b/gi, "use"],
  [/\breside\b/gi, "live"],
  [/\bconsume\b/gi, "eat or drink"],
  [/\bcommence\b/gi, "start"],
  [/\bterminate\b/gi, "end"],
  [/\bapproximately\b/gi, "about"],
  [/\bin order to\b/gi, "to"],
  [/\bthat is to say\b/gi, "meaning"],
  [/\be\.g\.\b/gi, "for example"],
  [/\bi\.e\.\b/gi, "in other words"],
];

function normalizeSpaces(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function sentenceCase(text) {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function definitionComplexityScore(definition) {
  const clean = normalizeSpaces(definition).toLowerCase();
  const words = clean.split(/\s+/).filter(Boolean);
  const longWords = words.filter((w) => w.replace(/[^a-z]/g, "").length >= 11).length;
  const punctuationPenalty = /[;:()]/.test(clean) ? 2 : 0;

  return words.length + longWords * 2 + punctuationPenalty;
}

function pickBestDefinition(entry) {
  const candidates = [];
  for (const meaning of entry.meanings || []) {
    for (const def of meaning.definitions || []) {
      const text = normalizeSpaces(def?.definition);
      if (!text) continue;
      candidates.push({
        definition: text,
        partOfSpeech: meaning?.partOfSpeech || "",
        example: normalizeSpaces(def?.example || ""),
      });
    }
  }

  if (!candidates.length) {
    return {
      definition: "",
      partOfSpeech: "",
      example: "",
    };
  }

  const mediumLength = candidates.filter((c) => {
    const wc = c.definition.split(/\s+/).filter(Boolean).length;
    return wc >= 5 && wc <= 24;
  });

  const pool = mediumLength.length ? mediumLength : candidates;
  pool.sort(
    (a, b) =>
      definitionComplexityScore(a.definition) - definitionComplexityScore(b.definition)
  );

  return pool[0];
}

function simplifyDefinition(definition) {
  let text = normalizeSpaces(definition);
  if (!text) return "";

  // Remove side notes but keep meaning intact.
  text = text.replace(/\([^)]*\)/g, "");
  text = text.replace(/\[[^\]]*\]/g, "");
  text = normalizeSpaces(text);

  for (const [pattern, replacement] of PHRASE_REPLACEMENTS) {
    text = text.replace(pattern, replacement);
  }

  text = text
    .replace(/\bchiefly\b/gi, "mostly")
    .replace(/\busually\b/gi, "often")
    .replace(/\bone who\b/gi, "a person who")
    .replace(/\bthat which\b/gi, "something that");

  text = normalizeSpaces(text.replace(/\s+,/g, ",").replace(/\s+\./g, "."));

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length > 30) {
    const firstClause = text.split(/[;:]/)[0];
    const firstClauseWords = firstClause.split(/\s+/).filter(Boolean);
    text = firstClauseWords.length >= 6 ? firstClause : `${words.slice(0, 30).join(" ")}...`;
  }

  return sentenceCase(text);
}

/**
 * Look up a word in the Free Dictionary API.
 * @param {string} word - The word to look up
 * @returns {Promise<{word: string, phonetic: string, partOfSpeech: string, definition: string, rawDefinition: string, example: string} | null>}
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

    const phonetic =
      entry.phonetic ||
      entry.phonetics?.find((p) => p.text)?.text ||
      "";

    const best = pickBestDefinition(entry);
    const rawDefinition = best.definition || "";

    let definition = simplifyDefinition(rawDefinition);
    if (!definition) definition = rawDefinition;

    const result = {
      word: entry.word || key,
      phonetic,
      partOfSpeech: best.partOfSpeech || "",
      definition,
      rawDefinition,
      example: best.example || "",
    };

    cache.set(key, result);
    return result;
  } catch (_e) {
    cache.set(key, null);
    return null;
  }
}
