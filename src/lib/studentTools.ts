// Student Tools - AI-powered study helpers
export interface SummaryResult {
  bullets: string[];
  tldr: string;
  keyPoints: string[];
}

export interface FlashcardResult {
  cards: Array<{
    front: string;
    back: string;
    difficulty: 'easy' | 'medium' | 'hard';
  }>;
}

export interface MindmapResult {
  nodes: Array<{
    id: string;
    label: string;
    level: number;
    parent?: string;
  }>;
  connections: Array<{
    from: string;
    to: string;
    label?: string;
  }>;
}

// Local AI-powered summarization (deterministic)
export function generateSummary(text: string): SummaryResult {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const words = text.split(/\s+/).filter(w => w.length > 3);
  
  // Extract key sentences (first, last, and those with important keywords)
  const keywordPatterns = [
    /important|crucial|essential|key|fundamental|critical/i,
    /definition|concept|principle|theory|law/i,
    /formula|equation|calculation|method/i,
    /example|instance|case|illustration/i
  ];
  
  const keyPoints = sentences
    .filter(s => keywordPatterns.some(p => p.test(s)))
    .slice(0, 5)
    .map(s => s.trim());

  // Generate bullets (main ideas)
  const bullets = sentences
    .slice(0, Math.min(6, sentences.length))
    .map(s => s.trim().substring(0, 100) + (s.length > 100 ? '...' : ''));

  // Generate TL;DR
  const tldr = sentences.length > 0 
    ? sentences[0].trim().substring(0, 150) + (sentences[0].length > 150 ? '...' : '')
    : 'Pas assez de contenu pour résumer.';

  return { bullets, tldr, keyPoints };
}

// Generate flashcards from text
export function generateFlashcards(text: string): FlashcardResult {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const cards: FlashcardResult['cards'] = [];

  // Pattern-based card generation
  sentences.forEach(sentence => {
    const s = sentence.trim();
    
    // Definition pattern: "X est/sont Y"
    const defMatch = s.match(/^(.+?)\s+(est|sont)\s+(.+)$/i);
    if (defMatch) {
      cards.push({
        front: `Qu'est-ce que ${defMatch[1].trim()} ?`,
        back: defMatch[3].trim(),
        difficulty: 'medium'
      });
    }

    // Formula pattern: "X = Y" or "X : Y"
    const formulaMatch = s.match(/^(.+?)\s*[:=]\s*(.+)$/);
    if (formulaMatch && formulaMatch[2].length < 100) {
      cards.push({
        front: `Formule pour ${formulaMatch[1].trim()}`,
        back: formulaMatch[2].trim(),
        difficulty: 'hard'
      });
    }

    // Example pattern: "Par exemple" or "Exemple"
    if (/par exemple|exemple|instance/i.test(s)) {
      cards.push({
        front: 'Donnez un exemple',
        back: s.replace(/^(par exemple|exemple)[:\s]*/i, '').trim(),
        difficulty: 'easy'
      });
    }
  });

  // Fill with cloze-style cards if not enough
  while (cards.length < 3 && sentences.length > 0) {
    const sentence = sentences[Math.floor(Math.random() * sentences.length)];
    const words = sentence.split(/\s+/).filter(w => w.length > 4);
    if (words.length > 0) {
      const targetWord = words[Math.floor(Math.random() * words.length)];
      const cloze = sentence.replace(new RegExp(`\\b${targetWord}\\b`, 'i'), '____');
      cards.push({
        front: `Complétez: ${cloze}`,
        back: targetWord,
        difficulty: 'medium'
      });
    }
  }

  return { cards: cards.slice(0, 8) }; // Max 8 cards
}

// Generate mindmap structure
export function generateMindmap(text: string): MindmapResult {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const nodes: MindmapResult['nodes'] = [];
  const connections: MindmapResult['connections'] = [];

  // Extract main topic (first significant noun phrase)
  const firstSentence = sentences[0] || text.substring(0, 100);
  const mainTopic = firstSentence.split(/\s+/).slice(0, 3).join(' ');
  
  nodes.push({
    id: 'root',
    label: mainTopic,
    level: 0
  });

  // Extract subtopics (sentences with key patterns)
  const subtopicPatterns = [
    /^(premièrement|d'abord|tout d'abord|en premier)/i,
    /^(deuxièmement|ensuite|puis|alors)/i,
    /^(troisièmement|enfin|finalement|pour finir)/i,
    /^(de plus|par ailleurs|également|aussi)/i,
    /^(cependant|néanmoins|toutefois|mais)/i
  ];

  let nodeId = 1;
  sentences.slice(1, 6).forEach((sentence, index) => {
    const isSubtopic = subtopicPatterns.some(p => p.test(sentence)) || 
                     sentence.includes(':') || 
                     /^\d+\./.test(sentence);
    
    if (isSubtopic || index < 3) {
      const label = sentence.trim().substring(0, 40) + (sentence.length > 40 ? '...' : '');
      const id = `node_${nodeId++}`;
      
      nodes.push({
        id,
        label,
        level: 1,
        parent: 'root'
      });
      
      connections.push({
        from: 'root',
        to: id
      });
    }
  });

  return { nodes, connections };
}

// Pomodoro timer utilities
export class PomodoroTimer {
  private duration: number = 25 * 60; // 25 minutes
  private remaining: number = this.duration;
  private interval: NodeJS.Timeout | null = null;
  private onTick: (remaining: number) => void = () => {};
  private onComplete: () => void = () => {};

  constructor(onTick: (remaining: number) => void, onComplete: () => void) {
    this.onTick = onTick;
    this.onComplete = onComplete;
  }

  start() {
    if (this.interval) return;
    
    this.interval = setInterval(() => {
      this.remaining--;
      this.onTick(this.remaining);
      
      if (this.remaining <= 0) {
        this.complete();
      }
    }, 1000);
  }

  pause() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  reset() {
    this.pause();
    this.remaining = this.duration;
    this.onTick(this.remaining);
  }

  private complete() {
    this.pause();
    this.onComplete();
    this.reset();
  }

  getRemaining() {
    return this.remaining;
  }

  isActive() {
    return this.interval !== null;
  }
}

// Export utilities
export function exportToMarkdown(notes: any[]): string {
  let markdown = `# Notes SID\n\n*Exporté le ${new Date().toLocaleDateString('fr-FR')}*\n\n`;
  
  notes.forEach(note => {
    markdown += `## ${note.title}\n\n`;
    markdown += `${note.body}\n\n`;
    
    if (note.tags && note.tags.length > 0) {
      markdown += `**Tags:** ${note.tags.map((t: any) => `\`${t.id}\``).join(', ')}\n\n`;
    }
    
    markdown += `---\n\n`;
  });
  
  return markdown;
}

export function exportToAnki(notes: any[]): string {
  let anki = '';
  
  notes.forEach(note => {
    // Generate basic Q&A from note
    const sentences = note.body.split(/[.!?]+/).filter((s: string) => s.trim().length > 10);
    
    sentences.slice(0, 3).forEach((sentence: string) => {
      const question = `Que savez-vous sur: ${note.title}?`;
      const answer = sentence.trim();
      anki += `"${question}"\t"${answer}"\n`;
    });
  });
  
  return anki;
}

// Voice recording utilities
export class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private onDataAvailable: (audioBlob: Blob) => void = () => {};

  constructor(onDataAvailable: (audioBlob: Blob) => void) {
    this.onDataAvailable = onDataAvailable;
  }

  async start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.chunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        this.chunks.push(event.data);
      };

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.chunks, { type: 'audio/wav' });
        this.onDataAvailable(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      this.mediaRecorder.start();
      return true;
    } catch (error) {
      console.error('Error starting recording:', error);
      return false;
    }
  }

  stop() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }
  }

  isRecording() {
    return this.mediaRecorder?.state === 'recording';
  }
}