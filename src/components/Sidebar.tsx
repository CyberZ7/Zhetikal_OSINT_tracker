import { useState, useRef } from 'react';
import {
  Plus, FolderOpen, Trash2, Download, Upload, ChevronDown,
  ChevronRight, Search, Briefcase, FileText, Image, Save,
  ChevronLeft, ChevronRight as ChevronRightIcon,
} from 'lucide-react';
import type { CaseData, EntityType } from '../types';
import { ENTITY_COLORS, ENTITY_LABELS } from '../types';

interface SidebarProps {
  cases: CaseData[];
  activeCaseId: string | null;
  onCreateCase: (name: string, description: string) => string;
  onSwitchCase: (id: string) => void;
  onDeleteCase: (id: string) => void;
  onAddEntity: (type: EntityType, label: string) => void;
  onSaveProgress: () => void;
  onExport: () => void;
  onExportPdf: () => Promise<void>;
  onExportPng: () => Promise<void>;
  onImport: (json: string) => void;
}

const ENTITY_TYPES: EntityType[] = [
  'ip', 'domain', 'email', 'username', 'phone',
  'location', 'organization', 'person', 'file', 'url', 'crypto', 'note',
];

export default function Sidebar({
  cases,
  activeCaseId,
  onCreateCase,
  onSwitchCase,
  onDeleteCase,
  onAddEntity,
  onSaveProgress,
  onExport,
  onExportPdf,
  onExportPng,
  onImport,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [casesOpen, setCasesOpen] = useState(true);
  const [entitiesOpen, setEntitiesOpen] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);
  const [newCaseName, setNewCaseName] = useState('');
  const [entityType, setEntityType] = useState<EntityType>('ip');
  const [entityLabel, setEntityLabel] = useState('');
  const [search, setSearch] = useState('');
  const [exporting, setExporting] = useState<'pdf' | 'png' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredCases = cases.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateCase = () => {
    const name = newCaseName.trim() || `Case ${cases.length + 1}`;
    const id = onCreateCase(name, '');
    onSwitchCase(id);
    setNewCaseName('');
  };

  const handleAddEntity = () => {
    const label = entityLabel.trim() || ENTITY_LABELS[entityType];
    onAddEntity(entityType, label);
    setEntityLabel('');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      onImport(text);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportPng = async () => {
    setExporting('png');
    try {
      await onExportPng();
    } finally {
      setExporting(null);
    }
  };

  const handleExportPdf = async () => {
    setExporting('pdf');
    try {
      await onExportPdf();
    } finally {
      setExporting(null);
    }
  };

  if (collapsed) {
    return (
      <div className="w-12 flex flex-col items-center py-3 gap-3 bg-cyber-dark border-r border-cyber-border">
        <button
          onClick={() => setCollapsed(false)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-cyber-cyan hover:bg-cyber-panel transition-colors"
          title="Expand sidebar"
        >
          <ChevronRightIcon size={16} />
        </button>
        <div className="w-px h-4 bg-cyber-border" />
        <button
          onClick={onSaveProgress}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-cyber-green hover:bg-cyber-panel transition-colors"
          title="Save Progress"
        >
          <Save size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="w-64 flex flex-col bg-cyber-dark border-r border-cyber-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-cyber-border">
        <div className="flex items-center gap-2">
          <Briefcase size={16} className="text-cyber-cyan" />
          <span className="text-sm font-bold text-cyber-text">OSINT Tracker</span>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="w-6 h-6 rounded flex items-center justify-center text-cyber-text-dim hover:text-cyber-cyan hover:bg-cyber-panel transition-colors"
        >
          <ChevronLeft size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Save Progress — always visible, prominent */}
        <div className="px-3 pt-3 pb-2">
          <button
            onClick={onSaveProgress}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-cyber-green/15 border border-cyber-green/40 text-cyber-green text-xs font-semibold hover:bg-cyber-green/25 transition-colors"
          >
            <Save size={13} />
            Save Progress
          </button>
        </div>

        {/* Cases */}
        <div className="border-t border-cyber-border">
          <button
            onClick={() => setCasesOpen(!casesOpen)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-[11px] font-semibold text-cyber-text-dim uppercase tracking-wider hover:text-cyber-text transition-colors"
          >
            <span>Cases</span>
            {casesOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>

          {casesOpen && (
            <div className="px-3 pb-3 space-y-2">
              <div className="relative">
                <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-cyber-text-dim" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search cases..."
                  className="w-full bg-cyber-panel border border-cyber-border rounded-lg pl-7 pr-3 py-1.5 text-xs text-cyber-text placeholder-cyber-text-dim outline-none focus:border-cyber-cyan transition-colors"
                />
              </div>

              <div className="flex gap-1.5">
                <input
                  value={newCaseName}
                  onChange={(e) => setNewCaseName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateCase()}
                  placeholder="New case name..."
                  className="flex-1 bg-cyber-panel border border-cyber-border rounded-lg px-2.5 py-1.5 text-xs text-cyber-text placeholder-cyber-text-dim outline-none focus:border-cyber-cyan transition-colors"
                />
                <button
                  onClick={handleCreateCase}
                  className="w-7 h-7 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan flex items-center justify-center hover:bg-cyber-cyan/20 transition-colors flex-shrink-0"
                >
                  <Plus size={13} />
                </button>
              </div>

              <div className="space-y-1 max-h-40 overflow-y-auto">
                {filteredCases.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => onSwitchCase(c.id)}
                    className={`group flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                      c.id === activeCaseId
                        ? 'bg-cyber-cyan/10 border border-cyber-cyan/30'
                        : 'hover:bg-cyber-panel border border-transparent'
                    }`}
                  >
                    <FolderOpen
                      size={12}
                      className={c.id === activeCaseId ? 'text-cyber-cyan' : 'text-cyber-text-dim'}
                    />
                    <span
                      className={`flex-1 text-xs truncate ${
                        c.id === activeCaseId ? 'text-cyber-cyan font-medium' : 'text-cyber-text-dim'
                      }`}
                    >
                      {c.name}
                    </span>
                    {cases.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteCase(c.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 w-4 h-4 rounded flex items-center justify-center text-cyber-text-dim hover:text-cyber-red transition-all"
                      >
                        <Trash2 size={10} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Add Entity */}
        <div className="border-t border-cyber-border">
          <button
            onClick={() => setEntitiesOpen(!entitiesOpen)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-[11px] font-semibold text-cyber-text-dim uppercase tracking-wider hover:text-cyber-text transition-colors"
          >
            <span>Add Entity</span>
            {entitiesOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>

          {entitiesOpen && (
            <div className="px-3 pb-3 space-y-2">
              <select
                value={entityType}
                onChange={(e) => setEntityType(e.target.value as EntityType)}
                className="w-full bg-cyber-panel border border-cyber-border rounded-lg px-2.5 py-1.5 text-xs text-cyber-text outline-none focus:border-cyber-cyan transition-colors appearance-none cursor-pointer"
              >
                {ENTITY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {ENTITY_LABELS[t]}
                  </option>
                ))}
              </select>

              <div className="flex gap-1.5">
                <input
                  value={entityLabel}
                  onChange={(e) => setEntityLabel(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddEntity()}
                  placeholder={`Label (optional)`}
                  className="flex-1 bg-cyber-panel border border-cyber-border rounded-lg px-2.5 py-1.5 text-xs text-cyber-text placeholder-cyber-text-dim outline-none focus:border-cyber-cyan transition-colors"
                />
                <button
                  onClick={handleAddEntity}
                  className="px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border transition-colors flex-shrink-0"
                  style={{
                    color: ENTITY_COLORS[entityType],
                    borderColor: `${ENTITY_COLORS[entityType]}44`,
                    background: `${ENTITY_COLORS[entityType]}11`,
                  }}
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Export / Import */}
        <div className="border-t border-cyber-border">
          <button
            onClick={() => setExportOpen(!exportOpen)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-[11px] font-semibold text-cyber-text-dim uppercase tracking-wider hover:text-cyber-text transition-colors"
          >
            <span>Export / Import</span>
            {exportOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>

          {exportOpen && (
            <div className="px-3 pb-3 space-y-1.5">
              <button
                onClick={onExport}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-cyber-panel border border-cyber-border text-cyber-text-dim text-xs hover:text-cyber-text hover:border-cyber-cyan/40 transition-colors"
              >
                <Download size={12} />
                Export JSON
              </button>

              <button
                onClick={handleExportPng}
                disabled={exporting !== null}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-cyber-panel border border-cyber-border text-cyber-text-dim text-xs hover:text-cyber-text hover:border-cyber-cyan/40 transition-colors disabled:opacity-50"
              >
                <Image size={12} />
                {exporting === 'png' ? 'Capturing...' : 'Export PNG'}
              </button>

              <button
                onClick={handleExportPdf}
                disabled={exporting !== null}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-cyber-panel border border-cyber-border text-cyber-text-dim text-xs hover:text-cyber-text hover:border-cyber-cyan/40 transition-colors disabled:opacity-50"
              >
                <FileText size={12} />
                {exporting === 'pdf' ? 'Generating...' : 'Export PDF'}
              </button>

              <div className="h-px bg-cyber-border my-1" />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-cyber-panel border border-cyber-border text-cyber-text-dim text-xs hover:text-cyber-text hover:border-cyber-cyan/40 transition-colors"
              >
                <Upload size={12} />
                Import Case (.json)
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-cyber-border">
        <p className="text-[9px] font-mono text-cyber-text-dim text-center">
          Zhetical OSINT v2.0 · Local Storage Only
        </p>
      </div>
    </div>
  );
}
