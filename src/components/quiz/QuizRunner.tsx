'use client'
import React from 'react'
import type { Question, ReviewGrade } from '@/lib/quiz/types'
import { initReview, schedule } from '@/lib/quiz/fsrs'
import { saveReview, getReview, updateLastSession } from '@/lib/quiz/storage'

interface Props {
  questions: Question[]
  onFinish: (score: number) => void
}

export default function QuizRunner({ questions, onFinish }: Props) {
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [score, setScore] = React.useState(0)
  const [userAnswer, setUserAnswer] = React.useState('')
  const [showFeedback, setShowFeedback] = React.useState(false)
  const [isCorrect, setIsCorrect] = React.useState(false)
  
  const question = questions[currentIndex]

  async function gradeAndNext(grade: ReviewGrade, correct: boolean) {
    const prev = (await getReview(question.id)) || initReview(question.id, question.noteId)
    const next = schedule(prev, grade)
    await saveReview(next)
    
    if (correct) setScore(s => s + 1)
    setIsCorrect(correct)
    setShowFeedback(true)
    
    // Auto-advance after showing feedback
    setTimeout(() => {
      if (currentIndex + 1 >= questions.length) {
        updateLastSession()
        onFinish(score + (correct ? 1 : 0))
      } else {
        setCurrentIndex(currentIndex + 1)
        setUserAnswer('')
        setShowFeedback(false)
      }
    }, 1500)
  }

  function submitMCQ(selectedIndex: number) {
    const correct = question.correctIndex === selectedIndex
    gradeAndNext(correct ? 4 : 1, correct)
  }

  function submitTrueFalse(answer: boolean) {
    const correct = question.answerText === (answer ? 'Vrai' : 'Faux')
    gradeAndNext(correct ? 3 : 1, correct)
  }

  function submitCloze() {
    const correct = userAnswer.trim().toLowerCase() === (question.answerText || '').trim().toLowerCase()
    gradeAndNext(correct ? 3 : 2, correct)
  }

  if (!question) return <div className="p-6">Aucune question disponible.</div>

  return (
    <div className="p-6 space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm">
        <span className="opacity-70">{currentIndex + 1} / {questions.length}</span>
        <span className="opacity-70">Score: {score}</span>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-white/10 rounded-full h-2">
        <div 
          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {showFeedback ? (
        <div className={`p-4 rounded-xl ${isCorrect ? 'bg-green-500/20 border-green-500/30' : 'bg-red-500/20 border-red-500/30'} border`}>
          <div className="text-lg font-medium">
            {isCorrect ? '✅ Correct!' : '❌ Incorrect'}
          </div>
          {question.answerText && (
            <div className="text-sm opacity-80 mt-2">
              Réponse: {question.answerText}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Question */}
          <div className="space-y-4">
            <div className="text-lg leading-relaxed">{question.prompt}</div>
            
            {question.kind === 'mcq' && (
              <div className="grid gap-3">
                {question.choices?.map((choice, idx) => (
                  <button
                    key={idx}
                    onClick={() => submitMCQ(idx)}
                    className="px-4 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-left transition-colors"
                  >
                    <span className="font-mono text-sm opacity-60 mr-3">{String.fromCharCode(65 + idx)}.</span>
                    {choice}
                  </button>
                ))}
              </div>
            )}
            
            {question.kind === 'truefalse' && (
              <div className="flex gap-4">
                <button
                  onClick={() => submitTrueFalse(true)}
                  className="flex-1 px-4 py-3 rounded-xl border border-white/10 hover:bg-green-500/10 hover:border-green-500/30 transition-colors"
                >
                  ✅ Vrai
                </button>
                <button
                  onClick={() => submitTrueFalse(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-white/10 hover:bg-red-500/10 hover:border-red-500/30 transition-colors"
                >
                  ❌ Faux
                </button>
              </div>
            )}
            
            {question.kind === 'cloze' && (
              <div className="space-y-3">
                <input
                  autoFocus
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && userAnswer.trim()) {
                      submitCloze()
                    }
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-blue-500/50 focus:outline-none transition-colors"
                  placeholder="Tapez votre réponse..."
                />
                <div className="flex justify-between items-center text-xs opacity-60">
                  <span>Appuyez sur Entrée pour valider</span>
                  <span>{userAnswer.length} caractères</span>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}