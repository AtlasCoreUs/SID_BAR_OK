import type { Note, Question, QuizMode, TagId } from './types'

const WEIGHTS: Record<TagId, number> = {
  'critical-exam': 4,
  'important-exam': 3,
  'useful-exam': 2,
  'bonus-exam': 1
}

function pick<T>(arr: T[], k: number): T[] {
  return arr.slice().sort(() => 0.5 - Math.random()).slice(0, k)
}

function toSentences(text: string): string[] {
  return text.replace(/\n+/g, ' ').split(/[\.?!]+/).map(s => s.trim()).filter(Boolean)
}

function makeCloze(sentence: string): { prompt: string; answer: string } | null {
  const words = sentence.split(/\s+/).filter(w => w.length > 3)
  if (words.length < 2) return null
  const target = words[Math.floor(Math.random() * words.length)]
  const prompt = sentence.replace(new RegExp(`\\b${target}\\b`, 'i'), '____')
  return { prompt, answer: target }
}

function detectFormula(text: string): boolean {
  const patterns = [
    /[a-zA-Z]\s*=\s*[^=]/,
    /\d+\s*[\+\-\*\/]\s*\d+/,
    /[∫∑∏√∂∇]/,
    /\^[0-9\{\}]+/,
    /_[0-9\{\}]+/,
    /\\[a-zA-Z]+/,
  ]
  return patterns.some(rx => rx.test(text))
}

function detectDefinition(text: string): boolean {
  const patterns = [
    /est\s+(un|une|le|la|les|des)\s+/i,
    /:\s*[A-Z]/,
    /définition\s*:/i,
    /déf\s*:/i,
    /=\s*"/,
  ]
  return patterns.some(rx => rx.test(text))
}

export function generateQuestions(notes: Note[], mode: QuizMode, count = 20): Question[] {
  // Weight notes by tags
  const weighted: Note[] = []
  for (const n of notes) {
    const w = Math.max(1, ...n.tags.map(t => WEIGHTS[t.id] || 1))
    for (let i = 0; i < w; i++) weighted.push(n)
  }
  
  const pool = mode === 'month' ? weighted : pick(weighted, Math.min(weighted.length, 200))
  const chosen = pick(pool, Math.min(count, pool.length))

  const questions: Question[] = []
  for (const n of chosen) {
    const sents = toSentences(n.text)
    if (sents.length === 0) continue
    
    const base = sents[Math.floor(Math.random() * sents.length)]
    const tagIds = n.tags.map(t => t.id)

    // Smart question type selection based on content
    let kind: Question['kind']
    if (detectFormula(base)) {
      kind = 'cloze' // Formulas work better as cloze
    } else if (detectDefinition(base)) {
      kind = Math.random() > 0.5 ? 'cloze' : 'truefalse'
    } else {
      kind = ['mcq', 'cloze', 'truefalse'][Math.floor(Math.random() * 3)] as Question['kind']
    }

    if (kind === 'cloze') {
      const c = makeCloze(base)
      if (!c) continue
      questions.push({
        id: 'q_' + n.id + '_' + Math.random().toString(36).slice(2, 7),
        kind: 'cloze',
        prompt: c.prompt,
        answerText: c.answer,
        noteId: n.id,
        tagIds
      })
    } else if (kind === 'truefalse') {
      const isTrue = Math.random() > 0.5
      const prompt = isTrue ? base : base.replace(/\b(est|sont|a|ont)\b/i, "n'$1 pas")
      questions.push({
        id: 'q_' + n.id + '_' + Math.random().toString(36).slice(2, 7),
        kind: 'truefalse',
        prompt,
        answerText: isTrue ? 'Vrai' : 'Faux',
        noteId: n.id,
        tagIds
      })
    } else {
      // MCQ: improved distractors
      const words = Array.from(new Set(n.text.split(/\W+/).filter(w => w.length > 3))).slice(0, 50)
      const correct = base
      const distractors = pick(words, 3).map(w => `Concept lié à "${w}"`)
      const choices = pick([correct, ...distractors], 4)
      const correctIndex = choices.indexOf(correct)
      questions.push({
        id: 'q_' + n.id + '_' + Math.random().toString(36).slice(2, 7),
        kind: 'mcq',
        prompt: 'Choisis l\'énoncé correct:',
        choices,
        correctIndex,
        noteId: n.id,
        tagIds
      })
    }
  }
  return questions
}