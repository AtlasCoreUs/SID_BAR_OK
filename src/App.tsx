import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, X, Pin, Mic, Settings, BookOpen, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { QuizLauncher } from './components/quiz/QuizLauncher';
import VoiceRecorder from './components/VoiceRecorder';
import PomodoroTimer from './components/PomodoroTimer';
import StudyStats from './components/StudyStats';
import WordsToolbar from './components/WordsToolbar';
import { useLocalStorage } from './hooks/useLocalStorage';
import { generateId } from './lib/utils';
import { 
  generateSummary, 
  generateFlashcards, 
  generateMindmap, 
  PomodoroTimer as PomodoroTimerUtil, 
  VoiceRecorder as VoiceRecorderUtil,
  exportToMarkdown,
  exportToAnki
} from './lib/studentTools';

interface Note {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
  tags: { id: string }[];
}

interface Tab {
  id: string;
  name: string;
  notes: string[];
  activeNoteId?: string;
}

interface Workspace {
  id: string;
  tabs: Tab[];
  notes: Record<string, Note>;
  activeTabId: string;
}

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [pomodoroTime, setPomodoroTime] = useState(0);
  const [isPomodoroActive, setIsPomodoroActive] = useState(false);
  const [voiceRecorder, setVoiceRecorder] = useState<VoiceRecorderUtil | null>(null);
  const [pomodoroTimer, setPomodoroTimer] = useState<PomodoroTimerUtil | null>(null);
  const [showToolbar, setShowToolbar] = useState(true);
  const [sidWidth, setSidWidth] = useState(320);
  const [toolbarWidth, setToolbarWidth] = useState(64);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showPomodoroTimer, setShowPomodoroTimer] = useState(false);
  const [showStudyStats, setShowStudyStats] = useState(false);
  const [showWordsToolbar, setShowWordsToolbar] = useState(false);
  const [draggedTag, setDraggedTag] = useState<string | null>(null);
  const [showSearchBar, setShowSearchBar] = useState(true);
  const [wordsToolbarVisible, setWordsToolbarVisible] = useState(false);
  const [workspace, setWorkspace] = useLocalStorage<Workspace>('sid-workspace', {
    id: 'default',
    tabs: [{ id: 'tab1', name: 'Notes', notes: [], activeNoteId: undefined }],
    notes: {},
    activeTabId: 'tab1'
  });

  const hoverRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const wordsHoverRef = useRef<HTMLDivElement>(null);
  const wordsPanelRef = useRef<HTMLDivElement>(null);
  const sidResizerRef = useRef<HTMLDivElement>(null);
  const toolbarResizerRef = useRef<HTMLDivElement>(null);
  const wordsTimeoutRef = useRef<NodeJS.Timeout>();
  const timeoutRef = useRef<NodeJS.Timeout>();

  const activeTab = workspace.tabs.find(t => t.id === workspace.activeTabId) || workspace.tabs[0];
  const activeNote = activeTab?.activeNoteId ? workspace.notes[activeTab.activeNoteId] : null;
  const allNotes = Object.values(workspace.notes);

  // Initialize tools
  useEffect(() => {
    const recorder = new VoiceRecorderUtil((audioBlob) => {
      // Here you would typically send to speech-to-text service
      console.log('Audio recorded:', audioBlob);
      setIsRecording(false);
    });
    setVoiceRecorder(recorder);

    const timer = new PomodoroTimerUtil(
      (remaining) => setPomodoroTime(remaining),
      () => {
        setIsPomodoroActive(false);
        // Show notification or alert
        alert('🍅 Pomodoro terminé ! Prenez une pause de 5 minutes.');
      }
    );
    setPomodoroTimer(timer);
  }, []);

  // Auto-hover mechanics
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientX <= 20 && !isOpen) {
        setIsOpen(true);
      }
    };

    const handleMouseLeave = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setIsOpen(false), 1200);
    };

    const handleMouseEnter = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };

    document.addEventListener('mousemove', handleMouseMove);
    panelRef.current?.addEventListener('mouseleave', handleMouseLeave);
    panelRef.current?.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (wordsTimeoutRef.current) clearTimeout(wordsTimeoutRef.current);
    };
  }, [isOpen]);

  // Words toolbar hover mechanics
  useEffect(() => {
    const handleWordsMouseMove = (e: MouseEvent) => {
      const sidCurrentWidth = isOpen ? sidWidth : 20;
      const hoverZoneStart = sidCurrentWidth - 10;
      const hoverZoneEnd = sidCurrentWidth + 80; // Fixed 80px hover zone
      
      if (e.clientX >= hoverZoneStart && e.clientX <= hoverZoneEnd && isOpen && !wordsToolbarVisible) {
        setWordsToolbarVisible(true);
      }
    };

    const handleWordsMouseLeave = () => {
      if (wordsTimeoutRef.current) clearTimeout(wordsTimeoutRef.current);
      wordsTimeoutRef.current = setTimeout(() => setWordsToolbarVisible(false), 1200);
    };

    const handleWordsMouseEnter = () => {
      if (wordsTimeoutRef.current) clearTimeout(wordsTimeoutRef.current);
    };

    document.addEventListener('mousemove', handleWordsMouseMove);
    wordsPanelRef.current?.addEventListener('mouseleave', handleWordsMouseLeave);
    wordsPanelRef.current?.addEventListener('mouseenter', handleWordsMouseEnter);

    return () => {
      document.removeEventListener('mousemove', handleWordsMouseMove);
      if (wordsTimeoutRef.current) clearTimeout(wordsTimeoutRef.current);
    };
  }, [isOpen, sidWidth, wordsToolbarVisible]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 's') {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
      if (e.ctrlKey && e.key === 'n' && isOpen) {
        e.preventDefault();
        createNote();
      }
      if (e.ctrlKey && e.key === 't' && isOpen) {
        e.preventDefault();
        createTab();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const createNote = () => {
    const noteId = generateId();
    const note: Note = {
      id: noteId,
      title: 'Nouvelle note',
      body: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: []
    };

    setWorkspace(prev => ({
      ...prev,
      notes: { ...prev.notes, [noteId]: note },
      tabs: prev.tabs.map(tab => 
        tab.id === prev.activeTabId 
          ? { ...tab, notes: [...tab.notes, noteId], activeNoteId: noteId }
          : tab
      )
    }));
  };

  const createTab = () => {
    const tabId = generateId();
    const newTab: Tab = {
      id: tabId,
      name: `Onglet ${workspace.tabs.length + 1}`,
      notes: [],
      activeNoteId: undefined
    };

    setWorkspace(prev => ({
      ...prev,
      tabs: [...prev.tabs, newTab],
      activeTabId: tabId
    }));
  };

  const updateNote = (noteId: string, updates: Partial<Note>) => {
    setWorkspace(prev => ({
      ...prev,
      notes: {
        ...prev.notes,
        [noteId]: { ...prev.notes[noteId], ...updates, updatedAt: Date.now() }
      }
    }));
  };

  const addTag = (noteId: string, tagId: string) => {
    const note = workspace.notes[noteId];
    if (!note || note.tags.some(t => t.id === tagId)) return;
    
    updateNote(noteId, {
      tags: [...note.tags, { id: tagId }]
    });
  };

  // Resizing handlers
  useEffect(() => {
    let isResizing = false;
    let startX = 0;
    let startWidth = 0;
    let target: 'sid' | 'toolbar' | null = null;

    const handleMouseDown = (e: MouseEvent, type: 'sid' | 'toolbar') => {
      isResizing = true;
      target = type;
      startX = e.clientX;
      startWidth = type === 'sid' ? sidWidth : toolbarWidth;
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      e.preventDefault();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !target) return;
      
      const diff = e.clientX - startX;
      if (target === 'sid') {
        const newWidth = Math.max(280, Math.min(600, startWidth + diff));
        setSidWidth(newWidth);
      } else {
        const newWidth = Math.max(48, Math.min(200, startWidth - diff));
        setToolbarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      isResizing = false;
      target = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    const sidResizer = sidResizerRef.current;
    const toolbarResizer = toolbarResizerRef.current;

    if (sidResizer) {
      sidResizer.addEventListener('mousedown', (e) => handleMouseDown(e, 'sid'));
    }
    if (toolbarResizer) {
      toolbarResizer.addEventListener('mousedown', (e) => handleMouseDown(e, 'toolbar'));
    }

    return () => {
      if (sidResizer) {
        sidResizer.removeEventListener('mousedown', (e) => handleMouseDown(e, 'sid'));
      }
      if (toolbarResizer) {
        toolbarResizer.removeEventListener('mousedown', (e) => handleMouseDown(e, 'toolbar'));
      }
    };
  }, [sidWidth, toolbarWidth]);

  // Drag and drop for tags
  const handleTagDragStart = (e: React.DragEvent, tagId: string) => {
    setDraggedTag(tagId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleTagDrop = (e: React.DragEvent, noteId: string) => {
    e.preventDefault();
    if (draggedTag && !workspace.notes[noteId].tags.some(t => t.id === draggedTag)) {
      addTag(noteId, draggedTag);
    }
    setDraggedTag(null);
  };

  const handleTagDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeTag = (noteId: string, tagId: string) => {
    const note = workspace.notes[noteId];
    if (!note) return;
    
    updateNote(noteId, {
      tags: note.tags.filter(t => t.id !== tagId)
    });
  };

  // Student Tools Handlers
  const handleSummarize = (text: string) => {
    if (!activeNote) return;
    const summary = generateSummary(text);
    const summaryText = `## Résumé\n\n**TL;DR:** ${summary.tldr}\n\n**Points clés:**\n${summary.bullets.map(b => `• ${b}`).join('\n')}\n\n---\n\n${activeNote.body}`;
    updateNote(activeNote.id, { body: summaryText });
  };

  const handleGenerateFlashcards = (text: string) => {
    if (!activeNote) return;
    const flashcards = generateFlashcards(text);
    const flashcardText = `## Flashcards\n\n${flashcards.cards.map((card, i) => `**${i + 1}. ${card.front}**\n${card.back}\n`).join('\n')}\n\n---\n\n${activeNote.body}`;
    updateNote(activeNote.id, { body: flashcardText });
  };

  const handleCreateMindmap = (text: string) => {
    if (!activeNote) return;
    const mindmap = generateMindmap(text);
    const mindmapText = `## Mindmap\n\n${mindmap.nodes.map(node => `${'  '.repeat(node.level)}• ${node.label}`).join('\n')}\n\n---\n\n${activeNote.body}`;
    updateNote(activeNote.id, { body: mindmapText });
  };

  const handleStartRecording = async () => {
    if (voiceRecorder && !isRecording) {
      const success = await voiceRecorder.start();
      setIsRecording(success);
    }
  };

  const handleStopRecording = () => {
    if (voiceRecorder && isRecording) {
      voiceRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleStartPomodoro = () => {
    if (pomodoroTimer) {
      if (isPomodoroActive) {
        pomodoroTimer.pause();
        setIsPomodoroActive(false);
      } else {
        pomodoroTimer.start();
        setIsPomodoroActive(true);
      }
    }
  };

  const handleExport = (format: 'txt' | 'md' | 'pdf' | 'anki') => {
    const notes = Object.values(workspace.notes);
    let content = '';
    let filename = '';

    switch (format) {
      case 'md':
        content = exportToMarkdown(notes);
        filename = 'notes-sid.md';
        break;
      case 'anki':
        content = exportToAnki(notes);
        filename = 'notes-sid-anki.txt';
        break;
      case 'txt':
        content = notes.map(n => `${n.title}\n\n${n.body}\n\n---\n\n`).join('');
        filename = 'notes-sid.txt';
        break;
      default:
        return;
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.md';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          const noteId = generateId();
          const note: Note = {
            id: noteId,
            title: file.name.replace(/\.[^/.]+$/, ''),
            body: content,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            tags: []
          };
          setWorkspace(prev => ({
            ...prev,
            notes: { ...prev.notes, [noteId]: note },
            tabs: prev.tabs.map(tab => 
              tab.id === prev.activeTabId 
                ? { ...tab, notes: [...tab.notes, noteId], activeNoteId: noteId }
                : tab
            )
          }));
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // Toolbar Handlers
  const handleFormatText = (format: string, value?: string) => {
    if (!activeNote) return;
    
    let newBody = activeNote.body;
    
    switch (format) {
      case 'bold':
        newBody = `**${activeNote.body}**`;
        break;
      case 'italic':
        newBody = `*${activeNote.body}*`;
        break;
      case 'underline':
        newBody = `<u>${activeNote.body}</u>`;
        break;
      case 'strikethrough':
        newBody = `~~${activeNote.body}~~`;
        break;
      case 'code':
        newBody = `\`${activeNote.body}\``;
        break;
      case 'highlight':
        newBody = `<mark style="background-color: ${value}">${activeNote.body}</mark>`;
        break;
      case 'heading':
        const level = '#'.repeat(parseInt(value || '1'));
        newBody = `${level} ${activeNote.body}`;
        break;
      case 'bulletList':
        newBody = activeNote.body.split('\n').map(line => `• ${line}`).join('\n');
        break;
      case 'orderedList':
        newBody = activeNote.body.split('\n').map((line, i) => `${i + 1}. ${line}`).join('\n');
        break;
      case 'blockquote':
        newBody = activeNote.body.split('\n').map(line => `> ${line}`).join('\n');
        break;
      case 'clear':
        newBody = activeNote.body
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/\*(.*?)\*/g, '$1')
          .replace(/~~(.*?)~~/g, '$1')
          .replace(/`(.*?)`/g, '$1')
          .replace(/<u>(.*?)<\/u>/g, '$1')
          .replace(/<mark[^>]*>(.*?)<\/mark>/g, '$1')
          .replace(/^#+\s/gm, '')
          .replace(/^[•\-\*]\s/gm, '')
          .replace(/^\d+\.\s/gm, '')
          .replace(/^>\s/gm, '');
        break;
      case 'superscript':
        newBody = `${activeNote.body}<sup>text</sup>`;
        break;
      case 'subscript':
        newBody = `${activeNote.body}<sub>text</sub>`;
        break;
      case 'alignLeft':
        newBody = `<div style="text-align: left">\n${activeNote.body}\n</div>`;
        break;
      case 'alignCenter':
        newBody = `<div style="text-align: center">\n${activeNote.body}\n</div>`;
        break;
      case 'alignRight':
        newBody = `<div style="text-align: right">\n${activeNote.body}\n</div>`;
        break;
      case 'alignJustify':
        newBody = `<div style="text-align: justify">\n${activeNote.body}\n</div>`;
        break;
      case 'indent':
        newBody = activeNote.body.split('\n').map(line => `  ${line}`).join('\n');
        break;
      case 'outdent':
        newBody = activeNote.body.split('\n').map(line => line.replace(/^  /, '')).join('\n');
        break;
    }
    
    updateNote(activeNote.id, { body: newBody });
  };

  const handleInsertElement = (type: string, data?: any) => {
    if (!activeNote) return;
    
    let insertion = '';
    const currentBody = activeNote.body;
    
    switch (type) {
      case 'link':
        const url = prompt('URL du lien:');
        const linkText = prompt('Texte du lien:') || 'Lien';
        if (url) insertion = `[${linkText}](${url})`;
        break;
      case 'image':
        if (data?.src) {
          insertion = `![${data.name || 'Image'}](${data.src})`;
        }
        break;
      case 'table':
        insertion = `
| Colonne 1 | Colonne 2 | Colonne 3 |
|-----------|-----------|-----------|
| Cellule 1 | Cellule 2 | Cellule 3 |
| Cellule 4 | Cellule 5 | Cellule 6 |
`;
        break;
      case 'formula':
        const formula = prompt('Formule LaTeX:');
        if (formula) insertion = `$$${formula}$$`;
        break;
      case 'date':
        insertion = new Date().toLocaleDateString('fr-FR');
        break;
      case 'time':
        insertion = new Date().toLocaleTimeString('fr-FR');
        break;
      case 'tag':
        const tag = prompt('Nom du tag:');
        if (tag) insertion = `#${tag}`;
        break;
      case 'bookmark':
        insertion = `🔖 Signet: ${new Date().toLocaleString('fr-FR')}`;
        break;
      case 'barChart':
        insertion = `
\`\`\`chart
type: bar
data: [10, 20, 30, 40, 50]
labels: [A, B, C, D, E]
\`\`\`
`;
        break;
      case 'lineChart':
        insertion = `
\`\`\`chart
type: line
data: [1, 3, 2, 5, 4]
labels: [Jan, Fév, Mar, Avr, Mai]
\`\`\`
`;
        break;
      case 'pieChart':
        insertion = `
\`\`\`chart
type: pie
data: [30, 25, 20, 15, 10]
labels: [A, B, C, D, E]
\`\`\`
`;
        break;
    }
    
    if (insertion) {
      updateNote(activeNote.id, { body: currentBody + '\n\n' + insertion });
    }
  };

  const handleAIAction = (action: string) => {
    if (!activeNote) return;
    
    switch (action) {
      case 'summarize':
        handleSummarize(activeNote.body);
        break;
      case 'flashcards':
        handleGenerateFlashcards(activeNote.body);
        break;
      case 'mindmap':
        handleCreateMindmap(activeNote.body);
        break;
      case 'analyze':
        const analysis = `## Analyse du contenu\n\n**Mots:** ${activeNote.body.split(' ').length}\n**Caractères:** ${activeNote.body.length}\n**Paragraphes:** ${activeNote.body.split('\n\n').length}\n\n---\n\n${activeNote.body}`;
        updateNote(activeNote.id, { body: analysis });
        break;
      case 'rephrase':
        const rephrase = `## Version reformulée\n\n*Contenu reformulé automatiquement*\n\n${activeNote.body}\n\n---\n\n**Original:**\n${activeNote.body}`;
        updateNote(activeNote.id, { body: rephrase });
        break;
      case 'translate':
        const translate = `## Traduction\n\n*Traduction automatique*\n\n${activeNote.body}\n\n---\n\n**Original:**\n${activeNote.body}`;
        updateNote(activeNote.id, { body: translate });
        break;
    }
  };

  const handleMediaAction = (action: string) => {
    switch (action) {
      case 'record':
        if (isRecording) {
          handleStopRecording();
        } else {
          handleStartRecording();
        }
        break;
      case 'pomodoro':
        handleStartPomodoro();
        break;
      case 'photo':
        // Trigger camera
        break;
      case 'video':
        // Trigger video recording
        break;
      case 'audio':
        // Trigger audio import
        break;
      case 'textToSpeech':
        if (activeNote && 'speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(activeNote.body);
          utterance.lang = 'fr-FR';
          speechSynthesis.speak(utterance);
        }
        break;
    }
  };

  const handleExportAction = (format: string) => {
    switch (format) {
      case 'txt':
      case 'md':
      case 'pdf':
      case 'anki':
        handleExport(format as any);
        break;
      case 'email':
        if (activeNote) {
          const subject = encodeURIComponent(activeNote.title);
          const body = encodeURIComponent(activeNote.body);
          window.open(`mailto:?subject=${subject}&body=${body}`);
        }
        break;
      case 'cloud':
        // Implement cloud export
        alert('Export cloud à venir');
        break;
    }
  };

  const handleAction = (action: string) => {
    if (!activeNote) return;
    
    switch (action) {
      case 'copy':
        navigator.clipboard.writeText(activeNote.body);
        break;
      case 'cut':
        navigator.clipboard.writeText(activeNote.body);
        updateNote(activeNote.id, { body: '' });
        break;
      case 'paste':
        navigator.clipboard.readText().then(text => {
          updateNote(activeNote.id, { body: activeNote.body + text });
        });
        break;
      case 'undo':
        // Simple undo - in real app, implement proper history
        console.log('Undo action');
        break;
    }
  };

  const filteredNotes = allNotes.filter(note => 
    searchQuery === '' || 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.body.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (showQuiz) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 p-6 border-b border-white/10">
            <button 
              onClick={() => setShowQuiz(false)}
              className="p-2 rounded-xl border border-white/10 hover:bg-white/5 transition-colors"
            >
              ← Retour
            </button>
            <div>
              <h1 className="text-2xl font-semibold">SID — Révision & Tests</h1>
              <p className="text-sm opacity-70">Système de révision espacée intelligent</p>
            </div>
          </div>
          <div className="p-6">
            <QuizLauncher notes={allNotes as any} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white relative">
      {/* Hotspot */}
      <div 
        ref={hoverRef}
        className="fixed left-0 top-0 w-5 h-full z-40 bg-transparent"
      />

      {/* SID Panel */}
      <div
        ref={panelRef}
        className="fixed left-0 top-0 h-full bg-neutral-900/95 backdrop-blur-xl border-r border-white/10 transition-all duration-200 z-30"
        style={{ width: isOpen ? `${showWordsToolbar ? sidWidth * 1.2 : sidWidth}px` : '20px' }}
      >
        {/* Resizer */}
        {isOpen && (
          <div
            ref={sidResizerRef}
            className="absolute right-0 top-0 w-1 h-full cursor-col-resize bg-transparent hover:bg-blue-500/50 transition-colors z-10"
          />
        )}

        {isOpen && (
          <div className="flex flex-col h-full p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-lg font-semibold">SID</h1>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowQuiz(true)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  title="Révisions (Ctrl+1)"
                >
                  <BookOpen className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowSearchBar(!showSearchBar)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  title="Toggle Search"
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  title="Révisions (Ctrl+1)"
                >
                  {showSearchBar ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Search */}
            {showSearchBar && (
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 opacity-50" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:border-blue-500/50 focus:outline-none transition-colors"
                />
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 mb-4 overflow-x-auto">
              {workspace.tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setWorkspace(prev => ({ ...prev, activeTabId: tab.id }))}
                  className={`px-3 py-1 rounded-lg text-sm whitespace-nowrap transition-colors ${
                    tab.id === workspace.activeTabId 
                      ? 'bg-blue-500/20 text-blue-400' 
                      : 'hover:bg-white/5'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
              <button
                onClick={createTab}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                title="Nouvel onglet (Ctrl+T)"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Notes List */}
            <div className="flex-1 overflow-y-auto space-y-2">
              {filteredNotes.length === 0 ? (
                <div className="text-center py-8 opacity-50">
                  <p className="text-sm">Aucune note</p>
                  <button
                    onClick={createNote}
                    className="mt-2 text-xs text-blue-400 hover:text-blue-300"
                  >
                    Créer une note (Ctrl+N)
                  </button>
                </div>
              ) : (
                filteredNotes.map(note => (
                  <div
                    key={note.id}
                    onDrop={(e) => handleTagDrop(e, note.id)}
                    onDragOver={handleTagDragOver}
                    onClick={() => setWorkspace(prev => ({
                      ...prev,
                      tabs: prev.tabs.map(tab => 
                        tab.id === prev.activeTabId 
                          ? { ...tab, activeNoteId: note.id }
                          : tab
                      )
                    }))}
                    className={`p-3 rounded-xl border cursor-pointer transition-colors ${
                      activeNote?.id === note.id
                        ? 'border-blue-500/30 bg-blue-500/10'
                        : 'border-white/10 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">{note.title}</h3>
                        <p className="text-xs opacity-70 mt-1 line-clamp-2">
                          {note.body || 'Note vide...'}
                        </p>
                        {note.tags.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {note.tags.slice(0, 3).map(tag => (
                              <button
                                key={tag.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeTag(note.id, tag.id);
                                }}
                                className="px-2 py-0.5 text-xs rounded-full bg-white/10 hover:bg-red-500/20 transition-colors group"
                                title="Cliquer pour supprimer"
                              >
                                <span className="group-hover:hidden">
                                  {tag.id === 'critical-exam' ? '🔴' : 
                                   tag.id === 'important-exam' ? '🟠' :
                                   tag.id === 'useful-exam' ? '🟡' : '🟢'}
                                </span>
                                <span className="hidden group-hover:inline">❌</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {note.pinned && <Pin className="w-3 h-3 opacity-50" />}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Editor */}
            {activeNote && (
              <div className="border-t border-white/10 pt-4 mt-4">
                <input
                  type="text"
                  value={activeNote.title}
                  onChange={(e) => updateNote(activeNote.id, { title: e.target.value })}
                  className="w-full mb-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-blue-500/50 focus:outline-none font-medium"
                />
                <textarea
                  value={activeNote.body}
                  onChange={(e) => updateNote(activeNote.id, { body: e.target.value })}
                  placeholder="Écris tes notes ici..."
                  className="w-full h-32 px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-blue-500/50 focus:outline-none resize-none"
                />
                
                {/* Quick Tags */}
                <div className="flex gap-2 mt-2">
                  <div className="text-xs opacity-50 mb-1">Glisser sur une note :</div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {['critical-exam', 'important-exam', 'useful-exam', 'bonus-exam'].map(tagId => (
                    <button
                      key={tagId}
                      draggable
                      onDragStart={(e) => handleTagDragStart(e, tagId)}
                      onClick={() => addTag(activeNote.id, tagId)}
                      className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                        activeNote.tags.some(t => t.id === tagId)
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      {tagId === 'critical-exam' ? '🔴 Critique' : 
                       tagId === 'important-exam' ? '🟠 Important' :
                       tagId === 'useful-exam' ? '🟡 Utile' : '🟢 Bonus'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
              <button
                onClick={createNote}
                className="flex-1 px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm"
              >
                + Note
              </button>
              <button
                onClick={() => setShowQuiz(true)}
                className="px-3 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-sm"
              >
                📚 Quiz
              </button>
            </div>
          </div>
        )}

        {/* Collapsed indicator */}
        {!isOpen && (
          <div className="absolute top-1/2 left-1 transform -translate-y-1/2">
            <div className="w-3 h-8 bg-blue-500/30 rounded-r-full" />
          </div>
        )}
      </div>

      {/* Words Toolbar */}
      {wordsToolbarVisible && isOpen && (
        <div
          ref={wordsPanelRef}
          className="fixed top-0 h-full bg-neutral-800/95 backdrop-blur-xl border-r border-white/10 transition-all duration-200 z-20"
          style={{ 
            left: `${isOpen ? sidWidth : 20}px`,
            width: '80px'
          }}
        >
          <WordsToolbar
            activeNote={activeNote}
            onFormatText={handleFormatText}
            onInsertElement={handleInsertElement}
            onAction={handleAction}
          />
        </div>
      )}

      {/* Words Hover Zone */}
      {isOpen && <div 
        ref={wordsHoverRef}
        className="fixed top-0 h-full z-30 bg-red-500/10 pointer-events-auto"
        style={{ 
          left: `${sidWidth - 10}px`,
          width: '90px'
        }}
      />}

      {/* Integrated Toolbar */}
      {showToolbar && (
        <div
          className="fixed right-0 top-0 h-full bg-neutral-900/95 backdrop-blur-xl border-l border-white/10 z-30 flex flex-col"
          style={{ width: `${toolbarWidth}px` }}
        >
          {/* Resizer */}
          <div
            ref={toolbarResizerRef}
            className="absolute left-0 top-0 w-1 h-full cursor-col-resize bg-transparent hover:bg-blue-500/50 transition-colors z-10"
          />

          {/* Header */}
          <div className="p-2 border-b border-white/10 flex items-center justify-between">
            <div className="text-xs font-semibold opacity-70">Outils</div>
            <button
              onClick={() => setShowToolbar(false)}
              className="p-1 rounded hover:bg-white/10 transition-colors"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* Toolbar Content */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {/* Format Section */}
            <div className="space-y-1">
              <div className="text-xs opacity-50 mb-2">Format</div>
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => handleFormatText('bold')}
                  className="p-2 rounded hover:bg-white/5 transition-colors text-xs"
                  title="Gras (Ctrl+B)"
                >
                  <strong>B</strong>
                </button>
                <button
                  onClick={() => handleFormatText('italic')}
                  className="p-2 rounded hover:bg-white/5 transition-colors text-xs"
                  title="Italique (Ctrl+I)"
                >
                  <em>I</em>
                </button>
                <button
                  onClick={() => handleFormatText('underline')}
                  className="p-2 rounded hover:bg-white/5 transition-colors text-xs"
                  title="Souligné (Ctrl+U)"
                >
                  <u>U</u>
                </button>
                <button
                  onClick={() => handleFormatText('strikethrough')}
                  className="p-2 rounded hover:bg-white/5 transition-colors text-xs"
                  title="Barré"
                >
                  <s>S</s>
                </button>
              </div>
            </div>

            {/* Insert Section */}
            <div className="space-y-1">
              <div className="text-xs opacity-50 mb-2">Insérer</div>
              <div className="space-y-1">
                <button
                  onClick={() => handleInsertElement('link')}
                  className="w-full p-2 rounded hover:bg-white/5 transition-colors text-xs text-left"
                  title="Lien (Ctrl+K)"
                >
                  🔗 Lien
                </button>
                <button
                  onClick={() => handleInsertElement('table')}
                  className="w-full p-2 rounded hover:bg-white/5 transition-colors text-xs text-left"
                >
                  📊 Tableau
                </button>
                <button
                  onClick={() => handleInsertElement('formula')}
                  className="w-full p-2 rounded hover:bg-white/5 transition-colors text-xs text-left"
                >
                  🧮 Formule
                </button>
              </div>
            </div>

            {/* AI Section */}
            <div className="space-y-1">
              <div className="text-xs opacity-50 mb-2">IA</div>
              <div className="space-y-1">
                <button
                  onClick={() => handleAIAction('summarize')}
                  className="w-full p-2 rounded hover:bg-white/5 transition-colors text-xs text-left"
                  title="Résumer (Ctrl+S)"
                  disabled={!activeNote?.body}
                >
                  ⚡ Résumer
                </button>
                <button
                  onClick={() => handleAIAction('flashcards')}
                  className="w-full p-2 rounded hover:bg-white/5 transition-colors text-xs text-left"
                  title="Flashcards (Ctrl+F)"
                  disabled={!activeNote?.body}
                >
                  🎯 Flashcards
                </button>
                <button
                  onClick={() => handleAIAction('mindmap')}
                  className="w-full p-2 rounded hover:bg-white/5 transition-colors text-xs text-left"
                  title="Mindmap (Ctrl+M)"
                  disabled={!activeNote?.body}
                >
                  🧠 Mindmap
                </button>
              </div>
            </div>

            {/* Media Section */}
            <div className="space-y-1">
              <div className="text-xs opacity-50 mb-2">Média</div>
              <div className="space-y-1">
                <button
                  onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
                  className={`w-full p-2 rounded transition-colors text-xs text-left ${
                    showVoiceRecorder ? 'bg-red-500/20 text-red-400' : 'hover:bg-white/5'
                  }`}
                >
                  🎙️ Vocal
                </button>
                <button
                  onClick={() => setShowPomodoroTimer(!showPomodoroTimer)}
                  className={`w-full p-2 rounded transition-colors text-xs text-left ${
                    showPomodoroTimer ? 'bg-orange-500/20 text-orange-400' : 'hover:bg-white/5'
                  }`}
                >
                  ⏱️ Pomodoro
                </button>
                <button
                  onClick={() => setShowStudyStats(!showStudyStats)}
                  className={`w-full p-2 rounded transition-colors text-xs text-left ${
                    showStudyStats ? 'bg-purple-500/20 text-purple-400' : 'hover:bg-white/5'
                  }`}
                >
                  📊 Stats
                </button>
              </div>
            </div>

            {/* Export Section */}
            <div className="space-y-1">
              <div className="text-xs opacity-50 mb-2">Export</div>
              <div className="space-y-1">
                <button
                  onClick={() => handleExportAction('md')}
                  className="w-full p-2 rounded hover:bg-white/5 transition-colors text-xs text-left"
                >
                  📝 Markdown
                </button>
                <button
                  onClick={() => handleExportAction('anki')}
                  className="w-full p-2 rounded hover:bg-white/5 transition-colors text-xs text-left"
                >
                  🎴 Anki
                </button>
              </div>
            </div>
          </div>

          {/* Voice Recorder Panel */}
          {showVoiceRecorder && (
            <div className="p-3 border-t border-white/10">
              <div className="text-xs font-medium mb-2">Enregistrement vocal</div>
              <VoiceRecorder
                onTranscript={(text) => {
                  if (activeNote) {
                    updateNote(activeNote.id, { 
                      body: activeNote.body + '\n\n' + text 
                    });
                  }
                }}
                onAudioSave={(blob) => {
                  console.log('Audio saved:', blob);
                }}
              />
            </div>
          )}

          {/* Pomodoro Timer Panel */}
          {showPomodoroTimer && (
            <div className="p-3 border-t border-white/10">
              <div className="text-xs font-medium mb-2">Timer Pomodoro</div>
              <PomodoroTimer
                onComplete={() => {
                  // Show notification or update stats
                  console.log('Pomodoro completed!');
                }}
                onTick={(remaining) => {
                  setPomodoroTime(remaining);
                }}
              />
            </div>
          )}

          {/* Study Stats Panel */}
          {showStudyStats && (
            <div className="p-3 border-t border-white/10">
              <div className="text-xs font-medium mb-2">Statistiques d'étude</div>
              <StudyStats
                sessions={[]} // Mock data - replace with real sessions
                currentSession={{
                  id: 'current',
                  date: Date.now(),
                  duration: Math.floor(Date.now() / 60000) % 120, // Mock current session time
                  notesCreated: Object.keys(workspace.notes).length,
                  wordsWritten: Object.values(workspace.notes).reduce((sum, note) => sum + note.body.split(' ').length, 0),
                  pomodoroSessions: 0
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Show Toolbar Button */}
      {!showToolbar && (
        <button
          onClick={() => setShowToolbar(true)}
          className="fixed right-4 top-1/2 transform -translate-y-1/2 z-50 p-2 bg-neutral-800 border border-white/10 rounded-l-xl hover:bg-neutral-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      {/* Main content */}
      <div 
        className="transition-all duration-200"
        style={{ 
          marginLeft: isOpen ? `${wordsToolbarVisible ? sidWidth + 80 : sidWidth}px` : '0px',
          marginRight: showToolbar ? `${toolbarWidth}px` : '0px'
        }}
      >
        <div className="min-h-screen flex items-center justify-center p-8">
          <div className="text-center space-y-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              SID — Slide Note Bar
            </h1>
            <p className="text-xl opacity-70 max-w-2xl">
              Glisse depuis le bord gauche pour ouvrir tes notes. 
              Écris, organise, révise avec l'IA.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="flex items-center gap-2 text-sm opacity-60">
                <span>Alt+S</span>
                <span>•</span>
                <span>Glisser tags</span>
                <span>•</span>
                <span>Ctrl+N</span>
                <span>•</span>
                <span>Ctrl+1..4</span>
                <span>•</span>
                <span>Redimensionnable</span>
              </div>
            </div>
            {allNotes.length > 0 && (
              <div className="mt-8 p-4 bg-white/5 rounded-xl border border-white/10">
                <p className="text-sm opacity-70 mb-2">
                  {allNotes.length} note{allNotes.length > 1 ? 's' : ''} • 
                  {allNotes.filter(n => n.tags.length > 0).length} étiquetée{allNotes.filter(n => n.tags.length > 0).length > 1 ? 's' : ''}
                </p>
                <button
                  onClick={() => setShowQuiz(true)}
                  className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                >
                  🚀 Commencer les révisions
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;