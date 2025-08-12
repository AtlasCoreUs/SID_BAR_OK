import React, { useState } from 'react';
import { 
  BookOpen, 
  Mic, 
  MicOff, 
  Download, 
  Upload, 
  Clock, 
  Brain, 
  Lightbulb,
  FileText,
  Zap,
  Target,
  Timer,
  Play,
  Pause,
  RotateCcw,
  Share2,
  Printer,
  Search,
  Bookmark,
  Star,
  TrendingUp,
  Calendar,
  Settings
} from 'lucide-react';

interface Props {
  activeNote: any;
  onSummarize: (text: string) => void;
  onGenerateFlashcards: (text: string) => void;
  onCreateMindmap: (text: string) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onExport: (format: 'txt' | 'md' | 'pdf' | 'anki') => void;
  onImport: () => void;
  onStartPomodoro: () => void;
  onQuickSearch: (query: string) => void;
  isRecording?: boolean;
  pomodoroTime?: number;
  isPomodoroActive?: boolean;
}

export default function StudentToolbar({ 
  activeNote, 
  onSummarize, 
  onGenerateFlashcards, 
  onCreateMindmap,
  onStartRecording,
  onStopRecording,
  onExport,
  onImport,
  onStartPomodoro,
  onQuickSearch,
  isRecording = false,
  pomodoroTime = 0,
  isPomodoroActive = false
}: Props) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showAIMenu, setShowAIMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="border-t border-white/10 p-3 space-y-3">
      {/* Quick Actions Row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* AI Tools */}
        <div className="relative">
          <button
            onClick={() => setShowAIMenu(!showAIMenu)}
            className="flex items-center gap-2 px-3 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors text-sm"
            disabled={!activeNote?.body}
          >
            <Brain className="w-4 h-4" />
            IA
          </button>
          {showAIMenu && (
            <div className="absolute bottom-full left-0 mb-2 bg-neutral-800 border border-white/10 rounded-xl p-2 space-y-1 min-w-48 z-10">
              <button
                onClick={() => {
                  onSummarize(activeNote.body);
                  setShowAIMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-lg text-sm"
              >
                <Zap className="w-4 h-4" />
                Résumer
              </button>
              <button
                onClick={() => {
                  onGenerateFlashcards(activeNote.body);
                  setShowAIMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-lg text-sm"
              >
                <Target className="w-4 h-4" />
                Flashcards
              </button>
              <button
                onClick={() => {
                  onCreateMindmap(activeNote.body);
                  setShowAIMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-lg text-sm"
              >
                <Lightbulb className="w-4 h-4" />
                Mindmap
              </button>
            </div>
          )}
        </div>

        {/* Voice Recording */}
        <button
          onClick={isRecording ? onStopRecording : onStartRecording}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
            isRecording 
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
              : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
          }`}
        >
          {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          {isRecording ? 'Stop' : 'Vocal'}
        </button>

        {/* Pomodoro Timer */}
        <button
          onClick={onStartPomodoro}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
            isPomodoroActive 
              ? 'bg-orange-500/20 text-orange-400' 
              : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
          }`}
        >
          <Timer className="w-4 h-4" />
          {isPomodoroActive ? formatTime(pomodoroTime) : 'Focus'}
        </button>

        {/* Export Menu */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          {showExportMenu && (
            <div className="absolute bottom-full left-0 mb-2 bg-neutral-800 border border-white/10 rounded-xl p-2 space-y-1 min-w-32 z-10">
              <button
                onClick={() => { onExport('txt'); setShowExportMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-lg text-sm"
              >
                <FileText className="w-4 h-4" />
                TXT
              </button>
              <button
                onClick={() => { onExport('md'); setShowExportMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-lg text-sm"
              >
                <FileText className="w-4 h-4" />
                Markdown
              </button>
              <button
                onClick={() => { onExport('pdf'); setShowExportMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-lg text-sm"
              >
                <Printer className="w-4 h-4" />
                PDF
              </button>
              <button
                onClick={() => { onExport('anki'); setShowExportMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-lg text-sm"
              >
                <Target className="w-4 h-4" />
                Anki
              </button>
            </div>
          )}
        </div>

        {/* Import */}
        <button
          onClick={onImport}
          className="flex items-center gap-2 px-3 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm"
        >
          <Upload className="w-4 h-4" />
          Import
        </button>
      </div>

      {/* Quick Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 opacity-50" />
        <input
          type="text"
          placeholder="Recherche rapide dans toutes les notes..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            onQuickSearch(e.target.value);
          }}
          className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-blue-500/50 focus:outline-none transition-colors text-sm"
        />
      </div>

      {/* Study Stats Mini */}
      <div className="flex items-center justify-between text-xs opacity-70">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            {activeNote ? 'Note active' : 'Aucune note'}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Aujourd'hui
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-1 hover:bg-white/5 rounded">
            <Star className="w-3 h-3" />
          </button>
          <button className="p-1 hover:bg-white/5 rounded">
            <Share2 className="w-3 h-3" />
          </button>
          <button className="p-1 hover:bg-white/5 rounded">
            <Settings className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="text-xs opacity-50 text-center">
        <span>Raccourcis: </span>
        <span className="font-mono">Ctrl+S</span> Résumer • 
        <span className="font-mono">Ctrl+F</span> Flashcards • 
        <span className="font-mono">Ctrl+M</span> Mindmap • 
        <span className="font-mono">Ctrl+R</span> Vocal
      </div>
    </div>
  );
}