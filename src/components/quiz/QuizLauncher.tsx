import React from 'react';
import type { Note, Question, QuizMode, QuizStats } from '@/lib/quiz/types';
import { generateQuestions } from '@/lib/quiz/generate';
import { getQuizStats } from '@/lib/quiz/storage';
import QuizRunner from './QuizRunner';
import QuizStats from './QuizStats';
import { useQuizHotkeys } from '@/hooks/useQuizHotkeys';
import { Calendar, Clock, Target, TrendingUp } from 'lucide-react';

interface Props {
  notes: Note[];
  mode?: QuizMode;
}

export function QuizLauncher({ notes, mode: initialMode = 'day' }: Props) {
  const [mode, setMode] = React.useState<QuizMode>(initialMode);
  const [questions, setQuestions] = React.useState<Question[] | null>(null);
  const [score, setScore] = React.useState<number | null>(null);
  const [showStats, setShowStats] = React.useState(false);
  const [stats, setStats] = React.useState<QuizStats | null>(null);

  React.useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    const s = await getQuizStats();
    setStats(s);
  }

  function generateQuiz(selectedMode: QuizMode) {
    setMode(selectedMode);
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    
    const subset = selectedMode === 'day'
      ? notes.filter(n => (n.updatedAt ?? 0) >= dayStart.getTime())
      : notes;
    
    const count = selectedMode === 'day' ? 20 : selectedMode === 'week' ? 40 : 60;
    const qs = generateQuestions(subset, selectedMode, count);
    
    setQuestions(qs);
    setScore(null);
    setShowStats(false);
  }

  function onQuizFinish(finalScore: number) {
    setScore(finalScore);
    loadStats(); // Refresh stats after quiz
  }

  useQuizHotkeys({
    daily: () => generateQuiz('day'),
    weekly: () => generateQuiz('week'),
    monthly: () => generateQuiz('month'),
    stats: () => setShowStats(true)
  });

  if (showStats) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Statistiques de révision</h2>
          <button
            onClick={() => setShowStats(false)}
            className="px-3 py-2 rounded-xl border border-white/10 hover:bg-white/5 transition-colors"
          >
            Retour
          </button>
        </div>
        <QuizStats stats={stats} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with stats preview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 text-sm opacity-70">
              <Target className="w-4 h-4" />
              Questions
            </div>
            <div className="text-lg font-semibold">{stats.totalQuestions}</div>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 text-sm opacity-70">
              <TrendingUp className="w-4 h-4" />
              Précision
            </div>
            <div className="text-lg font-semibold">
              {stats.totalQuestions > 0 ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100) : 0}%
            </div>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 text-sm opacity-70">
              <Clock className="w-4 h-4" />
              À réviser
            </div>
            <div className="text-lg font-semibold">{stats.dueToday}</div>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 text-sm opacity-70">
              <Calendar className="w-4 h-4" />
              Série
            </div>
            <div className="text-lg font-semibold">{stats.streakDays} jours</div>
          </div>
        </div>
      )}

      {/* Mode selection */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => generateQuiz('day')}
          className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-colors"
        >
          <Calendar className="w-4 h-4" />
          Révision du jour
          <span className="text-xs opacity-60">(Ctrl+1)</span>
        </button>
        <button
          onClick={() => generateQuiz('week')}
          className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-colors"
        >
          <Clock className="w-4 h-4" />
          Test semaine
          <span className="text-xs opacity-60">(Ctrl+2)</span>
        </button>
        <button
          onClick={() => generateQuiz('month')}
          className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-colors"
        >
          <Target className="w-4 h-4" />
          Test mensuel
          <span className="text-xs opacity-60">(Ctrl+3)</span>
        </button>
        <button
          onClick={() => setShowStats(true)}
          className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-colors"
        >
          <TrendingUp className="w-4 h-4" />
          Statistiques
          <span className="text-xs opacity-60">(Ctrl+4)</span>
        </button>
      </div>

      {/* Content */}
      {!questions && !score && (
        <div className="text-center py-12">
          <div className="text-lg opacity-70 mb-4">
            Choisis un mode pour commencer tes révisions
          </div>
          <div className="text-sm opacity-50">
            {notes.length} notes disponibles pour les questions
          </div>
        </div>
      )}

      {questions && score === null && (
        <QuizRunner questions={questions} onFinish={onQuizFinish} />
      )}

      {score !== null && questions && (
        <div className="text-center space-y-6 py-8">
          <div className="space-y-2">
            <div className="text-3xl font-bold">
              {score} / {questions.length}
            </div>
            <div className="text-lg opacity-70">
              {Math.round((score / questions.length) * 100)}% de réussite
            </div>
          </div>
          
          <div className="text-sm opacity-60 max-w-md mx-auto">
            Les prochaines révisions sont programmées automatiquement selon ton niveau de maîtrise (FSRS).
          </div>
          
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => generateQuiz(mode)}
              className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 transition-colors"
            >
              Rejouer
            </button>
            <button
              onClick={() => setShowStats(true)}
              className="px-4 py-2 rounded-xl bg-blue-500/20 border border-blue-500/30 hover:bg-blue-500/30 transition-colors"
            >
              Voir les stats
            </button>
          </div>
        </div>
      )}
    </div>
  );
}