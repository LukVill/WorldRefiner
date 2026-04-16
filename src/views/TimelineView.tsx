import React, { useEffect, useRef, useState } from 'react';
import { Plus, GripHorizontal, BookOpen } from 'lucide-react';
import { useWorldStore } from '../store/worldStore';
import { useUIStore } from '../store/uiStore';
import { WorldNode } from '../types';
import { NodeBadge } from '../components/shared/NodeBadge';
import { nodeDefaults } from '../utils/nodeDefaults';
import { renderMarkdown } from '../utils/markdownRenderer';

// ── Emoji dominant-color extraction (cached, synchronous) ────────────────────
const emojiColorCache = new Map<string, string>();

function computeEmojiColor(emoji: string): string {
  const FALLBACK = '#888';
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) return FALLBACK;
    ctx.clearRect(0, 0, 64, 64);
    ctx.font = '48px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 32, 32);
    const { data } = ctx.getImageData(0, 0, 64, 64);
    const counts = new Map<string, number>();
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 80) continue;
      const r = Math.round(data[i] / 24) * 24;
      const g = Math.round(data[i + 1] / 24) * 24;
      const b = Math.round(data[i + 2] / 24) * 24;
      if (r > 215 && g > 215 && b > 215) continue; // near-white
      if (r < 25 && g < 25 && b < 25) continue;    // near-black
      const key = `${r},${g},${b}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    if (counts.size === 0) return FALLBACK;
    let best = FALLBACK, max = 0;
    counts.forEach((n, key) => {
      if (n > max) {
        max = n;
        const [r, g, b] = key.split(',').map(Number);
        best = `rgb(${r},${g},${b})`;
      }
    });
    return best;
  } catch {
    return FALLBACK;
  }
}

function getEmojiColor(emoji: string): string {
  if (!emoji) return 'var(--color-event)';
  const cached = emojiColorCache.get(emoji);
  if (cached) return cached;
  const color = computeEmojiColor(emoji);
  emojiColorCache.set(emoji, color);
  return color;
}

// ── Sort events ──────────────────────────────────────────────────────────────
function sortEvents(events: WorldNode[]): WorldNode[] {
  return [...events].sort((a, b) => {
    const aHas = a.timelineOrder !== undefined;
    const bHas = b.timelineOrder !== undefined;
    if (aHas && bHas) return a.timelineOrder! - b.timelineOrder!;
    if (aHas) return -1;
    if (bHas) return 1;
    return a.metadata.createdAt.localeCompare(b.metadata.createdAt);
  });
}

// ── Layout constants ─────────────────────────────────────────────────────────
const CARD_W           = 200;
const CARD_GAP         = 44;
const PAD_X            = 56;
const DOT_SIZE         = 14;
const CONNECTOR_H      = 26;
const DOT_MARGIN_BOT   = 20;  // dot's marginBottom inside column
// Line sits at dot center: bottom = DOT_MARGIN_BOT + DOT_SIZE/2 - 1
const LINE_BOTTOM      = DOT_MARGIN_BOT + DOT_SIZE / 2 - 1; // 26 px

// ── Component ────────────────────────────────────────────────────────────────
export function TimelineView() {
  const world               = useWorldStore(s => s.world);
  const createNode          = useWorldStore(s => s.createNode);
  const reorderTimelineNodes = useWorldStore(s => s.reorderTimelineNodes);
  const setActiveNode       = useUIStore(s => s.setActiveNode);
  const setActiveView       = useUIStore(s => s.setActiveView);
  const addToast            = useUIStore(s => s.addToast);

  const [orderedEvents, setOrderedEvents] = useState<WorldNode[]>([]);
  const [dragIndex, setDragIndex]         = useState<number | null>(null);
  const [dropIndex, setDropIndex]         = useState<number | null>(null);
  const [mousePos, setMousePos]           = useState<{ x: number; y: number } | null>(null);

  const scrollRef       = useRef<HTMLDivElement>(null);
  const cardRefs        = useRef<(HTMLDivElement | null)[]>([]);
  const isDraggingRef   = useRef(false);
  // Stable refs so the doc-level listeners never go stale
  const dragIndexRef    = useRef<number | null>(null);
  const dropIndexRef    = useRef<number | null>(null);
  const eventsRef       = useRef<WorldNode[]>([]);

  dragIndexRef.current  = dragIndex;
  dropIndexRef.current  = dropIndex;
  eventsRef.current     = orderedEvents;

  // Rebuild sorted list on node changes
  useEffect(() => {
    if (!world) { setOrderedEvents([]); return; }
    setOrderedEvents(sortEvents(Object.values(world.nodes).filter(n => n.type === 'event')));
  }, [world?.nodes]);

  // Mouse-wheel → horizontal scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      el.scrollLeft += e.deltaY !== 0 ? e.deltaY : e.deltaX;
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  // Document-level drag listeners (no deps – all mutable state via refs)
  useEffect(() => {
    const getDropIdx = (mouseX: number): number => {
      for (let i = 0; i < cardRefs.current.length; i++) {
        const rect = cardRefs.current[i]?.getBoundingClientRect();
        if (!rect) continue;
        if (mouseX < rect.left + rect.width / 2) return i;
      }
      return cardRefs.current.length;
    };

    const onMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      setMousePos({ x: e.clientX, y: e.clientY });
      setDropIndex(getDropIdx(e.clientX));
    };

    const onUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      const d = dragIndexRef.current;
      const t = dropIndexRef.current;
      if (d !== null && t !== null && t !== d && t !== d + 1) {
        const newOrder = [...eventsRef.current];
        const [moved] = newOrder.splice(d, 1);
        newOrder.splice(t > d ? t - 1 : t, 0, moved);
        setOrderedEvents(newOrder);
        reorderTimelineNodes(newOrder.map(e => e.id));
      }
      setDragIndex(null);
      setDropIndex(null);
      setMousePos(null);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [reorderTimelineNodes]);

  const handleGripDown = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    isDraggingRef.current = true;
    setDragIndex(index);
    setDropIndex(index);
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleCreateEvent = () => {
    const node = createNode('event');
    setActiveNode(node.id);
    setActiveView('wiki');
    addToast('New event created', 'success');
  };

  // Drop-indicator position (fixed / viewport coords)
  const scrollEl   = scrollRef.current;
  const scrollRect = scrollEl?.getBoundingClientRect();

  const dropIndicatorX = (() => {
    if (dragIndex === null || dropIndex === null || !scrollEl) return null;
    if (dropIndex < cardRefs.current.length) {
      const r = cardRefs.current[dropIndex]?.getBoundingClientRect();
      return r ? r.left - CARD_GAP / 2 : null;
    }
    const r = cardRefs.current[cardRefs.current.length - 1]?.getBoundingClientRect();
    return r ? r.right + CARD_GAP / 2 : null;
  })();

  if (!world) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
        No world loaded.
      </div>
    );
  }

  const draggedEvent = dragIndex !== null ? orderedEvents[dragIndex] : null;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--color-background)', overflow: 'hidden' }}>

      {/* ── Header (full-width, New Event flushed right) ── */}
      <div style={{
        width: '100%', boxSizing: 'border-box',
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 16px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        flexShrink: 0,
      }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text)', fontFamily: 'var(--font-heading)' }}>
          Timeline
        </span>
        <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
          {orderedEvents.length} event{orderedEvents.length !== 1 ? 's' : ''} · drag to reorder
        </span>
        <div style={{ flex: 1 }} />
        <button
          onClick={handleCreateEvent}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '6px 12px', border: 'none', cursor: 'pointer',
            borderRadius: 'var(--radius)',
            background: 'var(--color-primary)', color: 'var(--color-primary-foreground)',
            fontSize: 13, fontWeight: 500,
          }}
        >
          <Plus size={13} /> New Event
        </button>
      </div>

      {/* ── Horizontal timeline ── */}
      <div
        ref={scrollRef}
        style={{
          flex: 1, overflowX: 'auto', overflowY: 'hidden',
          position: 'relative',
          userSelect: 'none',
          cursor: dragIndex !== null ? 'grabbing' : 'default',
        }}
      >
        {orderedEvents.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, color: 'var(--color-text-muted)' }}>
            <span style={{ fontSize: 36 }}>{nodeDefaults.event.icon}</span>
            <p style={{ fontSize: 14, margin: 0 }}>No events yet.</p>
            <button
              onClick={handleCreateEvent}
              style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
                borderRadius: 'var(--radius)', border: 'none', cursor: 'pointer',
                background: 'var(--color-primary)', color: 'var(--color-primary-foreground)', fontSize: 13,
              }}
            >
              <Plus size={13} /> Create first event
            </button>
          </div>
        ) : (
          <div style={{
            display: 'flex', flexDirection: 'row', alignItems: 'stretch',
            height: '100%', minWidth: 'max-content',
            paddingLeft: PAD_X, paddingRight: PAD_X,
            boxSizing: 'border-box',
            position: 'relative',
          }}>
            {/* Horizontal timeline line — behind dots */}
            <div style={{
              position: 'absolute', left: 0, right: 0,
              bottom: LINE_BOTTOM, height: 2,
              background: 'var(--color-border)', zIndex: 0,
            }} />

            {orderedEvents.map((event, index) => {
              const icon   = event.metadata.icon || nodeDefaults.event.icon;
              const color  = getEmojiColor(icon);
              const isDragged = dragIndex === index;
              const connections = world.edges.filter(
                e => e.source === event.id || e.target === event.id
              ).length;

              return (
                <div
                  key={event.id}
                  ref={el => { cardRefs.current[index] = el; }}
                  style={{
                    width: CARD_W, flexShrink: 0,
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    paddingTop: 20,
                    marginRight: index < orderedEvents.length - 1 ? CARD_GAP : 0,
                    opacity: isDragged ? 0.18 : 1,
                    transition: 'opacity 0.12s',
                  }}
                >
                  {/* Grip handle */}
                  <div
                    onMouseDown={e => handleGripDown(e, index)}
                    style={{
                      cursor: 'grab', marginBottom: 8,
                      display: 'flex', alignItems: 'center',
                      padding: '2px 6px', borderRadius: 4,
                      color: 'var(--color-text-muted)', opacity: 0.55,
                    }}
                    title="Drag to reorder"
                  >
                    <GripHorizontal size={14} />
                  </div>

                  {/* Card */}
                  <div style={{
                    width: '100%', flex: 1, minHeight: 80,
                    overflow: 'hidden', boxSizing: 'border-box',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderTop: `3px solid ${color}`,
                    borderRadius: 'var(--radius)',
                    padding: '10px 12px',
                    display: 'flex', flexDirection: 'column', gap: 6,
                  }}>
                    {/* Icon + title + wiki button */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>{icon}</span>
                      <span style={{
                        fontSize: 12, fontWeight: 600,
                        color: 'var(--color-text)', fontFamily: 'var(--font-heading)',
                        flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {event.title}
                      </span>
                      <button
                        onClick={() => { setActiveNode(event.id); setActiveView('wiki'); }}
                        style={{
                          flexShrink: 0, background: 'transparent', border: 'none',
                          cursor: 'pointer', color: 'var(--color-text-muted)',
                          opacity: 0.6, lineHeight: 0, padding: 2, borderRadius: 4,
                        }}
                        title="Open in Wiki"
                      >
                        <BookOpen size={12} />
                      </button>
                    </div>

                    {/* Markdown content (clipped with fade) */}
                    {event.content && (
                      <div
                        className="timeline-card-content"
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(event.content, world.nodes) }}
                        style={{
                          flex: 1,
                          minHeight: 0,
                          overflow: 'hidden',
                          maskImage: 'linear-gradient(to bottom, black 55%, transparent 100%)',
                          WebkitMaskImage: 'linear-gradient(to bottom, black 55%, transparent 100%)',
                        }}
                      />
                    )}

                    {/* Footer */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', marginTop: 'auto' }}>
                      <NodeBadge type="event" />
                      {connections > 0 && (
                        <span style={{ fontSize: 10, color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
                          {connections} link{connections !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Connector — colored, faded */}
                  <div style={{ width: 2, height: CONNECTOR_H, background: color, opacity: 0.45, flexShrink: 0 }} />

                  {/* Dot — in front of the line (zIndex: 2) */}
                  <div style={{
                    width: DOT_SIZE, height: DOT_SIZE,
                    borderRadius: '50%',
                    background: color,
                    border: '2.5px solid var(--color-background)',
                    boxShadow: `0 0 0 2px ${color}`,
                    position: 'relative', zIndex: 2,
                    flexShrink: 0,
                    marginBottom: DOT_MARGIN_BOT,
                  }} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Drop indicator — fixed, viewport coords */}
      {dropIndicatorX !== null && scrollRect && (
        <div style={{
          position: 'fixed',
          left: dropIndicatorX - 1.5,
          top: scrollRect.top,
          height: scrollRect.height,
          width: 3,
          background: 'var(--color-primary)',
          zIndex: 1000, pointerEvents: 'none', borderRadius: 2, opacity: 0.85,
        }} />
      )}

      {/* Ghost card following cursor */}
      {dragIndex !== null && mousePos && draggedEvent && (() => {
        const gIcon  = draggedEvent.metadata.icon || nodeDefaults.event.icon;
        const gColor = getEmojiColor(gIcon);
        return (
          <div style={{
            position: 'fixed',
            left: mousePos.x - CARD_W / 2,
            top: mousePos.y - 70,
            width: CARD_W - 8,
            pointerEvents: 'none', zIndex: 999,
            opacity: 0.75,
            transform: 'rotate(-2deg) scale(1.04)',
            filter: 'drop-shadow(0 8px 18px rgba(0,0,0,0.28))',
          }}>
            <div style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderTop: `3px solid ${gColor}`,
              borderRadius: 'var(--radius)',
              padding: '10px 12px',
              display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20, lineHeight: 1 }}>{gIcon}</span>
                <span style={{
                  fontSize: 12, fontWeight: 600,
                  color: 'var(--color-text)', fontFamily: 'var(--font-heading)',
                  flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {draggedEvent.title}
                </span>
              </div>
              {draggedEvent.content && (
                <div
                  className="timeline-card-content"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(draggedEvent.content, world.nodes) }}
                  style={{
                    overflow: 'hidden',
                    maxHeight: 46,
                    maskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)',
                  }}
                />
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
