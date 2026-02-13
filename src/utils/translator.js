const cache = new Map();

function normalize(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function cacheKey(text, targetLang) {
  return `${targetLang}:${normalize(text).toLowerCase()}`;
}

/**
 * Translate short helper text from English to target language.
 * Uses MyMemory public translation API with graceful fallback.
 */
export async function translateText(text, targetLang = "ja") {
  const source = normalize(text);
  const target = String(targetLang || "").toLowerCase();
  if (!source) return "";
  if (!["ja", "es"].includes(target)) return "";

  const key = cacheKey(source, target);
  if (cache.has(key)) return cache.get(key);

  try {
    const url = new URL("https://api.mymemory.translated.net/get");
    url.searchParams.set("q", source.slice(0, 280));
    url.searchParams.set("langpair", `en|${target}`);

    const response = await fetch(url.toString());
    if (!response.ok) {
      cache.set(key, "");
      return "";
    }

    const data = await response.json();
    const translated = normalize(data?.responseData?.translatedText || "");
    if (!translated || translated.toLowerCase() === source.toLowerCase()) {
      cache.set(key, "");
      return "";
    }

    cache.set(key, translated);
    return translated;
  } catch (_err) {
    cache.set(key, "");
    return "";
  }
}

