export type TagId = 'critical-exam' | 'important-exam' | 'useful-exam' | 'bonus-exam' | string

export type Note = {
  id: string
  text: string
  title?: string
  tags: { id: TagId }[]
  updatedAt?: number
}

export type QuestionKind = 'mcq' | 'cloze' | 'truefalse'

export type Question = {
  id: string
  kind: QuestionKind
  prompt: string
  choices?: string[]
  correctIndex?: number
  answerText?: string   // for cloze/truefalse explanation
  noteId: string
  tagIds: TagId[]
}

export type QuizMode = 'day' | 'week' | 'month'

export type ReviewGrade = 1 | 2 | 3 | 4  // 1:Again 2:Hard 3:Good 4:Easy

export type ReviewItem = {
  noteId: string
  questionId: string
  ease: number        // 130..300
  interval: number    // days
  due: number         // epoch ms
  lastReviewed?: number
}

export type QuizStats = {
  totalQuestions: number
  correctAnswers: number
  averageEase: number
  dueToday: number
  streakDays: number
  lastSession?: number
}