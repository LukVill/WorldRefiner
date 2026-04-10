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

function GraphCanvasInner({ onNodeClick }: GraphCanvasProps) {
  const world = useWorldStore(s => s.world);
  const updateNode = useWorldStore(s => s.updateNode);
  const createEdge = useWorldStore(s => s.createEdge);
  const graphTypeFilter = useUIStore(s => s.graphTypeFilter);
  const graphFocusNodeId = useUIStore(s => s.graphFocusNodeId);
  const setGraphFocus = useUIStore(s => s.setGraphFocus);
  const { fitView, setCenter } = useReactFlow();

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [edgeCreation, setEdgeCreation] = useState<EdgeCreationState>({ sourceId: null });
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [edgeLabelInput, setEdgeLabelInput] = useState('');
  const [edgeLabelPos, setEdgeLabelPos] = useState<{ x: number; y: number; targetId: string } | null>(null);
  const layoutDoneRef = useRef(false);

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
    setNodes(newNodes);
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

  const handleNodeChange = useCallback((changes: NodeChange[]) => {
    setNodes(nds => applyNodeChanges(changes, nds));
  }, []);

  const handleNodeDragStop = useCallback((_event: React.MouseEvent, node: Node) => {
    updateNode(node.id, { graphPosition: node.position });
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

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setEdgeCreation({ sourceId: null });
      setEdgeLabelPos(null);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <GraphHoverContext.Provider value={hoveredNodeId}>
    <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%', cursor: edgeCreation.sourceId ? 'crosshair' : 'default', minHeight: 0 }}>
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
