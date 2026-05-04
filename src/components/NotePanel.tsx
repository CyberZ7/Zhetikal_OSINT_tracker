import { useState, useEffect, useRef, useCallback } from 'react';
import { X, FileText, StickyNote, Maximize2, Minimize2, Bold, Italic, List, Hash, Tag } from 'lucide-react';
import type { EntityNode } from '../types';

interface NotePanelProps {
  selectedNode: EntityNode | null;
  caseNotes: string;
  caseTitle: string;
  onUpdateEntityNotes: (nodeId: string, notes: string) => void;
  onUpdateCaseNotes: (notes: string) => void;
  onUpdateCaseTitle: (title: string) => void;
  onClose: () => void;
}

function renderMarkdown(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3 class="text-cyber-cyan text-sm font-bold mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-cyber-cyan text-base font-bold mt-4 mb-1">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-cyber-text text-lg font-bold mt-4 mb-2">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-cyber-text font-bold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="text-cyber-text-dim italic">$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-cyber-dark text-cyber-cyan font-mono text-xs px-1 py-0.5 rounded">$1</code>')
    .replace(/^- (.+)$/gm, '<li class="flex gap-1.5 items-start"><span class="text-cyber-cyan mt-0.5">•</span><span>$1</span></li>')
    .replace(/(<li[\s\S]*?<\/li>)/g, '<ul class="space-y-0.5 my-1">$1</ul>')
    .replace(/^---$/gm, '<hr class="border-cyber-border my-3" />')
    .replace(/\n\n/g, '</p><p class="mb-2">')
    .replace(/\n/g, '<br />')
    .replace(/^(.+)$/, '<p class="mb-2">$1</p>');
}

type Tab = 'entity' | 'case';

export default function NotePanel({
  selectedNode,
  caseNotes,
  caseTitle,
  onUpdateEntityNotes,
  onUpdateCaseNotes,
  onUpdateCaseTitle,
  onClose,
}: NotePanelProps) {
  const [tab, setTab] = useState<Tab>(selectedNode ? 'entity' : 'case');
  const [entityDraft, setEntityDraft] = useState('');
  const [caseDraft, setCaseDraft] = useState(caseNotes);
  const [titleDraft, setTitleDraft] = useState(caseTitle);
  const [preview, setPreview] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const entitySaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const caseSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync entity draft when selection changes
  useEffect(() => {
    setEntityDraft(selectedNode?.data.notes ?? '');
    if (selectedNode) setTab('entity');
  }, [selectedNode?.id]);

  // Sync case notes from props
  useEffect(() => {
    setCaseDraft(caseNotes);
  }, [caseNotes]);

  // Sync case title from props
  useEffect(() => {
    setTitleDraft(caseTitle);
  }, [caseTitle]);

  // Auto-save entity notes with debounce
  const handleEntityChange = useCallback((val: string) => {
    setEntityDraft(val);
    if (!selectedNode) return;
    if (entitySaveTimer.current) clearTimeout(entitySaveTimer.current);
    entitySaveTimer.current = setTimeout(() => {
      onUpdateEntityNotes(selectedNode.id, val);
    }, 600);
  }, [selectedNode, onUpdateEntityNotes]);

  // Auto-save case notes with debounce
  const handleCaseChange = useCallback((val: string) => {
    setCaseDraft(val);
    if (caseSaveTimer.current) clearTimeout(caseSaveTimer.current);
    caseSaveTimer.current = setTimeout(() => {
      onUpdateCaseNotes(val);
    }, 600);
  }, [onUpdateCaseNotes]);

  // Auto-save case title with debounce
  const handleTitleChange = useCallback((val: string) => {
    setTitleDraft(val);
    if (titleSaveTimer.current) clearTimeout(titleSaveTimer.current);
    titleSaveTimer.current = setTimeout(() => {
      onUpdateCaseTitle(val);
    }, 400);
  }, [onUpdateCaseTitle]);

  const insertMarkdown = (before: string, after = '') => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = ta.value.slice(start, end);
    const newVal = ta.value.slice(0, start) + before + selected + after + ta.value.slice(end);
    if (tab === 'entity') handleEntityChange(newVal);
    else handleCaseChange(newVal);
    requestAnimationFrame(() => {
      ta.setSelectionRange(start + before.length, end + before.length);
      ta.focus();
    });
  };

  const currentDraft = tab === 'entity' ? entityDraft : caseDraft;
  const handleChange = tab === 'entity' ? handleEntityChange : handleCaseChange;
  const hasContent = currentDraft.trim().length > 0;

  const panelWidth = expanded ? 520 : 320;

  return (
    <div
      className="fixed right-0 flex flex-col bg-cyber-dark border-l border-cyber-border transition-all duration-300 z-40"
      style={{ top: 60, bottom: 28, width: panelWidth }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-cyber-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <StickyNote size={14} className="text-cyber-cyan" />
          <span className="text-xs font-semibold text-cyber-text">Notes</span>
          {hasContent && (
            <span className="w-1.5 h-1.5 rounded-full bg-cyber-cyan animate-pulse" />
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-6 h-6 rounded flex items-center justify-center text-cyber-text-dim hover:text-cyber-cyan hover:bg-cyber-panel transition-colors"
            title={expanded ? 'Réduire' : 'Agrandir'}
          >
            {expanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded flex items-center justify-center text-cyber-text-dim hover:text-cyber-text hover:bg-cyber-panel transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-cyber-border flex-shrink-0">
        <button
          onClick={() => setTab('entity')}
          disabled={!selectedNode}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-medium transition-colors border-b-2 ${
            tab === 'entity'
              ? 'border-cyber-cyan text-cyber-cyan'
              : 'border-transparent text-cyber-text-dim hover:text-cyber-text disabled:opacity-30 disabled:cursor-not-allowed'
          }`}
        >
          <StickyNote size={11} />
          {selectedNode ? (
            <span className="truncate max-w-[110px]">{selectedNode.data.label}</span>
          ) : (
            'Entité'
          )}
        </button>
        <button
          onClick={() => setTab('case')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-medium transition-colors border-b-2 ${
            tab === 'case'
              ? 'border-cyber-cyan text-cyber-cyan'
              : 'border-transparent text-cyber-text-dim hover:text-cyber-text'
          }`}
        >
          <FileText size={11} />
          Notes dossier
        </button>
      </div>

      {/* Entity empty state */}
      {tab === 'entity' && !selectedNode && (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-cyber-text-dim px-6 text-center">
          <StickyNote size={28} className="opacity-30" />
          <p className="text-xs opacity-60">Sélectionne une entité sur le tableau pour afficher ses notes ici.</p>
        </div>
      )}

      {/* Editor area */}
      {(tab === 'case' || selectedNode) && (
        <>
          {/* Case title field — only in case tab */}
          {tab === 'case' && (
            <div className="px-4 pt-4 pb-3 border-b border-cyber-border flex-shrink-0">
              <div className="flex items-center gap-2 mb-1.5">
                <Tag size={11} className="text-cyber-cyan flex-shrink-0" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyber-text-dim">
                  Référence dossier
                </span>
              </div>
              <input
                value={titleDraft}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="N° affaire / Titre du dossier..."
                className="w-full bg-cyber-black border border-cyber-border rounded-lg px-3 py-2 text-sm font-bold text-cyber-cyan outline-none focus:border-cyber-cyan placeholder:text-cyber-text-dim/30 placeholder:font-normal tracking-wide transition-colors"
                style={{ fontFamily: 'var(--font-tech, monospace)' }}
              />
              {titleDraft && (
                <p className="mt-1.5 text-[10px] font-mono text-cyber-text-dim/60 truncate">
                  {titleDraft}
                </p>
              )}
            </div>
          )}

          {/* Toolbar */}
          <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-cyber-border flex-shrink-0">
            <button
              onClick={() => insertMarkdown('**', '**')}
              className="w-6 h-6 rounded flex items-center justify-center text-cyber-text-dim hover:text-cyber-text hover:bg-cyber-panel transition-colors text-xs font-bold"
              title="Gras"
            >
              <Bold size={11} />
            </button>
            <button
              onClick={() => insertMarkdown('*', '*')}
              className="w-6 h-6 rounded flex items-center justify-center text-cyber-text-dim hover:text-cyber-text hover:bg-cyber-panel transition-colors"
              title="Italique"
            >
              <Italic size={11} />
            </button>
            <button
              onClick={() => insertMarkdown('- ')}
              className="w-6 h-6 rounded flex items-center justify-center text-cyber-text-dim hover:text-cyber-text hover:bg-cyber-panel transition-colors"
              title="Liste"
            >
              <List size={11} />
            </button>
            <button
              onClick={() => insertMarkdown('## ')}
              className="w-6 h-6 rounded flex items-center justify-center text-cyber-text-dim hover:text-cyber-text hover:bg-cyber-panel transition-colors"
              title="Titre"
            >
              <Hash size={11} />
            </button>
            <div className="flex-1" />
            <button
              onClick={() => setPreview(!preview)}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                preview
                  ? 'bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/30'
                  : 'text-cyber-text-dim hover:text-cyber-text hover:bg-cyber-panel border border-transparent'
              }`}
            >
              {preview ? 'Éditer' : 'Aperçu'}
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {preview ? (
              <div
                className="flex-1 overflow-y-auto px-4 py-3 text-xs text-cyber-text-dim leading-relaxed font-mono"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(currentDraft) || '<span class="opacity-40 italic">Rien à prévisualiser...</span>' }}
              />
            ) : (
              <textarea
                ref={textareaRef}
                value={currentDraft}
                onChange={(e) => handleChange(e.target.value)}
                placeholder={tab === 'entity' ? 'Notes sur cette entité... (Markdown supporté)' : 'Notes générales du dossier... (Markdown supporté)'}
                className="flex-1 w-full bg-transparent px-4 py-3 text-xs text-cyber-text font-mono leading-relaxed resize-none outline-none placeholder:text-cyber-text-dim/40"
                style={{ minHeight: 0 }}
              />
            )}
          </div>

          {/* Footer status */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-cyber-border flex-shrink-0">
            <span className="text-[10px] text-cyber-text-dim font-mono">
              {currentDraft.length} chars · Markdown
            </span>
            <span className="text-[10px] text-cyber-green font-mono">Auto-sauvegardé</span>
          </div>
        </>
      )}
    </div>
  );
}
