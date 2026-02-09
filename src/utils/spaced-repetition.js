/**
 * Spaced repetition scheduler for flashcard reviews.
 * Grades: "again" (forgot), "hard", "good", "easy"
 * Intervals stored in hours, persisted in localStorage.
 */

function gradeToMultiplier(grade) {
  if (grade === "again") return 0.35;
  if (grade === "hard") return 0.8;
  if (grade === "easy") return 1.8;
  return 1.25; // good
}

export function nextIntervalHours(previousHours, grade) {
  const base = Math.max(previousHours || 8, 1);
  const next = Math.round(base * gradeToMultiplier(grade));
  return Math.min(Math.max(next, 1), 24 * 45); // 1 hour to 45 days
}

export function computeNextReviewAt(lastReviewAt, previousHours, grade) {
  const from = new Date(lastReviewAt || Date.now());
  const hours = nextIntervalHours(previousHours, grade);
  return new Date(from.getTime() + hours * 60 * 60 * 1000).toISOString();
}

export function isDueForReview(card) {
  if (!card.nextReviewAt) return true; // never reviewed
  return new Date(card.nextReviewAt) <= new Date();
}

export function getDueCards(cards) {
  return cards.filter(isDueForReview);
}
