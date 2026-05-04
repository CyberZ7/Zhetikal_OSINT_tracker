import type { Node, Edge } from '@xyflow/react';

export type EntityType =
  | 'ip'
  | 'domain'
  | 'email'
  | 'username'
  | 'phone'
  | 'location'
  | 'organization'
  | 'person'
  | 'file'
  | 'url'
  | 'crypto'
  | 'note';

export interface EntityData extends Record<string, unknown> {
  label: string;
  entityType: EntityType;
  notes: string;
  color: string;
  icon: string;
}

export interface EntityNode extends Node {
  type: 'entity';
  data: EntityData;
}

export interface CaseData {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  nodes: EntityNode[];
  edges: Edge[];
  caseNotes?: string;
  caseTitle?: string;
}

export const ENTITY_LABELS: Record<EntityType, string> = {
  ip: 'IP Address',
  domain: 'Domain',
  email: 'Email',
  username: 'Username',
  phone: 'Phone',
  location: 'Location',
  organization: 'Organization',
  person: 'Person',
  file: 'File',
  url: 'URL',
  crypto: 'Crypto',
  note: 'Note',
};

export const ENTITY_COLORS: Record<EntityType, string> = {
  ip: '#ef4444',
  domain: '#0ea5e9',
  email: '#f59e0b',
  username: '#8b5cf6',
  phone: '#8b5cf6',
  location: '#10b981',
  organization: '#0ea5e9',
  person: '#f59e0b',
  file: '#94a3b8',
  url: '#0ea5e9',
  crypto: '#f59e0b',
  note: '#94a3b8',
};

export const ENTITY_ICON_NAMES: Record<EntityType, string> = {
  ip: 'Globe',
  domain: 'Globe',
  email: 'Mail',
  username: 'User',
  phone: 'Phone',
  location: 'MapPin',
  organization: 'Building2',
  person: 'User',
  file: 'FileText',
  url: 'Link',
  crypto: 'Bitcoin',
  note: 'StickyNote',
};
