import { useState } from "preact/hooks";

/**
 * Inline comprehension question that appears between transcript paragraphs.
 * Shows a question with click-to-reveal answer and hint.
 */
export default function InlineQuestion({ question, answer, hint }) {
  const [revealed, setRevealed] = useState(false);

  if (!question) return null;

  return (
    <div class="inline-question" role="region" aria-label="Comprehension check">
      <div class="inline-question-icon">?</div>
      <div class="inline-question-body">
        <p class="inline-question-text">{question}</p>

        {!revealed ? (
          <button
            class="inline-question-reveal"
            type="button"
            onClick={() => setRevealed(true)}
          >
            Think, then tap to check your answer
          </button>
        ) : (
          <div class="inline-question-answer">
            <p style={{ margin: "0 0 4px", fontWeight: 600 }}>{answer}</p>
            {hint && (
              <p class="muted" style={{ margin: 0, fontSize: "13px", fontStyle: "italic" }}>
                Tip: {hint}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
