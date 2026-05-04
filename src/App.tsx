import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  MarkerType,
  useReactFlow,
  type NodeTypes,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Ghost, Activity } from 'lucide-react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

import EntityNode from './components/EntityNode';
import CustomEdge from './components/CustomEdge';
import Sidebar from './components/Sidebar';
import ToolkitPanel from './components/ToolkitPanel';
import NotePanel from './components/NotePanel';
import { useStore } from './store/useStore';
import type { EntityData, EntityNode as EntityNodeType, EntityType } from './types';

const nodeTypes: NodeTypes = {
  entity: EntityNode as NodeTypes['entity'],
};

const edgeTypes = {
  custom: CustomEdge,
};

// Inner component that has access to useReactFlow context
function FlowExporter({
  activeCase,
  onRegisterExportPng,
  onRegisterExportPdf,
}: {
  activeCase: ReturnType<typeof useStore>['activeCase'];
  onRegisterExportPng: (fn: () => Promise<void>) => void;
  onRegisterExportPdf: (fn: () => Promise<void>) => void;
}) {
  const { getNodes } = useReactFlow();

  const captureViewport = useCallback(async (): Promise<string> => {
    const viewport = document.querySelector('.react-flow__viewport') as HTMLElement | null;
    if (!viewport) throw new Error('Viewport not found');
    if (getNodes().length === 0) throw new Error('No nodes to capture');

    return toPng(viewport, {
      cacheBust: true,
      pixelRatio: 3,
      backgroundColor: '#1a1a1a',
      filter: (node) => {
        if (node instanceof Element) {
          if (node.classList.contains('react-flow__controls')) return false;
          if (node.classList.contains('react-flow__minimap')) return false;
        }
        return true;
      },
    });
  }, [getNodes]);

  useEffect(() => {
    const exportPng = async () => {
      if (!activeCase) return;
      const dataUrl = await captureViewport();
      const link = document.createElement('a');
      link.download = `${activeCase.name.replace(/\s+/g, '_')}_graph.png`;
      link.href = dataUrl;
      link.click();
    };

    const exportPdf = async () => {
      if (!activeCase) return;
      const dataUrl = await captureViewport();
      const img = new window.Image();
      img.onload = () => {
        const pdf = new jsPDF({
          orientation: img.width > img.height ? 'landscape' : 'portrait',
          unit: 'mm',
          format: 'a4',
        });
        const pdfW = pdf.internal.pageSize.getWidth();
        const pdfH = pdf.internal.pageSize.getHeight();
        const margin = 10;
        const ratio = img.width / img.height;
        let w = pdfW - margin * 2;
        let h = w / ratio;
        if (h > pdfH - margin * 2) {
          h = pdfH - margin * 2;
          w = h * ratio;
        }
        pdf.addImage(dataUrl, 'PNG', (pdfW - w) / 2, (pdfH - h) / 2, w, h);
        pdf.save(`${activeCase.name.replace(/\s+/g, '_')}_report.pdf`);
      };
      img.src = dataUrl;
    };

    onRegisterExportPng(exportPng);
    onRegisterExportPdf(exportPdf);
  }, [activeCase, captureViewport, onRegisterExportPng, onRegisterExportPdf]);

  return null;
}

export default function App() {
  const {
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
    deleteEdge,
    saveProgress,
    exportCase,
    importCase,
    updateCaseNotes,
  } = useStore();

  const [toolkitOpen, setToolkitOpen] = useState(false);
  const [notePanelOpen, setNotePanelOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const flowWrapperRef = useRef<HTMLDivElement>(null);
  const [exportPngFn, setExportPngFn] = useState<() => Promise<void>>(() => async () => {});
  const [exportPdfFn, setExportPdfFn] = useState<() => Promise<void>>(() => async () => {});

  const selectedNode = (nodes.find((n) => n.id === selectedNodeId) as EntityNodeType | undefined) ?? null;

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const { id, label, notes } = (e as CustomEvent).detail;
      updateNodeData(id, { label, notes });
    };
    const handleDeleteNode = (e: Event) => {
      const { id } = (e as CustomEvent).detail;
      deleteNode(id);
    };
    const handleDeleteEdge = (e: Event) => {
      const { id } = (e as CustomEvent).detail;
      deleteEdge(id);
    };
    const handleExpandNote = (e: Event) => {
      const { id } = (e as CustomEvent).detail;
      setSelectedNodeId(id);
      setNotePanelOpen(true);
    };
    window.addEventListener('entity-update', handleUpdate);
    window.addEventListener('entity-delete', handleDeleteNode);
    window.addEventListener('edge-delete', handleDeleteEdge);
    window.addEventListener('entity-expand-note', handleExpandNote);
    return () => {
      window.removeEventListener('entity-update', handleUpdate);
      window.removeEventListener('entity-delete', handleDeleteNode);
      window.removeEventListener('edge-delete', handleDeleteEdge);
      window.removeEventListener('entity-expand-note', handleExpandNote);
    };
  }, [updateNodeData, deleteNode, deleteEdge]);

  useEffect(() => {
    if (cases.length === 0) {
      const id = createCase('Default Case', '');
      switchCase(id);
    } else if (!activeCaseId) {
      switchCase(cases[0].id);
    }
  }, [cases, activeCaseId, createCase, switchCase]);

  const handleAddEntity = useCallback(
    (type: EntityType, label: string) => addEntity(type, label),
    [addEntity]
  );

  const handleRegisterExportPng = useCallback((fn: () => Promise<void>) => {
    setExportPngFn(() => fn);
  }, []);

  const handleRegisterExportPdf = useCallback((fn: () => Promise<void>) => {
    setExportPdfFn(() => fn);
  }, []);

  const handleEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedEdgeId((prev) => (prev === edge.id ? null : edge.id));
  }, []);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const handlePaneClick = useCallback(() => {
    setSelectedEdgeId(null);
  }, []);

  const handleUpdateEntityNotes = useCallback((nodeId: string, notes: string) => {
    updateNodeData(nodeId, { notes });
  }, [updateNodeData]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedEdgeId) {
        deleteEdge(selectedEdgeId);
        setSelectedEdgeId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEdgeId, deleteEdge]);

  const styledEdges = edges.map((e) => ({
    ...e,
    style: e.id === selectedEdgeId
      ? { stroke: '#ef4444', strokeWidth: 3 }
      : { stroke: '#00c8d4', strokeWidth: 3 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 18,
      height: 18,
      color: e.id === selectedEdgeId ? '#ef4444' : '#00c8d4',
    },
  }));

  const nodeCount = nodes.length;
  const edgeCount = edges.length;
  const entityTypes = new Set(nodes.map((n) => (n.data as EntityData)?.entityType)).size;

  const miniMapNodeColor = useCallback((node: Node) => {
    const data = node.data as EntityData | undefined;
    return data?.color || '#1e3a5f';
  }, []);

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-cyber-black">
      <Sidebar
        cases={cases}
        activeCaseId={activeCaseId}
        onCreateCase={createCase}
        onSwitchCase={switchCase}
        onDeleteCase={deleteCase}
        onAddEntity={handleAddEntity}
        onSaveProgress={saveProgress}
        onExport={exportCase}
        onExportPdf={exportPdfFn}
        onExportPng={exportPngFn}
        onImport={importCase}
      />

      <div className="flex-1 flex flex-col relative">
        {/* Top bar */}
        <div className="h-[60px] flex items-center justify-between px-4 border-b border-cyber-border bg-cyber-dark/80 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <img
              src="/photo_2026-05-04_13-46-20.jpg"
              alt="Zhétikal"
              className="h-11 w-11 rounded-full object-cover object-center mix-blend-lighten flex-shrink-0"
              style={{ filter: 'brightness(1.15) contrast(1.1)' }}
            />
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-cyber-text">
                {activeCase?.name || 'No Case'}
              </span>
              {activeCase && (
                <span className="text-[10px] font-mono text-cyber-text-dim bg-cyber-panel px-2 py-0.5 rounded border border-cyber-border">
                  {nodeCount} entities / {edgeCount} links
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setStatsOpen(!statsOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                statsOpen
                  ? 'bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/30'
                  : 'text-cyber-text-dim hover:bg-cyber-panel border border-transparent'
              }`}
            >
              <Activity size={12} />
              Stats
            </button>

            <button
              onClick={() => setToolkitOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan text-[11px] font-semibold hover:bg-cyber-cyan/20 transition-colors"
            >
              <Ghost size={12} />
              Ghostint-Tools
            </button>
          </div>
        </div>

        {/* Stats overlay */}
        {statsOpen && (
          <div className="absolute top-14 right-4 z-20 w-64 rounded-xl border border-cyber-border bg-cyber-dark/95 backdrop-blur-sm p-4 animate-fade-in">
            <h3 className="text-xs font-semibold text-cyber-text-dim uppercase tracking-wider mb-3">
              Case Statistics
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-cyber-text-dim">Entities</span>
                <span className="text-sm font-mono font-bold text-cyber-cyan">{nodeCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-cyber-text-dim">Connections</span>
                <span className="text-sm font-mono font-bold text-cyber-blue">{edgeCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-cyber-text-dim">Entity Types</span>
                <span className="text-sm font-mono font-bold text-cyber-green">{entityTypes}</span>
              </div>
              <div className="h-px bg-cyber-border my-2" />
              <div className="flex justify-between items-center">
                <span className="text-xs text-cyber-text-dim">Storage</span>
                <span className="text-[10px] font-mono text-cyber-green">Local Only (OPSEC)</span>
              </div>
            </div>
          </div>
        )}

        {/* React Flow canvas */}
        <div className="flex-1 react-flow-canvas-wrapper">
          <ReactFlow
            nodes={nodes}
            edges={styledEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onEdgeClick={handleEdgeClick}
            onNodeClick={handleNodeClick}
            onPaneClick={handlePaneClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            deleteKeyCode={null}
            fitView
            defaultEdgeOptions={{
              type: 'custom',
              animated: false,
              style: { stroke: '#00c8d4', strokeWidth: 3 },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 18,
                height: 18,
                color: '#00c8d4',
              },
            }}
            proOptions={{ hideAttribution: true }}
            className="bg-cyber-black"
          >
            <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#1e3a5f" />
            <Controls
              showInteractive={false}
              className="!border-cyber-border !rounded-xl !overflow-hidden"
            />
            <MiniMap
              nodeColor={miniMapNodeColor}
              maskColor="rgba(10, 14, 23, 0.8)"
              className="!border-cyber-border !rounded-xl"
            />
            <FlowExporter
              activeCase={activeCase}
              onRegisterExportPng={handleRegisterExportPng}
              onRegisterExportPdf={handleRegisterExportPdf}
            />
          </ReactFlow>
        </div>

        {/* Status bar */}
        <div className="h-7 flex items-center justify-between px-4 border-t border-cyber-border bg-cyber-dark/80 text-[10px] font-mono text-cyber-text-dim">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyber-green animate-pulse" />
              OPSEC: Local Storage Only
            </span>
            <span>|</span>
            <span>Zhétikal OSINT Case Tracker v2.0</span>
          </div>
          <span>
            {new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
      </div>

      <ToolkitPanel isOpen={toolkitOpen} onClose={() => setToolkitOpen(false)} />

      {notePanelOpen && (
        <NotePanel
          selectedNode={selectedNode}
          caseNotes={activeCase?.caseNotes ?? ''}
          caseTitle={activeCase?.caseTitle ?? ''}
          onUpdateEntityNotes={handleUpdateEntityNotes}
          onUpdateCaseNotes={updateCaseNotes}
          onUpdateCaseTitle={updateCaseTitle}
          onClose={() => setNotePanelOpen(false)}
        />
      )}
    </div>
  );
}
