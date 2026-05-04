import { memo, useState, useRef, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  Globe, Mail, User, Phone, MapPin, Building2,
  FileText, Link, Bitcoin, StickyNote, Pencil, Trash2, X, Check,
} from 'lucide-react';
import type { EntityData } from '../types';

const ICON_MAP: Record<string, React.ElementType> = {
  Globe, Mail, User, Phone, MapPin, Building2,
  FileText, Link, Bitcoin, StickyNote,
};

const TECH_TYPES = ['ip', 'domain', 'url', 'email', 'crypto', 'phone'];

const TYPE_LABELS: Record<string, string> = {
  ip: 'IP',
  domain: 'DOMAIN',
  email: 'EMAIL',
  username: 'USER',
  phone: 'PHONE',
  location: 'LOCATION',
  organization: 'ORG',
  person: 'PERSON',
  file: 'FILE',
  url: 'URL',
  crypto: 'CRYPTO',
  note: 'NOTE',
};

interface EntityNodeProps {
  id: string;
  data: EntityData;
  selected?: boolean;
}

export default memo(function EntityNode({ id, data, selected }: EntityNodeProps) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(data.label);
  const [notes, setNotes] = useState(data.notes);
  const labelRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLabel(data.label);
    setNotes(data.notes);
  }, [data.label, data.notes]);

  useEffect(() => {
    if (editing && labelRef.current) {
      labelRef.current.focus();
      labelRef.current.select();
    }
  }, [editing]);

  const handleSave = () => {
    window.dispatchEvent(
      new CustomEvent('entity-update', { detail: { id, label, notes } })
    );
    setEditing(false);
  };

  const handleDelete = () => {
    window.dispatchEvent(new CustomEvent('entity-delete', { detail: { id } }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      setLabel(data.label);
      setNotes(data.notes);
      setEditing(false);
    }
  };

  const IconComponent = ICON_MAP[data.icon] || Globe;
  const typeLabel = TYPE_LABELS[data.entityType] || data.entityType.toUpperCase();
  const borderColor = data.color || '#1e3a5f';

  return (
    <div
      className={`relative rounded-xl bg-cyber-panel border transition-all duration-200 min-w-[200px] max-w-[280px] ${
        selected ? 'shadow-lg' : ''
      }`}
      style={{
        borderColor: selected ? data.color : '#1e3a5f',
        boxShadow: selected ? `0 0 16px ${data.color}40` : 'none',
      }}
      onDoubleClick={() => !editing && setEditing(true)}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3"
        style={{ background: borderColor }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3"
        style={{ background: borderColor }}
      />
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3"
        style={{ background: borderColor }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3"
        style={{ background: borderColor }}
      />

      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${data.color}22` }}
        >
          <IconComponent size={16} style={{ color: data.color }} />
        </div>

        {editing ? (
          <input
            ref={labelRef}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-cyber-dark border border-cyber-border rounded px-2 py-0.5 text-sm font-semibold text-cyber-text outline-none focus:border-cyber-cyan font-tech"
          />
        ) : (
          <span className={`flex-1 text-sm font-semibold text-cyber-text truncate ${TECH_TYPES.includes(data.entityType) ? 'font-tech' : ''}`}>
            {data.label}
          </span>
        )}

        <span
          className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border flex-shrink-0"
          style={{ color: data.color, borderColor: `${data.color}44`, background: `${data.color}11` }}
        >
          {typeLabel}
        </span>
      </div>

      {/* Notes / Body */}
      <div className="px-3 pb-3">
        {editing ? (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add notes..."
            rows={2}
            className="w-full bg-cyber-dark border border-cyber-border rounded px-2 py-1 text-xs text-cyber-text-dim outline-none focus:border-cyber-cyan resize-none font-mono"
          />
        ) : (
          <p className="text-xs font-mono text-cyber-text-dim italic">
            {data.notes || 'Double-click to edit...'}
          </p>
        )}
      </div>

      {/* Action buttons */}
      {editing ? (
        <div className="flex gap-1 px-3 pb-3">
          <button
            onClick={handleSave}
            className="flex items-center gap-1 px-2 py-1 rounded bg-cyber-green/20 border border-cyber-green/40 text-cyber-green text-[10px] font-medium hover:bg-cyber-green/30 transition-colors"
          >
            <Check size={10} /> Save
          </button>
          <button
            onClick={() => {
              setLabel(data.label);
              setNotes(data.notes);
              setEditing(false);
            }}
            className="flex items-center gap-1 px-2 py-1 rounded bg-cyber-panel border border-cyber-border text-cyber-text-dim text-[10px] font-medium hover:bg-cyber-dark transition-colors"
          >
            <X size={10} /> Cancel
          </button>
        </div>
      ) : (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setEditing(true)}
            className="w-5 h-5 rounded flex items-center justify-center bg-cyber-dark/80 hover:bg-cyber-panel text-cyber-text-dim hover:text-cyber-cyan transition-colors"
          >
            <Pencil size={10} />
          </button>
          <button
            onClick={handleDelete}
            className="w-5 h-5 rounded flex items-center justify-center bg-cyber-dark/80 hover:bg-cyber-panel text-cyber-text-dim hover:text-cyber-red transition-colors"
          >
            <Trash2 size={10} />
          </button>
        </div>
      )}
    </div>
  );
});
