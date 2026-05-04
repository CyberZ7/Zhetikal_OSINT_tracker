import { useRef, useState } from 'react';
import {
  Plus, FolderOpen, Trash2, Download, Upload, ChevronDown,
  ChevronRight, Search, X, FileText, Image, Save,
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

const ENTITY_TYPES = Object.keys(ENTITY_LABELS) as EntityType[];

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
  const [creatingCase, setCreatingCase] = useState(false);
  const [newCaseName, setNewCaseName] = useState('');
  const [newCaseDesc, setNewCaseDesc] = useState('');
  const [entityLabel, setEntityLabel] = useState('');
  const [typeSearch, setTypeSearch] = useState('');
  const [selectedType, setSelectedType] = useState<EntityType>('ip');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredTypes = ENTITY_TYPES.filter((t) =>
    t.toLowerCase().includes(typeSearch.toLowerCase()) ||
    ENTITY_LABELS[t].toLowerCase().includes(typeSearch.toLowerCase())
  );

  const handleCreateCase = () => {
    if (!newCaseName.trim()) return;
    const id = onCreateCase(newCaseName.trim(), newCaseDesc.trim());
    onSwitchCase(id);
    setNewCaseName('');
    setNewCaseDesc('');
    setCreatingCase(false);
  };

  const handleAddEntity = (type: EntityType) => {
    setSelectedType(type);
    onAddEntity(type, entityLabel || ENTITY_LABELS[type]);
    setEntityLabel('');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        onImport(text);
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div
      className="h-full flex flex-col border-r border-cyber-border bg-cyber-dark transition-all duration-300 relative"
      style={{ width: collapsed ? 48 : 280 }}
    >
      {/* Collapse toggle button — floating */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-3 z-50 p-1.5 rounded-lg bg-cyber-panel border border-cyber-border text-cyber-cyan hover:bg-cyber-border transition-colors"
        style={{ left: collapsed ? 6 : 254 }}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
      </button>

      {!collapsed && (
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="h-[60px] flex items-center px-4 border-b border-cyber-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/30 flex items-center justify-center">
                <FolderOpen size={16} className="text-cyber-cyan" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-cyber-text tracking-wide">Zhetical</h1>
                <p className="text-[10px] text-cyber-text-dim font-mono uppercase tracking-widest">
                  OSINT Tracker
                </p>
              </div>
            </div>
          </div>

          {/* Cases section */}
          <div className="border-b border-cyber-border">
            <button
              onClick={() => setCasesOpen(!casesOpen)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-cyber-text-dim uppercase tracking-wider hover:bg-cyber-panel/50 transition-colors"
            >
              <span>Cases ({cases.length})</span>
              {casesOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>

            {casesOpen && (
              <div className="px-3 pb-3 space-y-1">
                {cases.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => onSwitchCase(c.id)}
                    className={`group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all ${
                      c.id === activeCaseId
                        ? 'bg-cyber-cyan/10 border border-cyber-cyan/30'
                        : 'hover:bg-cyber-panel/50 border border-transparent'
                    }`}
                  >
                    <FolderOpen
                      size={12}
                      className={c.id === activeCaseId ? 'text-cyber-cyan' : 'text-cyber-text-dim'}
                    />
                    <span
                      className={`flex-1 text-xs truncate ${
                        c.id === activeCaseId ? 'text-cyber-cyan font-medium' : 'text-cyber-text'
                      }`}
                    >
                      {c.name}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteCase(c.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-cyber-red/20 text-cyber-text-dim hover:text-cyber-red transition-all"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))}

                {creatingCase ? (
                  <div className="space-y-1.5 p-2 rounded-lg bg-cyber-panel border border-cyber-border">
                    <input
                      value={newCaseName}
                      onChange={(e) => setNewCaseName(e.target.value)}
                      placeholder="Case name..."
                      autoFocus
                      className="w-full bg-cyber-dark border border-cyber-border rounded px-2 py-1 text-xs text-cyber-text outline-none focus:border-cyber-cyan"
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateCase()}
                    />
                    <input
                      value={newCaseDesc}
                      onChange={(e) => setNewCaseDesc(e.target.value)}
                      placeholder="Description (optional)..."
                      className="w-full bg-cyber-dark border border-cyber-border rounded px-2 py-1 text-xs text-cyber-text-dim outline-none focus:border-cyber-cyan"
                    />
                    <div className="flex gap-1">
                      <button
                        onClick={handleCreateCase}
                        className="flex-1 py-1 rounded text-[10px] font-semibold bg-cyber-cyan/20 text-cyber-cyan hover:bg-cyber-cyan/30 transition-colors"
                      >
                        Create
                      </button>
                      <button
                        onClick={() => setCreatingCase(false)}
                        className="px-2 py-1 rounded text-[10px] text-cyber-text-dim hover:bg-cyber-panel transition-colors"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setCreatingCase(true)}
                    className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg border border-dashed border-cyber-border text-xs text-cyber-text-dim hover:border-cyber-cyan/50 hover:text-cyber-cyan transition-colors"
                  >
                    <Plus size={12} />
                    New Case
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Entities section */}
          <div className="flex-1 overflow-y-auto">
            <button
              onClick={() => setEntitiesOpen(!entitiesOpen)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-cyber-text-dim uppercase tracking-wider hover:bg-cyber-panel/50 transition-colors"
            >
              <span>Entities</span>
              {entitiesOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>

            {entitiesOpen && (
              <div className="px-3 pb-3 space-y-2">
                {/* Label input + add button */}
                <div className="flex gap-1">
                  <input
                    value={entityLabel}
                    onChange={(e) => setEntityLabel(e.target.value)}
                    placeholder="Label..."
                    className="flex-1 bg-cyber-dark border border-cyber-border rounded px-2 py-1 text-xs text-cyber-text outline-none focus:border-cyber-cyan"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddEntity(selectedType)}
                  />
                  <button
                    onClick={() => handleAddEntity(selectedType)}
                    className="px-2 py-1 rounded bg-cyber-cyan/20 text-cyber-cyan hover:bg-cyber-cyan/30 transition-colors"
                  >
                    <Plus size={12} />
                  </button>
                </div>

                {/* Type search */}
                <div className="relative">
                  <Search size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-cyber-text-dim" />
                  <input
                    value={typeSearch}
                    onChange={(e) => setTypeSearch(e.target.value)}
                    placeholder="Search types..."
                    className="w-full bg-cyber-dark border border-cyber-border rounded pl-6 pr-2 py-1 text-[10px] text-cyber-text outline-none focus:border-cyber-cyan"
                  />
                </div>

                {/* Entity type grid */}
                <div className="grid grid-cols-2 gap-1">
                  {filteredTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => handleAddEntity(type)}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-medium border transition-all ${
                        selectedType === type
                          ? 'border-cyber-cyan/40 bg-cyber-cyan/10 text-cyber-cyan'
                          : 'border-cyber-border bg-cyber-panel/50 text-cyber-text-dim hover:border-cyber-border hover:bg-cyber-panel hover:text-cyber-text'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: ENTITY_COLORS[type] }}
                      />
                      {ENTITY_LABELS[type]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom actions */}
          <div className="border-t border-cyber-border p-3 space-y-1">
            {/* Save Progress — prominent */}
            <button
              onClick={onSaveProgress}
              disabled={!activeCaseId}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-semibold text-cyber-green bg-cyber-green/10 hover:bg-cyber-green/20 border border-cyber-green/30 hover:border-cyber-green/50 transition-colors disabled:opacity-30"
            >
              <Save size={12} />
              Save Progress
            </button>

            <button
              onClick={onExport}
              disabled={!activeCaseId}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-cyber-text-dim hover:bg-cyber-panel hover:text-cyber-text transition-colors disabled:opacity-30"
            >
              <Download size={12} />
              Export JSON
            </button>

            <button
              onClick={onExportPdf}
              disabled={!activeCaseId}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-cyber-text-dim hover:bg-cyber-panel hover:text-cyber-text transition-colors disabled:opacity-30"
            >
              <FileText size={12} />
              Export PDF
            </button>

            <button
              onClick={onExportPng}
              disabled={!activeCaseId}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-cyber-text-dim hover:bg-cyber-panel hover:text-cyber-text transition-colors disabled:opacity-30"
            >
              <Image size={12} />
              Export PNG
            </button>

            <button
              onClick={handleImport}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-cyber-text-dim hover:bg-cyber-panel hover:text-cyber-text transition-colors"
            >
              <Upload size={12} />
              Import JSON
            </button>
          </div>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept=".json" className="hidden" />
    </div>
  );
}
