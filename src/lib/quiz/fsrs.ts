// FSRS simplifié (inspiré SM-2), borné pour rester stable offline.
// On garde: ease, interval, due. Grade 1..4 (Again..Easy)
import type { ReviewItem, ReviewGrade } from './types'

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

export function initReview(questionId: string, noteId: string): ReviewItem {
  const now = Date.now()
  return { questionId, noteId, ease: 250, interval: 0, due: now }
}

export function schedule(prev: ReviewItem, grade: ReviewGrade): ReviewItem {
  const now = Date.now()
  let ease = prev.ease
  
  // Adjust ease based on grade
  if (grade === 1) ease = clamp(ease - 20, 130, 300)
  if (grade === 2) ease = clamp(ease - 10, 130, 300)
  if (grade === 3) ease = clamp(ease + 0, 130, 300)
  if (grade === 4) ease = clamp(ease + 10, 130, 300)

  let interval = 0
  if (prev.interval === 0) {
    interval = grade <= 2 ? 1 : 1
  } else {
    const factor = ease / 250
    interval = Math.round(prev.interval * factor)
    if (grade === 1) interval = 1
    if (interval < 1) interval = 1
  }

  const due = now + interval * 24 * 60 * 60 * 1000
  return { ...prev, ease, interval, lastReviewed: now, due }
}

export function calculateRetention(reviews: ReviewItem[]): number {
  if (reviews.length === 0) return 0
  const successful = reviews.filter(r => r.ease >= 250).length
  return successful / reviews.length
}