import { useState } from "preact/hooks";

const DIMENSIONS = [
  {
    label: "Speed",
    options: [
      { emoji: "🐢", value: "slow", title: "Too Slow" },
      { emoji: "🚶", value: "perfect", title: "Perfect" },
      { emoji: "🏎️", value: "fast", title: "Too Fast" },
    ],
  },
  {
    label: "Difficulty",
    options: [
      { emoji: "👶", value: "easy", title: "Too Easy" },
      { emoji: "🧠", value: "good", title: "Just Right" },
      { emoji: "🤯", value: "hard", title: "Too Hard" },
    ],
  },
  {
    label: "Feeling",
    options: [
      { emoji: "🤩", value: "loved", title: "Loved It" },
      { emoji: "😐", value: "okay", title: "Okay" },
      { emoji: "😴", value: "boring", title: "Boring" },
    ],
  },
];

export default function FeedbackWidget({ episodeId = "" }) {
  const [responses, setResponses] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (dimension, value) => {
    const updated = { ...responses, [dimension]: value };
    setResponses(updated);

    if (Object.keys(updated).length === DIMENSIONS.length) {
      setSubmitted(true);
      try {
        const key = `feedback-${episodeId}`;
        localStorage.setItem(key, JSON.stringify({ ...updated, timestamp: Date.now() }));
      } catch (_err) {
        // Ignore storage failures.
      }
    }
  };

  if (submitted) {
    return (
      <div class="card feedback-widget">
        <p style={{ textAlign: "center", fontSize: "20px" }}>
          Thank you for your feedback! 🙏
        </p>
      </div>
    );
  }

  return (
    <div class="card feedback-widget">
      <h2>How was this episode?</h2>
      <p class="muted">Tap one emoji per row. No account needed.</p>
      {DIMENSIONS.map((dim) => (
        <div class="feedback-row" key={dim.label}>
          <span class="feedback-label">{dim.label}</span>
          <div class="feedback-options">
            {dim.options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                class={`feedback-emoji ${responses[dim.label] === opt.value ? "selected" : ""}`}
                onClick={() => handleSelect(dim.label, opt.value)}
                title={opt.title}
                aria-label={`${dim.label}: ${opt.title}`}
              >
                {opt.emoji}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
