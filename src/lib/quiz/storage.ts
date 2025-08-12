import localforage from 'localforage'
import type { ReviewItem, QuizStats } from './types'

localforage.config({ name: 'sid', storeName: 'quiz' })

export async function saveReview(item: ReviewItem): Promise<void> {
  await localforage.setItem(`rev:${item.questionId}`, item)
}

export async function getReview(questionId: string): Promise<ReviewItem | null> {
  return (await localforage.getItem<ReviewItem>(`rev:${questionId}`)) || null
}

export async function dueQuestions(ids: string[], now = Date.now()): Promise<Set<string>> {
  const due = new Set<string>()
  for (const id of ids) {
    const it = await getReview(id)
    if (!it || it.due <= now) due.add(id)
  }
  return due
}

export async function getQuizStats(): Promise<QuizStats> {
  const keys = await localforage.keys()
  const reviewKeys = keys.filter(k => k.startsWith('rev:'))
  
  let totalQuestions = 0
  let correctAnswers = 0
  let totalEase = 0
  let dueToday = 0
  const now = Date.now()
  const today = new Date().setHours(0, 0, 0, 0)
  
  for (const key of reviewKeys) {
    const review = await localforage.getItem<ReviewItem>(key)
    if (!review) continue
    
    totalQuestions++
    if (review.ease >= 250) correctAnswers++
    totalEase += review.ease
    if (review.due <= now) dueToday++
  }
  
  // Calculate streak (simplified)
  const streakDays = await getStreakDays()
  const lastSession = await localforage.getItem<number>('lastSession')
  
  return {
    totalQuestions,
    correctAnswers,
    averageEase: totalQuestions > 0 ? totalEase / totalQuestions : 250,
    dueToday,
    streakDays,
    lastSession: lastSession || undefined
  }
}

export async function updateLastSession(): Promise<void> {
  await localforage.setItem('lastSession', Date.now())
}

async function getStreakDays(): Promise<number> {
  // Simplified streak calculation
  const streak = await localforage.getItem<number>('streakDays') || 0
  const lastSession = await localforage.getItem<number>('lastSession')
  
  if (!lastSession) return 0
  
  const daysSinceLastSession = Math.floor((Date.now() - lastSession) / (24 * 60 * 60 * 1000))
  
  if (daysSinceLastSession === 0) return streak
  if (daysSinceLastSession === 1) {
    const newStreak = streak + 1
    await localforage.setItem('streakDays', newStreak)
    return newStreak
  }
  
  // Streak broken
  await localforage.setItem('streakDays', 0)
  return 0
}