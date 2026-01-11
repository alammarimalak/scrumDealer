import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import './PertDiagram.css';

const PertDiagram = forwardRef(({ results = [] }, ref) => {
  const containerRef = useRef(null);

  useImperativeHandle(ref, () => ({
    getElement: () => containerRef.current
  }));

  if (!results || results.length === 0) return null;

  // --- Configuration ---
  const NODE_RADIUS = 60;
  const LEVEL_SPACING = 280;
  const VERTICAL_SPACING = 200; // Increased to give Task E more room
  const START_X = 100;
  const START_Y = 300;

  const normalizePreds = (preds) =>
    (Array.isArray(preds) ? preds : [preds])
      .map(p => (typeof p === 'string' ? p.trim() : p))
      .filter(p => p && p !== '-' && p !== '0');

  const taskMap = new Map(results.map(t => [t.id, t]));

  /** 1. GRAPH BUILDING **/
  const buildEventGraph = () => {
    let eventCounter = 1;
    const eventsByKey = new Map();
    const connections = [];

    const getOrCreateEvent = (key) => {
      if (eventsByKey.has(key)) return eventsByKey.get(key);
      const id = key === 'START' ? 'START' : key === 'FINISH' ? 'FINISH' : `EV${eventCounter++}`;
      const ev = { id, key };
      eventsByKey.set(key, ev);
      return ev;
    };

    const assigned = new Set();
    let iter = 0;

    while (assigned.size < results.length && iter++ < results.length * 2) {
      for (const task of results) {
        if (assigned.has(task.id)) continue;
        const preds = normalizePreds(task.predecessors);
        const predsReady = preds.every(pid => taskMap.has(pid) && taskMap.get(pid)._toEventId);
        if (!predsReady && preds.length > 0) continue;

        let fromId = 'START';
        if (preds.length > 0) {
          fromId = taskMap.get(preds[0])._toEventId;
        } else {
          getOrCreateEvent('START');
        }

        const successors = results.filter(r => normalizePreds(r.predecessors).includes(task.id));
        let toId;
        if (successors.length > 0) {
          const succKey = "TO_" + successors.map(s => s.id).sort().join("_");
          toId = getOrCreateEvent(succKey).id;
        } else {
          toId = getOrCreateEvent('FINISH').id;
        }

        task._fromEventId = fromId;
        task._toEventId = toId;
        connections.push({ from: fromId, to: toId, taskId: task.id, duration: task.duration, task });
        assigned.add(task.id);
      }
    }
    return { events: Array.from(eventsByKey.values()), connections };
  };

  const { events, connections } = buildEventGraph();

  /** 2. LAYOUT POSITIONS **/
  const calculateEventPositions = () => {
    const positions = {};
    const levels = new Map();
    const queue = [{ id: 'START', lvl: 0 }];
    const visited = new Set(['START']);

    while (queue.length > 0) {
      const { id, lvl } = queue.shift();
      if (!levels.has(lvl)) levels.set(lvl, []);
      levels.get(lvl).push(id);
      connections.filter(c => c.from === id).forEach(c => {
        if (!visited.has(c.to)) {
          visited.add(c.to);
          queue.push({ id: c.to, lvl: lvl + 1 });
        }
      });
    }

    levels.forEach((ids, lvl) => {
      const height = (ids.length - 1) * VERTICAL_SPACING;
      ids.forEach((id, idx) => {
        positions[id] = {
          x: START_X + lvl * LEVEL_SPACING,
          y: START_Y + (idx * VERTICAL_SPACING) - height / 2
        };
      });
    });
    return positions;
  };

  const eventPositions = calculateEventPositions();

  /** 3. CALCULATION DATA **/
  const getEventData = (eventId) => {
    if (eventId === 'START') return { es: 0, lf: 0 };
    const incoming = connections.filter(c => c.to === eventId);
    const es = incoming.length > 0 ? Math.max(...incoming.map(c => c.task?.EF || 0)) : 0;
    const outgoing = connections.filter(c => c.from === eventId);
    const lf = outgoing.length > 0 ? Math.min(...outgoing.map(c => c.task?.LS || es)) : es;
    return { es, lf };
  };

  const maxX = Math.max(...Object.values(eventPositions).map(p => p.x)) + 200;

  return (
    <div className="pert-diagram-container">
      <h3>PERT Diagram</h3>
      <div className="pert-diagram-wrapper">
        <svg ref={containerRef} viewBox={`0 0 ${maxX} 700`} className="pert-svg">
          {/* ARROWS */}
          {connections.map((conn, i) => {
            const fromPos = eventPositions[conn.from];
            const toPos = eventPositions[conn.to];
            if (!fromPos || !toPos) return null;

            const dx = toPos.x - fromPos.x;
            const dy = toPos.y - fromPos.y;
            const angle = Math.atan2(dy, dx);
            const startX = fromPos.x + NODE_RADIUS * Math.cos(angle);
            const startY = fromPos.y + NODE_RADIUS * Math.sin(angle);
            const endX = toPos.x - NODE_RADIUS * Math.cos(angle);
            const endY = toPos.y - NODE_RADIUS * Math.sin(angle);

            // Critical logic
            const isCritical = conn.task && (conn.task.float === 0 || conn.task.isCritical || conn.task.ES === conn.task.LS);
            const lineClass = isCritical ? "connection-line critical-path" : "connection-line";
            const arrowClass = isCritical ? "arrow-head critical-path" : "arrow-head";

            // VISIBILITY FIX FOR TASK E:
            // If the arrow is mostly vertical (abs(dy) > abs(dx)), move label to the side (X offset)
            // If it's horizontal, move it up (Y offset)
            const isVertical = Math.abs(dy) > Math.abs(dx);
            const labelX = (startX + endX) / 2 + (isVertical ? 15 : 0);
            const labelY = (startY + endY) / 2 + (isVertical ? 0 : -15);

            return (
              <g key={`conn-${i}`} className="connection-group">
                <line x1={startX} y1={startY} x2={endX} y2={endY} className={lineClass} />
                <polygon
                  points="0,0 -12,6 -12,-6"
                  className={arrowClass}
                  transform={`translate(${endX},${endY}) rotate(${(angle * 180) / Math.PI})`}
                />
                <text x={labelX} y={labelY} textAnchor={isVertical ? "start" : "middle"} className="connection-label">
                  {conn.taskId} ({conn.duration})
                </text>
              </g>
            );
          })}

          {/* NODES (SWAPPED CONTENT) */}
          {events.map((event, index) => {
            const pos = eventPositions[event.id];
            if (!pos) return null;
            const { es, lf } = getEventData(event.id);
            const isCriticalNode = (es === lf);

            return (
              <g key={event.id} className="node-group">
                <circle
                  cx={pos.x} cy={pos.y} r={NODE_RADIUS}
                  className={`node-circle ${isCriticalNode ? 'critical-node' : ''} ${
                    event.id === 'START' || event.id === 'FINISH' ? 'milestone-node' : ''
                  }`}
                />
                {/* Horizontal Divider */}
                <line x1={pos.x - NODE_RADIUS} y1={pos.y} x2={pos.x + NODE_RADIUS} y2={pos.y} className="node-divider" />
                {/* Vertical Divider (NOW IN TOP HALF) */}
                <line x1={pos.x} y1={pos.y} x2={pos.x} y2={pos.y - NODE_RADIUS} className="node-divider" />
                
                {/* TOP HALF: Calculations (ES on left, LF on right) */}
                <text x={pos.x - 25} y={pos.y - 25} textAnchor="middle" className="node-date node-es">{es}</text>
                <text x={pos.x + 25} y={pos.y - 25} textAnchor="middle" className="node-date node-lf">{lf}</text>

                {/* BOTTOM HALF: Step Number/Task ID */}
                <text x={pos.x} y={pos.y + 35} textAnchor="middle" className="node-task-id">
                  {event.id === 'START' ? 'S' : event.id === 'FINISH' ? 'E' : index}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
});

export default PertDiagram;