import React, { useState, useEffect } from 'react';
import { TrendingUp, Target, Clock, Calendar, Award, Brain, Zap, BookOpen, Star, Trophy } from 'lucide-react';

interface StudySession {
  id: string;
  date: number;
  duration: number; // in minutes
  notesCreated: number;
  wordsWritten: number;
  pomodoroSessions: number;
  quizScore?: number;
}

interface StudyGoal {
  id: string;
  type: 'daily' | 'weekly' | 'monthly';
  target: number;
  current: number;
  unit: 'minutes' | 'notes' | 'words' | 'sessions';
  description: string;
}

interface Props {
  sessions: StudySession[];
  currentSession?: StudySession;
}

export default function StudyStats({ sessions, currentSession }: Props) {
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month' | 'all'>('week');
  const [goals, setGoals] = useState<StudyGoal[]>([
    {
      id: 'daily-time',
      type: 'daily',
      target: 120, // 2 hours
      current: 0,
      unit: 'minutes',
      description: 'Temps d\'étude quotidien'
    },
    {
      id: 'weekly-notes',
      type: 'weekly',
      target: 20,
      current: 0,
      unit: 'notes',
      description: 'Notes créées par semaine'
    },
    {
      id: 'monthly-sessions',
      type: 'monthly',
      target: 60,
      current: 0,
      unit: 'sessions',
      description: 'Sessions Pomodoro mensuelles'
    }
  ]);

  const getFilteredSessions = () => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfWeek = startOfDay - (now.getDay() * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    switch (selectedPeriod) {
      case 'day':
        return sessions.filter(s => s.date >= startOfDay);
      case 'week':
        return sessions.filter(s => s.date >= startOfWeek);
      case 'month':
        return sessions.filter(s => s.date >= startOfMonth);
      default:
        return sessions;
    }
  };

  const calculateStats = () => {
    const filteredSessions = getFilteredSessions();
    
    const totalTime = filteredSessions.reduce((sum, s) => sum + s.duration, 0);
    const totalNotes = filteredSessions.reduce((sum, s) => sum + s.notesCreated, 0);
    const totalWords = filteredSessions.reduce((sum, s) => sum + s.wordsWritten, 0);
    const totalPomodoros = filteredSessions.reduce((sum, s) => sum + s.pomodoroSessions, 0);
    const avgQuizScore = filteredSessions.length > 0 
      ? filteredSessions.reduce((sum, s) => sum + (s.quizScore || 0), 0) / filteredSessions.length 
      : 0;

    return {
      totalTime,
      totalNotes,
      totalWords,
      totalPomodoros,
      avgQuizScore,
      sessionsCount: filteredSessions.length
    };
  };

  const getStreak = () => {
    const sortedSessions = [...sessions].sort((a, b) => b.date - a.date);
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const session of sortedSessions) {
      const sessionDate = new Date(session.date);
      sessionDate.setHours(0, 0, 0, 0);
      
      if (sessionDate.getTime() === currentDate.getTime()) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (sessionDate.getTime() < currentDate.getTime()) {
        break;
      }
    }

    return streak;
  };

  const getAchievements = () => {
    const stats = calculateStats();
    const achievements = [];

    if (stats.totalTime >= 60) achievements.push({ icon: '⏰', name: 'Première heure', desc: '60 min d\'étude' });
    if (stats.totalTime >= 600) achievements.push({ icon: '🎯', name: 'Marathonien', desc: '10h d\'étude' });
    if (stats.totalNotes >= 10) achievements.push({ icon: '📝', name: 'Écrivain', desc: '10 notes créées' });
    if (stats.totalNotes >= 100) achievements.push({ icon: '📚', name: 'Bibliothèque', desc: '100 notes créées' });
    if (stats.totalPomodoros >= 10) achievements.push({ icon: '🍅', name: 'Pomodoro Pro', desc: '10 sessions focus' });
    if (stats.avgQuizScore >= 80) achievements.push({ icon: '🌟', name: 'Expert', desc: '80% aux quiz' });
    if (getStreak() >= 7) achievements.push({ icon: '🔥', name: 'Série de 7', desc: '7 jours consécutifs' });
    if (getStreak() >= 30) achievements.push({ icon: '👑', name: 'Légende', desc: '30 jours consécutifs' });

    return achievements;
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const stats = calculateStats();
  const streak = getStreak();
  const achievements = getAchievements();

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex gap-2">
        {(['day', 'week', 'month', 'all'] as const).map(period => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              selectedPeriod === period 
                ? 'bg-blue-500/20 text-blue-400' 
                : 'hover:bg-white/5'
            }`}
          >
            {period === 'day' ? 'Aujourd\'hui' : 
             period === 'week' ? 'Semaine' :
             period === 'month' ? 'Mois' : 'Tout'}
          </button>
        ))}
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-medium">Temps d'étude</span>
          </div>
          <div className="text-2xl font-bold">{formatTime(stats.totalTime)}</div>
          <div className="text-xs opacity-70">
            {stats.sessionsCount} session{stats.sessionsCount > 1 ? 's' : ''}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-green-400" />
            <span className="text-sm font-medium">Notes créées</span>
          </div>
          <div className="text-2xl font-bold">{stats.totalNotes}</div>
          <div className="text-xs opacity-70">
            {Math.round(stats.totalWords / Math.max(stats.totalNotes, 1))} mots/note
          </div>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-orange-400" />
            <span className="text-sm font-medium">Pomodoros</span>
          </div>
          <div className="text-2xl font-bold">{stats.totalPomodoros}</div>
          <div className="text-xs opacity-70">
            {Math.round(stats.totalPomodoros * 25)} min focus
          </div>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-5 h-5 text-purple-400" />
            <span className="text-sm font-medium">Score Quiz</span>
          </div>
          <div className="text-2xl font-bold">{Math.round(stats.avgQuizScore)}%</div>
          <div className="text-xs opacity-70">
            Moyenne générale
          </div>
        </div>
      </div>

      {/* Streak & Goals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Streak */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5" />
            <span className="font-medium">Série d'étude</span>
          </div>
          
          <div className="text-center space-y-2">
            <div className="text-3xl font-bold text-orange-400">{streak}</div>
            <div className="text-sm opacity-70">jours consécutifs</div>
            
            <div className="flex justify-center gap-1">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className={`w-6 h-6 rounded-full ${
                    i < streak % 7 ? 'bg-orange-400' : 'bg-white/10'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Goals */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5" />
            <span className="font-medium">Objectifs</span>
          </div>
          
          <div className="space-y-3">
            {goals.map(goal => {
              const progress = Math.min((goal.current / goal.target) * 100, 100);
              return (
                <div key={goal.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="opacity-70">{goal.description}</span>
                    <span>{goal.current}/{goal.target}</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div 
                      className="bg-green-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5" />
          <span className="font-medium">Accomplissements</span>
          <span className="text-xs opacity-50">({achievements.length}/8)</span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {achievements.map((achievement, index) => (
            <div
              key={index}
              className="p-3 rounded-lg bg-yellow-500/20 border border-yellow-500/30 text-center"
            >
              <div className="text-2xl mb-1">{achievement.icon}</div>
              <div className="text-xs font-medium">{achievement.name}</div>
              <div className="text-xs opacity-70">{achievement.desc}</div>
            </div>
          ))}
          
          {/* Placeholder for locked achievements */}
          {[...Array(Math.max(0, 8 - achievements.length))].map((_, i) => (
            <div
              key={`locked-${i}`}
              className="p-3 rounded-lg bg-white/5 border border-white/10 text-center opacity-50"
            >
              <div className="text-2xl mb-1">🔒</div>
              <div className="text-xs">Verrouillé</div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Session */}
      {currentSession && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-blue-400" />
            <span className="font-medium">Session en cours</span>
          </div>
          
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold">{formatTime(currentSession.duration)}</div>
              <div className="text-xs opacity-70">Temps</div>
            </div>
            <div>
              <div className="text-lg font-bold">{currentSession.notesCreated}</div>
              <div className="text-xs opacity-70">Notes</div>
            </div>
            <div>
              <div className="text-lg font-bold">{currentSession.wordsWritten}</div>
              <div className="text-xs opacity-70">Mots</div>
            </div>
            <div>
              <div className="text-lg font-bold">{currentSession.pomodoroSessions}</div>
              <div className="text-xs opacity-70">Pomodoros</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}