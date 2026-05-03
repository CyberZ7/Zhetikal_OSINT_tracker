import { useCallback, useState, useEffect } from 'react';
import {
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  MarkerType,
} from '@xyflow/react';
import type { CaseData, EntityData, EntityType, EntityNode } from '../types';
import { ENTITY_COLORS, ENTITY_ICON_NAMES, ENTITY_LABELS } from '../types';

const STORAGE_KEY = 'zhetical-osint-cases';
const ACTIVE_CASE_KEY = 'zhetical-osint-active-case';

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function loadCases(): CaseData[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCases(cases: CaseData[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
}

function loadActiveCaseId(): string | null {
  return localStorage.getItem(ACTIVE_CASE_KEY);
}

function saveActiveCaseId(id: string | null) {
  if (id) {
    localStorage.setItem(ACTIVE_CASE_KEY, id);
  } else {
    localStorage.removeItem(ACTIVE_CASE_KEY);
  }
}

export function useStore() {
  const [cases, setCases] = useState<CaseData[]>(loadCases);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(loadActiveCaseId);
  const [nodes, setNodes, onNodesChange] = useNodesState<EntityNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const activeCase = cases.find((c) => c.id === activeCaseId) ?? null;

  useEffect(() => {
    saveCases(cases);
  }, [cases]);

  useEffect(() => {
    saveActiveCaseId(activeCaseId);
  }, [activeCaseId]);

  useEffect(() => {
    if (!activeCaseId) return;
    setCases((prev) =>
      prev.map((c) =>
        c.id === activeCaseId
          ? { ...c, nodes: nodes as EntityNode[], edges, updatedAt: new Date().toISOString() }
          : c
      )
    );
  }, [nodes, edges, activeCaseId]);

  const createCase = useCallback((name: string, description: string = '') => {
    const newCase: CaseData = {
      id: generateId(),
      name,
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: [],
      edges: [],
    };
    setCases((prev) => [...prev, newCase]);
    return newCase.id;
  }, []);

  const switchCase = useCallback(
    (caseId: string) => {
      setCases((currentCases) => {
        const target = currentCases.find((c) => c.id === caseId);
        if (target) {
          setNodes(target.nodes);
          setEdges(target.edges);
          setActiveCaseId(caseId);
        }
        return currentCases;
      });
    },
    [setNodes, setEdges]
  );

  const deleteCase = useCallback(
    (caseId: string) => {
      setCases((prev) => {
        const remaining = prev.filter((c) => c.id !== caseId);
        if (activeCaseId === caseId) {
          if (remaining.length > 0) {
            const target = remaining[0];
            setNodes(target.nodes);
            setEdges(target.edges);
            setActiveCaseId(target.id);
          } else {
            setActiveCaseId(null);
            setNodes([]);
            setEdges([]);
          }
        }
        return remaining;
      });
    },
    [activeCaseId, setNodes, setEdges]
  );

  const addEntity = useCallback(
    (entityType: EntityType, label: string, position?: { x: number; y: number }) => {
      const newNode: EntityNode = {
        id: generateId(),
        type: 'entity',
        position: position ?? {
          x: 100 + Math.random() * 400,
          y: 100 + Math.random() * 300,
        },
        data: {
          label: label || ENTITY_LABELS[entityType],
          entityType,
          notes: '',
          color: ENTITY_COLORS[entityType],
          icon: ENTITY_ICON_NAMES[entityType],
        },
      };
      setNodes((prev) => [...prev, newNode]);
      return newNode.id;
    },
    [setNodes]
  );

  const updateNodeData = useCallback(
    (nodeId: string, data: Partial<EntityData>) => {
      setNodes((prev) =>
        prev.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n))
      );
    },
    [setNodes]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const newEdge: Edge = {
        ...connection,
        id: `e-${generateId()}`,
        type: 'smoothstep',
        animated: false,
        style: { stroke: '#00c8d4', strokeWidth: 3 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 18,
          height: 18,
          color: '#00c8d4',
        },
      };
      setEdges((prev) => addEdge(newEdge, prev));
    },
    [setEdges]
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((prev) => prev.filter((n) => n.id !== nodeId));
      setEdges((prev) => prev.filter((e) => e.source !== nodeId && e.target !== nodeId));
    },
    [setNodes, setEdges]
  );

  // Export current case as JSON file (Save Progress)
  const saveProgress = useCallback(() => {
    if (!activeCase) return;
    const snapshot: CaseData = {
      ...activeCase,
      nodes: nodes as EntityNode[],
      edges,
      updatedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeCase.name.replace(/\s+/g, '_')}_save.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeCase, nodes, edges]);

  const exportCase = useCallback(() => {
    if (!activeCase) return;
    const blob = new Blob([JSON.stringify(activeCase, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeCase.name.replace(/\s+/g, '_')}_export.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeCase]);

  const importCase = useCallback(
    (jsonString: string) => {
      try {
        const data: CaseData = JSON.parse(jsonString);
        // If a case with the same name exists, update it; otherwise create new
        const existing = cases.find((c) => c.name === data.name);
        if (existing) {
          setCases((prev) =>
            prev.map((c) =>
              c.id === existing.id
                ? { ...data, id: existing.id, updatedAt: new Date().toISOString() }
                : c
            )
          );
          setNodes(data.nodes);
          setEdges(data.edges);
          setActiveCaseId(existing.id);
        } else {
          const newId = generateId();
          const imported: CaseData = { ...data, id: newId, updatedAt: new Date().toISOString() };
          setCases((prev) => [...prev, imported]);
          setNodes(imported.nodes);
          setEdges(imported.edges);
          setActiveCaseId(newId);
        }
      } catch {
        alert('Invalid case file format.');
      }
    },
    [cases, setNodes, setEdges]
  );

  return {
    cases,
    activeCase,
    activeCaseId,
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    createCase,
    switchCase,
    deleteCase,
    addEntity,
    updateNodeData,
    onConnect,
    deleteNode,
    saveProgress,
    exportCase,
    importCase,
  };
}
