'use client'
import React from 'react'
import type { QuizStats } from '@/lib/quiz/types'
import { TrendingUp, Target, Clock, Calendar, Award, Brain } from 'lucide-react'

interface Props {
  stats: QuizStats | null
}

export default function QuizStats({ stats }: Props) {
  if (!stats) {
    return (
      <div className="p-6 text-center opacity-70">
        Chargement des statistiques...
      </div>
    )
  }

  const accuracy = stats.totalQuestions > 0 ? (stats.correctAnswers / stats.totalQuestions) * 100 : 0
  const masteryLevel = stats.averageEase > 280 ? 'Expert' : stats.averageEase > 250 ? 'Avancé' : stats.averageEase > 200 ? 'Intermédiaire' : 'Débutant'

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30">
          <div className="flex items-center gap-3 mb-3">
            <Target className="w-6 h-6 text-blue-400" />
            <h3 className="font-semibold">Questions totales</h3>
          </div>
          <div className="text-2xl font-bold">{stats.totalQuestions}</div>
          <div className="text-sm opacity-70">{stats.correctAnswers} correctes</div>
        </div>

        <div className="p-6 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="w-6 h-6 text-green-400" />
            <h3 className="font-semibold">Précision</h3>
          </div>
          <div className="text-2xl font-bold">{Math.round(accuracy)}%</div>
          <div className="text-sm opacity-70">
            {accuracy >= 80 ? 'Excellent' : accuracy >= 60 ? 'Bien' : 'À améliorer'}
          </div>
        </div>

        <div className="p-6 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30">
          <div className="flex items-center gap-3 mb-3">
            <Brain className="w-6 h-6 text-purple-400" />
            <h3 className="font-semibold">Niveau</h3>
          </div>
          <div className="text-2xl font-bold">{masteryLevel}</div>
          <div className="text-sm opacity-70">Facilité: {Math.round(stats.averageEase)}</div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-5 h-5" />
            <h3 className="font-semibold">Révisions en attente</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>Aujourd'hui</span>
              <span className="font-semibold text-orange-400">{stats.dueToday}</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div 
                className="bg-orange-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((stats.dueToday / Math.max(stats.totalQuestions, 1)) * 100, 100)}%` }}
              />
            </div>
            <div className="text-xs opacity-60">
              {stats.dueToday === 0 ? 'Toutes les révisions sont à jour !' : 'Révisions recommandées'}
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-5 h-5" />
            <h3 className="font-semibold">Série de révisions</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>Jours consécutifs</span>
              <span className="font-semibold text-green-400">{stats.streakDays}</span>
            </div>
            <div className="flex items-center gap-2">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className={`w-6 h-6 rounded-full ${
                    i < stats.streakDays % 7 ? 'bg-green-400' : 'bg-white/10'
                  }`}
                />
              ))}
            </div>
            <div className="text-xs opacity-60">
              {stats.streakDays === 0 ? 'Commence ta série aujourd\'hui !' : 'Continue comme ça !'}
            </div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="p-6 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <Award className="w-5 h-5" />
          <h3 className="font-semibold">Accomplissements</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className={`p-3 rounded-lg text-center ${stats.totalQuestions >= 10 ? 'bg-yellow-500/20 border border-yellow-500/30' : 'bg-white/5 border border-white/10 opacity-50'}`}>
            <div className="text-2xl mb-1">🎯</div>
            <div className="text-xs">10 Questions</div>
          </div>
          <div className={`p-3 rounded-lg text-center ${stats.streakDays >= 3 ? 'bg-yellow-500/20 border border-yellow-500/30' : 'bg-white/5 border border-white/10 opacity-50'}`}>
            <div className="text-2xl mb-1">🔥</div>
            <div className="text-xs">3 Jours</div>
          </div>
          <div className={`p-3 rounded-lg text-center ${accuracy >= 80 ? 'bg-yellow-500/20 border border-yellow-500/30' : 'bg-white/5 border border-white/10 opacity-50'}`}>
            <div className="text-2xl mb-1">⭐</div>
            <div className="text-xs">80% Précision</div>
          </div>
          <div className={`p-3 rounded-lg text-center ${stats.totalQuestions >= 100 ? 'bg-yellow-500/20 border border-yellow-500/30' : 'bg-white/5 border border-white/10 opacity-50'}`}>
            <div className="text-2xl mb-1">🏆</div>
            <div className="text-xs">100 Questions</div>
          </div>
        </div>
      </div>

      {/* Last Session */}
      {stats.lastSession && (
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
          <div className="text-sm opacity-70">
            Dernière session: {new Date(stats.lastSession).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      )}
    </div>
  )
}