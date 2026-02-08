import { useMemo, useState } from "preact/hooks";

function shuffle(items) {
  const values = [...items];
  for (let i = values.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [values[i], values[j]] = [values[j], values[i]];
  }
  return values;
}

function normalize(text) {
  return String(text).trim().toLowerCase();
}

function scoreMessage(score, total) {
  if (score === total) return "Perfect. You're a superstar.";
  if (score >= 6) return "Excellent work. You're making great progress.";
  if (score >= 4) return "Good effort. Keep practicing.";
  return "You're learning. Try again tomorrow.";
}

export default function QuizSection({ questions = [], exercises = [], vocabulary = [] }) {
  const mcqItems = useMemo(() => {
    const fallbackDistractors = [
      "It happened in a different city.",
      "The story does not say that.",
      "It was never mentioned in the lesson.",
      "That answer is not in today's episode.",
    ];

    return questions.slice(0, 3).map((item, index, list) => {
      const otherAnswers = list
        .filter((_, idx) => idx !== index)
        .map((value) => value.answer)
        .filter(Boolean);
      const vocabDistractors = vocabulary
        .map((entry) => `${entry.word}: ${entry.definition}`)
        .slice(0, 3);

      const distractorPool = [...otherAnswers, ...vocabDistractors, ...fallbackDistractors].filter(
        (value) => normalize(value) !== normalize(item.answer),
      );

      const distractors = [];
      for (const candidate of distractorPool) {
        if (distractors.length === 3) break;
        if (!distractors.some((value) => normalize(value) === normalize(candidate))) {
          distractors.push(candidate);
        }
      }

      while (distractors.length < 3) {
        distractors.push("Not stated in this episode.");
      }

      return {
        type: "mcq",
        question: item.question,
        answer: item.answer,
        options: shuffle([item.answer, ...distractors]),
      };
    });
  }, [questions, vocabulary]);

  const clozeItems = useMemo(() => {
    return exercises.slice(0, 5).map((item) => {
      const distractorPool = vocabulary
        .map((entry) => entry.word)
        .filter((word) => normalize(word) !== normalize(item.answer));

      const distractors = shuffle(distractorPool).slice(0, 3);
      const fallbackWords = ["journey", "adventure", "discover", "explore"];
      while (distractors.length < 3) {
        distractors.push(fallbackWords[distractors.length % fallbackWords.length]);
      }

      return {
        ...item,
        type: "cloze",
        options: shuffle([item.answer, ...distractors]),
      };
    });
  }, [exercises, vocabulary]);

  const allItems = [...mcqItems, ...clozeItems];
  const total = allItems.length;

  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [answered, setAnswered] = useState(false);

  if (total === 0) {
    return (
      <div class="card">
        <h2>Practice Quiz</h2>
        <p class="muted">Quiz content is not available for this episode.</p>
      </div>
    );
  }

  const item = allItems[current];
  const isFinished = current >= total;

  const onMcqSelect = (option) => {
    if (answered) return;

    const correct = normalize(option) === normalize(item.answer);
    setSelected(option);
    if (correct) {
      setScore((value) => value + 1);
      setFeedback({ type: "success", text: "Correct." });
    } else {
      setFeedback({
        type: "error",
        text: `Incorrect. The answer is: ${item.answer}`,
      });
    }
    setAnswered(true);
  };

  const onClozeSelect = (option) => {
    const correct = normalize(option) === normalize(item.answer);
    setSelected(option);
    if (correct) {
      if (!answered) {
        setScore((value) => value + 1);
      }
      setFeedback({ type: "success", text: "Correct." });
      setAnswered(true);
    } else {
      setFeedback({ type: "error", text: "Incorrect. Try again." });
    }
  };

  const next = () => {
    setSelected("");
    setFeedback(null);
    setAnswered(false);
    setCurrent((value) => value + 1);
  };

  const replay = () => {
    setCurrent(0);
    setScore(0);
    setSelected("");
    setFeedback(null);
    setAnswered(false);
  };

  if (isFinished) {
    const percent = Math.round((score / total) * 100);
    return (
      <div class="card score-panel">
        <h2>Quiz Complete</h2>
        <p>
          You got {score} of {total} correct.
        </p>
        <p>Score: {percent}%</p>
        <p>{scoreMessage(score, total)}</p>
        <div class="flashcard-nav">
          <button class="button button-primary" type="button" onClick={replay}>
            Replay Quiz
          </button>
          <button
            class="button button-secondary"
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            Back to Episode
          </button>
        </div>
      </div>
    );
  }

  return (
    <div class="card quiz-card">
      <h2>Practice Quiz</h2>
      <p class="progress">
        Question {current + 1} of {total}
      </p>
      <p>{item.question || `Exercise ${item.number}`}</p>

      {item.type === "mcq" ? (
        <div class="option-list">
          {item.options.map((option) => (
            <button
              key={option}
              class="button button-secondary option-button"
              type="button"
              onClick={() => onMcqSelect(option)}
              disabled={answered}
            >
              {option}
            </button>
          ))}
        </div>
      ) : (
        <>
          <p>{item.sentence}</p>
          <p class="muted">Hint: {item.hint}</p>
          <div class="chip-list">
            {item.options.map((option) => (
              <button
                key={option}
                type="button"
                class={`chip ${selected === option ? "selected" : ""}`}
                onClick={() => onClozeSelect(option)}
                disabled={answered}
              >
                {option}
              </button>
            ))}
          </div>
        </>
      )}

      {feedback ? (
        <div class={`feedback ${feedback.type}`}>{feedback.text}</div>
      ) : null}

      {answered ? (
        <button class="button button-primary" type="button" onClick={next}>
          Next
        </button>
      ) : null}
    </div>
  );
}
