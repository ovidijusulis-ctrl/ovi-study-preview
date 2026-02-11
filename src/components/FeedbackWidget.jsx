import { useEffect, useState } from "preact/hooks";

const QUESTIONS = [
  { id: "interest", label: "How interesting was this story?" },
  { id: "clarity", label: "How clear was the explanation?" },
  { id: "vocabulary", label: "How useful were the new words?" },
  { id: "culture", label: "Was the culture part interesting?" },
  { id: "recommend", label: "Would you recommend this lesson?" },
];

const SCALE = [
  { value: 1, emoji: "😕", title: "1 - Not at all" },
  { value: 2, emoji: "😐", title: "2 - A little" },
  { value: 3, emoji: "🙂", title: "3 - Okay" },
  { value: 4, emoji: "😊", title: "4 - Good" },
  { value: 5, emoji: "🔥", title: "5 - Excellent" },
];

const RATING_PREFIX = "episode-rating-";
const LEGACY_PREFIX = "feedback-";

function computeAverage(responses) {
  const values = QUESTIONS
    .map((q) => Number(responses[q.id]))
    .filter((value) => Number.isFinite(value) && value >= 1 && value <= 5);

  if (values.length === 0) return 0;
  const total = values.reduce((sum, value) => sum + value, 0);
  return Number((total / values.length).toFixed(2));
}

export default function FeedbackWidget({ episodeId = "" }) {
  const [responses, setResponses] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [average, setAverage] = useState(0);

  useEffect(() => {
    if (!episodeId) return;

    try {
      const raw = localStorage.getItem(`${RATING_PREFIX}${episodeId}`);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      const savedResponses = parsed?.responses && typeof parsed.responses === "object"
        ? parsed.responses
        : {};

      if (Object.keys(savedResponses).length === QUESTIONS.length) {
        setResponses(savedResponses);
        setAverage(Number(parsed.average || computeAverage(savedResponses)));
        setSubmitted(true);
      }
    } catch (_err) {
      // Ignore localStorage parse failures.
    }
  }, [episodeId]);

  const saveRating = (nextResponses) => {
    const nextAverage = computeAverage(nextResponses);
    const payload = {
      responses: nextResponses,
      average: nextAverage,
      count: QUESTIONS.length,
      ratedAt: Date.now(),
      version: 1,
    };

    setResponses(nextResponses);
    setAverage(nextAverage);
    setSubmitted(true);

    try {
      localStorage.setItem(`${RATING_PREFIX}${episodeId}`, JSON.stringify(payload));
      localStorage.setItem(`${LEGACY_PREFIX}${episodeId}`, JSON.stringify({
        ...nextResponses,
        timestamp: payload.ratedAt,
      }));
    } catch (_err) {
      // Ignore storage failures.
    }

    window.dispatchEvent(
      new CustomEvent("episode-rating-updated", {
        detail: { episodeId, average: nextAverage },
      }),
    );
  };

  const handleSelect = (questionId, value) => {
    if (submitted) return;

    const nextResponses = { ...responses, [questionId]: value };
    setResponses(nextResponses);

    if (Object.keys(nextResponses).length === QUESTIONS.length) {
      saveRating(nextResponses);
    }
  };

  if (submitted) {
    return (
      <div class="card feedback-widget">
        <h2>Thanks for rating this lesson</h2>
        <p class="feedback-score">Popular score saved: {average.toFixed(2)}/5</p>
        <p class="muted">This score is used by the Popular sort on the homepage.</p>
        <button
          class="button button-secondary feedback-edit-btn"
          type="button"
          onClick={() => setSubmitted(false)}
        >
          Update rating
        </button>
      </div>
    );
  }

  return (
    <div class="card feedback-widget">
      <h2>Rate this lesson</h2>
      <p class="muted">Answer 5 quick questions. It helps rank better lessons.</p>

      {QUESTIONS.map((question) => (
        <div class="feedback-row" key={question.id}>
          <span class="feedback-label">{question.label}</span>
          <div class="feedback-options">
            {SCALE.map((option) => (
              <button
                key={option.value}
                type="button"
                class={`feedback-emoji ${Number(responses[question.id]) === option.value ? "selected" : ""}`}
                onClick={() => handleSelect(question.id, option.value)}
                title={option.title}
                aria-label={`${question.label}: ${option.title}`}
              >
                <span>{option.emoji}</span>
                <small>{option.value}</small>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
