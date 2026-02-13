import { useEffect } from "preact/hooks";
import { assistLanguage, loadAssistLanguage, setAssistLanguage } from "../stores/assistLanguage.js";

const OPTIONS = [
  { value: "en", label: "English" },
  { value: "ja", label: "Japanese" },
  { value: "es", label: "Spanish" },
];

export default function AssistLanguageToggle() {
  useEffect(() => {
    loadAssistLanguage();
  }, []);

  const current = assistLanguage.value;

  return (
    <div class="assist-lang" role="group" aria-label="Language help">
      {OPTIONS.map((option) => {
        const active = option.value === current;
        return (
          <button
            key={option.value}
            type="button"
            class={`assist-lang-btn ${active ? "is-active" : ""}`}
            onClick={() => setAssistLanguage(option.value)}
            aria-pressed={active ? "true" : "false"}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

