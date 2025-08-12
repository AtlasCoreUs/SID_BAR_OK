import React, { useState } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Link,
  Table,
  Calculator,
  Calendar,
  Palette,
  Superscript,
  Subscript,
  Code,
  Copy,
  Scissors,
  Clipboard,
  RotateCcw,
  Eraser
} from 'lucide-react';

interface Props {
  activeNote: any;
  onFormatText: (format: string, value?: string) => void;
  onInsertElement: (type: string, data?: any) => void;
  onAction: (action: string) => void;
}

export default function WordsToolbar({ activeNote, onFormatText, onInsertElement, onAction }: Props) {
  const [showColorPicker, setShowColorPicker] = useState(false);

  const colors = [
    '#ffff00', '#00ff00', '#ff0000', '#0000ff', '#ff00ff', '#00ffff',
    '#ffa500', '#800080', '#008000', '#000080', '#800000', '#808000'
  ];

  const handleColorSelect = (color: string) => {
    onFormatText('highlight', color);
    setShowColorPicker(false);
  };

  return (
    <div className="h-full flex flex-col bg-neutral-800/95 backdrop-blur-xl">
      <div className="flex-1 overflow-y-auto p-2">
        {/* Format Grid */}
        <div className="grid grid-cols-4 gap-1 mb-2">
          <button
            onClick={() => onFormatText('bold')}
            className="p-2 rounded hover:bg-white/10 transition-colors flex items-center justify-center"
            title="Gras (Ctrl+B)"
            disabled={!activeNote?.body}
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => onFormatText('italic')}
            className="p-2 rounded hover:bg-white/10 transition-colors flex items-center justify-center"
            title="Italique (Ctrl+I)"
            disabled={!activeNote?.body}
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => onFormatText('underline')}
            className="p-2 rounded hover:bg-white/10 transition-colors flex items-center justify-center"
            title="Souligné (Ctrl+U)"
            disabled={!activeNote?.body}
          >
            <Underline className="w-4 h-4" />
          </button>
          <button
            onClick={() => onFormatText('strikethrough')}
            className="p-2 rounded hover:bg-white/10 transition-colors flex items-center justify-center"
            title="Barré"
            disabled={!activeNote?.body}
          >
            <Strikethrough className="w-4 h-4" />
          </button>
        </div>

        {/* Highlight */}
        <div className="relative mb-2">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="w-full p-2 rounded hover:bg-white/10 transition-colors flex items-center justify-center"
            disabled={!activeNote?.body}
            title="Surligner"
          >
            <Palette className="w-4 h-4" />
          </button>
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-neutral-900 border border-white/10 rounded-lg z-10">
              <div className="grid grid-cols-3 gap-1">
                {colors.map(color => (
                  <button
                    key={color}
                    onClick={() => handleColorSelect(color)}
                    className="w-6 h-6 rounded border border-white/20 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Alignment */}
        <div className="grid grid-cols-4 gap-1 mb-2">
          <button
            onClick={() => onFormatText('alignLeft')}
            className="p-2 rounded hover:bg-white/10 transition-colors flex items-center justify-center"
            title="Aligner à gauche"
            disabled={!activeNote?.body}
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onFormatText('alignCenter')}
            className="p-2 rounded hover:bg-white/10 transition-colors flex items-center justify-center"
            title="Centrer"
            disabled={!activeNote?.body}
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            onClick={() => onFormatText('alignRight')}
            className="p-2 rounded hover:bg-white/10 transition-colors flex items-center justify-center"
            title="Aligner à droite"
            disabled={!activeNote?.body}
          >
            <AlignRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onFormatText('alignJustify')}
            className="p-2 rounded hover:bg-white/10 transition-colors flex items-center justify-center"
            title="Justifier"
            disabled={!activeNote?.body}
          >
            <AlignJustify className="w-4 h-4" />
          </button>
        </div>

        {/* Lists */}
        <div className="grid grid-cols-3 gap-1 mb-2">
          <button
            onClick={() => onFormatText('bulletList')}
            className="p-2 rounded hover:bg-white/10 transition-colors flex items-center justify-center"
            title="Liste à puces"
            disabled={!activeNote?.body}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => onFormatText('orderedList')}
            className="p-2 rounded hover:bg-white/10 transition-colors flex items-center justify-center"
            title="Liste numérotée"
            disabled={!activeNote?.body}
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            onClick={() => onFormatText('blockquote')}
            className="p-2 rounded hover:bg-white/10 transition-colors flex items-center justify-center"
            title="Citation"
            disabled={!activeNote?.body}
          >
            <Quote className="w-4 h-4" />
          </button>
        </div>

        {/* Insert */}
        <div className="grid grid-cols-4 gap-1 mb-2">
          <button
            onClick={() => onInsertElement('link')}
            className="p-2 rounded hover:bg-white/10 transition-colors flex items-center justify-center"
            title="Lien"
          >
            <Link className="w-4 h-4" />
          </button>
          <button
            onClick={() => onInsertElement('table')}
            className="p-2 rounded hover:bg-white/10 transition-colors flex items-center justify-center"
            title="Tableau"
          >
            <Table className="w-4 h-4" />
          </button>
          <button
            onClick={() => onInsertElement('formula')}
            className="p-2 rounded hover:bg-white/10 transition-colors flex items-center justify-center"
            title="Formule"
          >
            <Calculator className="w-4 h-4" />
          </button>
          <button
            onClick={() => onInsertElement('date')}
            className="p-2 rounded hover:bg-white/10 transition-colors flex items-center justify-center"
            title="Date"
          >
            <Calendar className="w-4 h-4" />
          </button>
        </div>

        {/* Typography */}
        <div className="grid grid-cols-4 gap-1 mb-2">
          <button
            onClick={() => onFormatText('superscript')}
            className="p-2 rounded hover:bg-white/10 transition-colors flex items-center justify-center"
            title="Exposant"
            disabled={!activeNote?.body}
          >
            <Superscript className="w-4 h-4" />
          </button>
          <button
            onClick={() => onFormatText('subscript')}
            className="p-2 rounded hover:bg-white/10 transition-colors flex items-center justify-center"
            title="Indice"
            disabled={!activeNote?.body}
          >
            <Subscript className="w-4 h-4" />
          </button>
          <button
            onClick={() => onFormatText('code')}
            className="p-2 rounded hover:bg-white/10 transition-colors flex items-center justify-center"
            title="Code"
            disabled={!activeNote?.body}
          >
            <Code className="w-4 h-4" />
          </button>
          <button
            onClick={() => onFormatText('clear')}
            className="p-2 rounded hover:bg-white/10 transition-colors flex items-center justify-center"
            title="Effacer format"
            disabled={!activeNote?.body}
          >
            <Eraser className="w-4 h-4" />
          </button>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-4 gap-1">
          <button
            onClick={() => onAction('copy')}
            className="p-2 rounded hover:bg-white/10 transition-colors flex items-center justify-center"
            title="Copier (Ctrl+C)"
            disabled={!activeNote?.body}
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => onAction('cut')}
            className="p-2 rounded hover:bg-white/10 transition-colors flex items-center justify-center"
            title="Couper (Ctrl+X)"
            disabled={!activeNote?.body}
          >
            <Scissors className="w-4 h-4" />
          </button>
          <button
            onClick={() => onAction('paste')}
            className="p-2 rounded hover:bg-white/10 transition-colors flex items-center justify-center"
            title="Coller (Ctrl+V)"
          >
            <Clipboard className="w-4 h-4" />
          </button>
          <button
            onClick={() => onAction('undo')}
            className="p-2 rounded hover:bg-white/10 transition-colors flex items-center justify-center"
            title="Annuler (Ctrl+Z)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}