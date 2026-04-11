import React, { useCallback, useEffect, useState, useRef } from 'react';
import ReactFlow, {
  Node, Edge, NodeChange, EdgeChange,
  applyNodeChanges, applyEdgeChanges,
  Background,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useWorldStore } from '../../store/worldStore';
import { useUIStore } from '../../store/uiStore';
import { computeDagreLayout } from '../../utils/graphLayout';
import { GraphNode } from './GraphNode';
import { GraphEdge } from './GraphEdge';
import { GraphHoverContext } from './GraphHoverContext';
import { WorldNode } from '../../types';

const nodeTypes = { worldNode: GraphNode };
const edgeTypes = { worldEdge: GraphEdge };

interface GraphCanvasProps {
  onNodeClick: (nodeId: string) => void;
}

interface EdgeCreationState {
  sourceId: string | null;
}

interface SelectionRect {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

function GraphCanvasInner({ onNodeClick }: GraphCanvasProps) {
  const world = useWorldStore(s => s.world);
  const updateNode = useWorldStore(s => s.updateNode);
  const deleteNode = useWorldStore(s => s.deleteNode);
  const createEdge = useWorldStore(s => s.createEdge);
  const graphTypeFilter = useUIStore(s => s.graphTypeFilter);
  const graphFocusNodeId = useUIStore(s => s.graphFocusNodeId);
  const setGraphFocus = useUIStore(s => s.setGraphFocus);
  const { fitView, setCenter, project } = useReactFlow();

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [edgeCreation, setEdgeCreation] = useState<EdgeCreationState>({ sourceId: null });
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [edgeLabelInput, setEdgeLabelInput] = useState('');
  const [edgeLabelPos, setEdgeLabelPos] = useState<{ x: number; y: number; targetId: string } | null>(null);
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);
  const layoutDoneRef = useRef(false);
  const isSelectingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  // Stable refs to avoid stale closures in document-level listeners
  const nodesRef = useRef<Node[]>(nodes);
  nodesRef.current = nodes;
  const projectRef = useRef(project);
  projectRef.current = project;
  const edgeCreationRef = useRef(edgeCreation);
  edgeCreationRef.current = edgeCreation;

  const buildNodes = useCallback(() => {
    if (!world) return [];
    const worldNodes = Object.values(world.nodes).filter(
      n => graphTypeFilter.length === 0 || !graphTypeFilter.includes(n.type)
    );

    let positions: Record<string, { x: number; y: number }> = {};
    const needsLayout = worldNodes.some(n => !n.graphPosition);

    if (needsLayout && !layoutDoneRef.current) {
      // Initial layout: use Dagre for the full graph
      positions = computeDagreLayout(worldNodes, world.edges);
      layoutDoneRef.current = true;
      worldNodes.forEach(n => {
        if (!n.graphPosition && positions[n.id]) {
          updateNode(n.id, { graphPosition: positions[n.id] });
        }
      });
    } else if (needsLayout) {
      // New nodes added after initial layout — place near the center of existing nodes
      const positioned = worldNodes.filter(n => n.graphPosition);
      const cx = positioned.length > 0
        ? positioned.reduce((s, n) => s + n.graphPosition!.x, 0) / positioned.length
        : 0;
      const cy = positioned.length > 0
        ? positioned.reduce((s, n) => s + n.graphPosition!.y, 0) / positioned.length
        : 0;
      const unpositioned = worldNodes.filter(n => !n.graphPosition);
      unpositioned.forEach((n, i) => {
        const pos = { x: cx + (i - (unpositioned.length - 1) / 2) * 220, y: cy + 160 };
        positions[n.id] = pos;
        updateNode(n.id, { graphPosition: pos });
      });
    }

    return worldNodes.map(n => ({
      id: n.id,
      type: 'worldNode',
      position: n.graphPosition ?? positions[n.id] ?? { x: 0, y: 0 },
      data: n,
      selected: false,
    }));
  }, [world, graphTypeFilter, updateNode]);

  const buildEdges = useCallback(() => {
    if (!world) return [];
    const visibleNodeIds = new Set(nodes.map(n => n.id));
    const seen = new Set<string>();
    const result: Edge[] = [];

    for (const e of world.edges) {
      if (!visibleNodeIds.has(e.source) || !visibleNodeIds.has(e.target)) continue;
      // Deduplicate: use a canonical key so A→B and B→A map to the same slot
      const pairKey = [e.source, e.target].sort().join('::');
      if (seen.has(pairKey)) continue;
      seen.add(pairKey);

      const reverse = world.edges.find(r => r.source === e.target && r.target === e.source);
      const effectiveType = (e.type === 'bidirectional' || reverse) ? 'bidirectional' : e.type;
      result.push({
        id: e.id,
        source: e.source,
        target: e.target,
        type: 'worldEdge',
        data: { label: e.label, type: effectiveType },
        animated: false,
      });
    }

    return result;
  }, [world, nodes]);

  useEffect(() => {
    const newNodes = buildNodes();
    // Preserve selection state across world rebuilds (e.g. after drag saves position)
    setNodes(prev => {
      const selectedIds = new Set(prev.filter(n => n.selected).map(n => n.id));
      return newNodes.map(n => ({ ...n, selected: selectedIds.has(n.id) }));
    });
  }, [world?.nodes, graphTypeFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setEdges(buildEdges());
  }, [world?.edges, nodes]); // eslint-disable-line react-hooks/exhaustive-deps

  // Focus a node when graphFocusNodeId changes
  useEffect(() => {
    if (graphFocusNodeId) {
      const node = nodes.find(n => n.id === graphFocusNodeId);
      if (node) {
        setCenter(node.position.x + 80, node.position.y + 28, { zoom: 1.5, duration: 500 });
      }
      setGraphFocus(null);
    }
  }, [graphFocusNodeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Document-level mouse handlers for right-click drag selection
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isSelectingRef.current) return;
      setSelectionRect(prev => prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null);
    };

    const handleMouseUp = (_e: MouseEvent) => {
      if (!isSelectingRef.current) return;
      isSelectingRef.current = false;

      setSelectionRect(prev => {
        if (!prev) return null;

        const minX = Math.min(prev.startX, prev.currentX);
        const maxX = Math.max(prev.startX, prev.currentX);
        const minY = Math.min(prev.startY, prev.currentY);
        const maxY = Math.max(prev.startY, prev.currentY);

        // Ignore tiny drags (treat as accidental right-click)
        if (maxX - minX < 5 && maxY - minY < 5) return null;

        // Convert screen coordinates to flow coordinates via the RF container rect
        const containerRect = containerRef.current?.getBoundingClientRect();
        if (!containerRect) return null;

        const topLeft = projectRef.current({ x: minX - containerRect.left, y: minY - containerRect.top });
        const bottomRight = projectRef.current({ x: maxX - containerRect.left, y: maxY - containerRect.top });

        // Select nodes whose bounding box overlaps the selection rectangle
        setNodes(nds => nds.map(n => ({
          ...n,
          selected:
            n.position.x + 160 >= topLeft.x &&
            n.position.x <= bottomRight.x &&
            n.position.y + 56 >= topLeft.y &&
            n.position.y <= bottomRight.y,
        })));

        return null;
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleContainerMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 2) return;
    if (edgeCreationRef.current.sourceId) return;
    // Only start selection when clicking on the empty canvas, not on a node
    const isOnNode = (e.target as HTMLElement).closest('.react-flow__node') !== null;
    if (isOnNode) return;

    e.preventDefault();
    isSelectingRef.current = true;
    setSelectionRect({ startX: e.clientX, startY: e.clientY, currentX: e.clientX, currentY: e.clientY });
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    // Suppress the browser context menu so right-click drag feels clean
    e.preventDefault();
  }, []);

  const handleNodeChange = useCallback((changes: NodeChange[]) => {
    setNodes(nds => applyNodeChanges(changes, nds));
  }, []);

  const handleNodeDragStop = useCallback((_event: React.MouseEvent, node: Node) => {
    // Always save the primary dragged node first
    updateNode(node.id, { graphPosition: node.position });
    // Also persist all other selected nodes — nodesRef has the correct
    // post-drag positions that React Flow updated via onNodesChange during the drag.
    // Doing this here (rather than in onSelectionDragStop) ensures positions are
    // saved before the world rebuild triggered by the updateNode call above.
    const otherSelected = nodesRef.current.filter(n => n.selected && n.id !== node.id);
    otherSelected.forEach(n => updateNode(n.id, { graphPosition: n.position }));
  }, [updateNode]);

  const handleEdgeChange = useCallback((changes: EdgeChange[]) => {
    setEdges(eds => applyEdgeChanges(changes, eds));
  }, []);

  const handleNodeClickInternal = useCallback((e: React.MouseEvent, node: Node) => {
    if (edgeCreation.sourceId) {
      if (node.id !== edgeCreation.sourceId) {
        setEdgeLabelPos({ x: e.clientX, y: e.clientY, targetId: node.id });
      }
      return;
    }
    onNodeClick(node.id);
  }, [edgeCreation.sourceId, onNodeClick]);

  const handleCreateEdgeConfirm = () => {
    if (!edgeCreation.sourceId || !edgeLabelPos) return;
    createEdge(edgeCreation.sourceId, edgeLabelPos.targetId, edgeLabelInput || undefined);
    setEdgeCreation({ sourceId: null });
    setEdgeLabelInput('');
    setEdgeLabelPos(null);
  };

  const handleNodeMouseEnter = useCallback((_event: React.MouseEvent, node: Node) => {
    setHoveredNodeId(node.id);
  }, []);

  const handleNodeMouseLeave = useCallback(() => {
    setHoveredNodeId(null);
  }, []);

  const handleDeleteSelected = useCallback(() => {
    const selectedIds = nodesRef.current.filter(n => n.selected).map(n => n.id);
    selectedIds.forEach(id => deleteNode(id));
  }, [deleteNode]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setEdgeCreation({ sourceId: null });
      setEdgeLabelPos(null);
    }
    if (e.key === 'Delete') {
      handleDeleteSelected();
    }
  }, [handleDeleteSelected]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const selectedCount = nodes.filter(n => n.selected).length;

  return (
    <GraphHoverContext.Provider value={hoveredNodeId}>
    <div
      ref={containerRef}
      style={{ flex: 1, position: 'relative', width: '100%', height: '100%', cursor: edgeCreation.sourceId ? 'crosshair' : 'default', minHeight: 0 }}
      onMouseDown={handleContainerMouseDown}
      onContextMenu={handleContextMenu}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={handleNodeChange}
        onNodeDragStop={handleNodeDragStop}
        onEdgesChange={handleEdgeChange}
        onNodeClick={handleNodeClickInternal}
        onNodeMouseEnter={handleNodeMouseEnter}
        onNodeMouseLeave={handleNodeMouseLeave}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.05}
        maxZoom={3}
        deleteKeyCode={null}
        proOptions={{ hideAttribution: true }}
        style={{ background: 'var(--color-background)' }}
      >
        <Background color="var(--color-border)" gap={24} size={1} />
      </ReactFlow>

      {/* Right-click drag selection rectangle */}
      {selectionRect && (() => {
        const left = Math.min(selectionRect.startX, selectionRect.currentX);
        const top = Math.min(selectionRect.startY, selectionRect.currentY);
        const width = Math.abs(selectionRect.currentX - selectionRect.startX);
        const height = Math.abs(selectionRect.currentY - selectionRect.startY);
        return (
          <div
            style={{
              position: 'fixed',
              left,
              top,
              width,
              height,
              border: '1.5px solid var(--color-primary)',
              background: 'color-mix(in srgb, var(--color-primary) 12%, transparent)',
              pointerEvents: 'none',
              zIndex: 10,
              borderRadius: 2,
            }}
          />
        );
      })()}

      {/* Floating toolbar when nodes are selected */}
      {selectedCount > 0 && !selectionRect && (
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            padding: '5px 10px 5px 12px',
            fontSize: 12,
            color: 'var(--color-text-muted)',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            userSelect: 'none',
          }}
        >
          <span>{selectedCount} node{selectedCount !== 1 ? 's' : ''} selected · drag to move</span>
          <button
            onClick={handleDeleteSelected}
            style={{
              background: 'var(--color-destructive, #ef4444)',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              padding: '2px 9px',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            Delete
          </button>
        </div>
      )}

      {edgeLabelPos && (
        <div
          className="fixed z-50 rounded-lg p-3 shadow-xl"
          style={{ left: edgeLabelPos.x, top: edgeLabelPos.y, background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <div className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>Edge label (optional)</div>
          <input
            autoFocus
            type="text"
            value={edgeLabelInput}
            onChange={e => setEdgeLabelInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleCreateEdgeConfirm();
              if (e.key === 'Escape') { setEdgeLabelPos(null); setEdgeCreation({ sourceId: null }); }
            }}
            className="text-sm outline-none bg-transparent border-b w-40"
            style={{ color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
            placeholder="e.g. ally of"
          />
          <div className="flex gap-2 mt-2">
            <button onClick={handleCreateEdgeConfirm} className="text-xs px-2 py-1 rounded" style={{ background: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}>
              Create
            </button>
            <button onClick={() => { setEdgeLabelPos(null); setEdgeCreation({ sourceId: null }); }} className="text-xs px-2 py-1 rounded" style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-muted)' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
    </GraphHoverContext.Provider>
  );
}

export function GraphCanvas({ onNodeClick }: GraphCanvasProps) {
  return <GraphCanvasInner onNodeClick={onNodeClick} />;
}
