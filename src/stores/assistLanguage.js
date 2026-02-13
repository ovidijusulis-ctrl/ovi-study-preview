import { signal } from "@preact/signals";

const STORAGE_KEY = "ovi-assist-language";
const ALLOWED = new Set(["en", "ja", "es"]);

export const assistLanguage = signal("en");

function normalizeLanguage(value) {
  const lang = String(value || "").trim().toLowerCase();
  return ALLOWED.has(lang) ? lang : "en";
}

export function loadAssistLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    assistLanguage.value = normalizeLanguage(saved);
  } catch (_err) {
    assistLanguage.value = "en";
  }
  return assistLanguage.value;
}

export function setAssistLanguage(language) {
  const normalized = normalizeLanguage(language);
  assistLanguage.value = normalized;
  try {
    localStorage.setItem(STORAGE_KEY, normalized);
  } catch (_err) {
    // ignore localStorage errors
  }
  window.dispatchEvent(
    new CustomEvent("assist-language-updated", {
      detail: { language: normalized },
    }),
  );
  return normalized;
}

