import { useEffect, useRef, useState } from "preact/hooks";
import { deck, loadDeck } from "../stores/deckStore.js";

const MIN_CARDS = 5;
const QUESTIONS_PER_RUN = 5;

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function shuffle(values) {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function maskWord(text, word) {
  const safeText = String(text || "").trim();
  if (!safeText || !word) return safeText;

  try {
    const escaped = String(word).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`\\b${escaped}\\b`, "gi");
    return safeText.replace(pattern, "____");
  } catch (_err) {
    return safeText;
  }
}

function scoreMessage(score, total) {
  if (score === total) return "Excellent. You understood all your selected words.";
  if (score >= Math.ceil(total * 0.8)) return "Very strong result. Keep these words in review.";
  if (score >= Math.ceil(total * 0.6)) return "Good progress. Review the missed words once more.";
  return "You are still learning these words. Use flashcards and try again.";
}

function pickPrompt(card) {
  const example = String(card.example || "").trim();
  const sentence = String(card.sentence || "").trim();
  const definition = String(card.definition || "").trim();

  if (example) {
    return {
      type: "example",
      lead: "Which word best completes this example sentence?",
      text: maskWord(example, card.word),
    };
  }

  if (sentence) {
    return {
      type: "context",
      lead: "Which word best completes this lesson sentence?",
      text: maskWord(sentence, card.word),
    };
  }

  if (definition) {
    return {
      type: "meaning",
      lead: "Which word matches this meaning?",
      text: definition,
    };
  }

  return {
    type: "fallback",
    lead: "Which word are we testing?",
    text: "This word appears in your lesson deck.",
  };
}

function buildQuestions(cards) {
  const usable = cards
    .filter((card) => card?.word)
    .map((card) => ({
      word: String(card.word).trim(),
      definition: String(card.definition || "").trim(),
      sentence: String(card.sentence || "").trim(),
      example: String(card.example || "").trim(),
    }))
    .filter((card) => card.word.length > 0);

  const shuffled = shuffle(usable);
  const picked = shuffled.slice(0, Math.min(QUESTIONS_PER_RUN, shuffled.length));

  return picked.map((answerCard) => {
    const otherWords = usable
      .filter((card) => normalize(card.word) !== normalize(answerCard.word))
      .map((card) => card.word);

    const distractors = shuffle([...new Set(otherWords)]).slice(0, 3);
    const prompt = pickPrompt(answerCard);

    return {
      promptType: prompt.type,
      promptLead: prompt.lead,
      prompt: prompt.text,
      answer: answerCard.word,
      definition: answerCard.definition,
      options: shuffle([answerCard.word, ...distractors]),
    };
  });
}

function feedbackText(correct, item, option) {
  const meaning = item.definition ? ` Meaning: ${item.definition}` : "";
  if (correct) {
    return `Correct. ${item.answer}.${meaning}`;
  }
  return `Incorrect. Correct answer: ${item.answer}.${meaning}`;
}

export default function FlashcardVocabTest({ episodeId = "" }) {
  const [started, setStarted] = useState(false);
  const [items, setItems] = useState([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState("");
  const [answered, setAnswered] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const completionReportedRef = useRef(false);

  useEffect(() => {
    if (episodeId) loadDeck(episodeId);
  }, [episodeId]);

  const cards = deck.value;
  const unlocked = cards.length >= MIN_CARDS;

  useEffect(() => {
    if (started && !unlocked) {
      setStarted(false);
      setItems([]);
      setCurrent(0);
      setScore(0);
      setSelected("");
      setAnswered(false);
      setFeedback(null);
    }
  }, [started, unlocked]);

  const startQuiz = () => {
    const generated = buildQuestions(cards);
    if (generated.length === 0) return;

    window.dispatchEvent(
      new CustomEvent("episode-behavior", {
        detail: { metric: "vocabTestStarts", amount: 1 },
      }),
    );

    setItems(generated);
    setCurrent(0);
    setScore(0);
    setSelected("");
    setAnswered(false);
    setFeedback(null);
    setStarted(true);
    completionReportedRef.current = false;
  };

  if (!unlocked) {
    return (
      <div class="card quiz-card">
        <h2>Vocabulary Test</h2>
        <p class="muted">
          Unlocks when you save at least {MIN_CARDS} flashcards.
        </p>
        <p class="progress">Current: {cards.length}/{MIN_CARDS} cards</p>
      </div>
    );
  }

  if (!started) {
    return (
      <div class="card quiz-card">
        <h2>Vocabulary Test</h2>
        <p class="muted">
          This test uses sentence context from your flashcards and dictionary examples.
        </p>
        <p class="progress">
          Deck ready: {cards.length} cards | Questions: {Math.min(QUESTIONS_PER_RUN, cards.length)}
        </p>
        <div class="flashcard-nav">
          <button class="button button-primary" type="button" onClick={startQuiz}>
            Start Vocabulary Test
          </button>
        </div>
      </div>
    );
  }

  const total = items.length;
  const isFinished = current >= total;

  useEffect(() => {
    if (!started || !isFinished || total === 0) return;
    if (completionReportedRef.current) return;
    completionReportedRef.current = true;
    window.dispatchEvent(
      new CustomEvent("episode-behavior", {
        detail: { metric: "vocabTestCompletions", amount: 1 },
      }),
    );
  }, [started, isFinished, total]);

  if (isFinished) {
    const percent = Math.round((score / total) * 100);
    return (
      <div class="card score-panel">
        <h2>Vocabulary Test Complete</h2>
        <p>You got {score} of {total} correct.</p>
        <p>Score: {percent}%</p>
        <p>{scoreMessage(score, total)}</p>
        <div class="flashcard-nav">
          <button class="button button-primary" type="button" onClick={startQuiz}>
            Retake Test
          </button>
        </div>
      </div>
    );
  }

  const item = items[current];

  const onSelect = (option) => {
    if (answered) return;

    const correct = normalize(option) === normalize(item.answer);
    setSelected(option);
    if (correct) {
      setScore((prev) => prev + 1);
      setFeedback({ type: "success", text: feedbackText(true, item, option) });
    } else {
      setFeedback({ type: "error", text: feedbackText(false, item, option) });
    }
    setAnswered(true);
  };

  const next = () => {
    setSelected("");
    setAnswered(false);
    setFeedback(null);
    setCurrent((prev) => prev + 1);
  };

  return (
    <div class="card quiz-card">
      <h2>Vocabulary Test</h2>
      <p class="progress">Question {current + 1} of {total}</p>
      <p>{item.promptLead}</p>
      <p><strong>{item.prompt}</strong></p>

      <div class="option-list">
        {item.options.map((option) => (
          <button
            key={option}
            class="button button-secondary option-button"
            type="button"
            onClick={() => onSelect(option)}
            disabled={answered}
            aria-pressed={selected === option}
          >
            {option}
          </button>
        ))}
      </div>

      {feedback ? <div class={`feedback ${feedback.type}`}>{feedback.text}</div> : null}

      {answered ? (
        <button class="button button-primary" type="button" onClick={next}>
          Next
        </button>
      ) : null}
    </div>
  );
}
