import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings, Coffee, Target } from 'lucide-react';

interface Props {
  onComplete?: () => void;
  onTick?: (remaining: number) => void;
}

export default function PomodoroTimer({ onComplete, onTick }: Props) {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'work' | 'break' | 'longBreak'>('work');
  const [session, setSession] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    workTime: 25,
    shortBreak: 5,
    longBreak: 15,
    sessionsUntilLongBreak: 4
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    onTick?.(timeLeft);
  }, [timeLeft, onTick]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, timeLeft]);

  const handleComplete = () => {
    setIsActive(false);
    playNotificationSound();
    onComplete?.();

    // Auto-switch to next mode
    if (mode === 'work') {
      if (session % settings.sessionsUntilLongBreak === 0) {
        setMode('longBreak');
        setTimeLeft(settings.longBreak * 60);
      } else {
        setMode('break');
        setTimeLeft(settings.shortBreak * 60);
      }
    } else {
      setMode('work');
      setTimeLeft(settings.workTime * 60);
      if (mode === 'break') {
        setSession(prev => prev + 1);
      }
    }

    // Show notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🍅 Pomodoro terminé !', {
        body: mode === 'work' ? 'Temps de pause !' : 'Retour au travail !',
        icon: '/favicon.ico'
      });
    }
  };

  const playNotificationSound = () => {
    // Create a simple beep sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    const duration = mode === 'work' ? settings.workTime : 
                    mode === 'break' ? settings.shortBreak : 
                    settings.longBreak;
    setTimeLeft(duration * 60);
  };

  const switchMode = (newMode: 'work' | 'break' | 'longBreak') => {
    setIsActive(false);
    setMode(newMode);
    const duration = newMode === 'work' ? settings.workTime : 
                    newMode === 'break' ? settings.shortBreak : 
                    settings.longBreak;
    setTimeLeft(duration * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    const total = mode === 'work' ? settings.workTime * 60 : 
                 mode === 'break' ? settings.shortBreak * 60 : 
                 settings.longBreak * 60;
    return ((total - timeLeft) / total) * 100;
  };

  const getModeIcon = () => {
    switch (mode) {
      case 'work': return <Target className="w-4 h-4" />;
      case 'break': return <Coffee className="w-4 h-4" />;
      case 'longBreak': return <Coffee className="w-4 h-4" />;
    }
  };

  const getModeColor = () => {
    switch (mode) {
      case 'work': return 'text-red-400 bg-red-500/20';
      case 'break': return 'text-green-400 bg-green-500/20';
      case 'longBreak': return 'text-blue-400 bg-blue-500/20';
    }
  };

  return (
    <div className="space-y-4">
      {/* Mode Selector */}
      <div className="flex gap-1">
        <button
          onClick={() => switchMode('work')}
          className={`flex-1 px-2 py-1 rounded text-xs transition-colors ${
            mode === 'work' ? 'bg-red-500/20 text-red-400' : 'hover:bg-white/5'
          }`}
        >
          <Target className="w-3 h-3 inline mr-1" />
          Travail
        </button>
        <button
          onClick={() => switchMode('break')}
          className={`flex-1 px-2 py-1 rounded text-xs transition-colors ${
            mode === 'break' ? 'bg-green-500/20 text-green-400' : 'hover:bg-white/5'
          }`}
        >
          <Coffee className="w-3 h-3 inline mr-1" />
          Pause
        </button>
        <button
          onClick={() => switchMode('longBreak')}
          className={`flex-1 px-2 py-1 rounded text-xs transition-colors ${
            mode === 'longBreak' ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-white/5'
          }`}
        >
          <Coffee className="w-3 h-3 inline mr-1" />
          Longue
        </button>
      </div>

      {/* Timer Display */}
      <div className={`p-4 rounded-xl border transition-colors ${getModeColor()} border-current/30`}>
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            {getModeIcon()}
            <span className="text-sm font-medium capitalize">
              {mode === 'work' ? 'Travail' : mode === 'break' ? 'Pause courte' : 'Pause longue'}
            </span>
          </div>
          
          <div className="text-3xl font-mono font-bold">
            {formatTime(timeLeft)}
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-white/10 rounded-full h-2">
            <div 
              className="h-2 rounded-full transition-all duration-1000 bg-current"
              style={{ width: `${getProgress()}%` }}
            />
          </div>
          
          {/* Session Counter */}
          <div className="text-xs opacity-70">
            Session {session} • {settings.sessionsUntilLongBreak - (session % settings.sessionsUntilLongBreak)} avant pause longue
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleTimer}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors ${
            isActive 
              ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' 
              : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
          }`}
        >
          {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {isActive ? 'Pause' : 'Start'}
        </button>
        
        <button
          onClick={resetTimer}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          title="Reset"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          title="Paramètres"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Settings */}
      {showSettings && (
        <div className="p-3 bg-white/5 rounded-lg border border-white/10 space-y-3">
          <div className="text-sm font-medium">Paramètres</div>
          
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block opacity-70 mb-1">Travail (min)</label>
              <input
                type="number"
                value={settings.workTime}
                onChange={(e) => setSettings(prev => ({ ...prev, workTime: parseInt(e.target.value) || 25 }))}
                className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded"
                min="1"
                max="60"
              />
            </div>
            
            <div>
              <label className="block opacity-70 mb-1">Pause courte (min)</label>
              <input
                type="number"
                value={settings.shortBreak}
                onChange={(e) => setSettings(prev => ({ ...prev, shortBreak: parseInt(e.target.value) || 5 }))}
                className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded"
                min="1"
                max="30"
              />
            </div>
            
            <div>
              <label className="block opacity-70 mb-1">Pause longue (min)</label>
              <input
                type="number"
                value={settings.longBreak}
                onChange={(e) => setSettings(prev => ({ ...prev, longBreak: parseInt(e.target.value) || 15 }))}
                className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded"
                min="1"
                max="60"
              />
            </div>
            
            <div>
              <label className="block opacity-70 mb-1">Sessions avant longue</label>
              <input
                type="number"
                value={settings.sessionsUntilLongBreak}
                onChange={(e) => setSettings(prev => ({ ...prev, sessionsUntilLongBreak: parseInt(e.target.value) || 4 }))}
                className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded"
                min="2"
                max="10"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}