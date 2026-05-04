import { useState } from 'react';
import {
  EdgeLabelRenderer,
  type EdgeProps,
} from '@xyflow/react';

function getOrthogonalPath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number
): [string, number, number] {
  const dx = Math.abs(targetX - sourceX);
  const dy = Math.abs(targetY - sourceY);

  let path: string;
  let midX: number;
  let midY: number;

  if (dx <= 10 || dy <= 10) {
    // Nearly straight — draw a straight line
    path = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
    midX = (sourceX + targetX) / 2;
    midY = (sourceY + targetY) / 2;
  } else {
    // Route via a single horizontal then vertical segment (L-shape at 90°)
    const midXVal = (sourceX + targetX) / 2;
    path = `M ${sourceX} ${sourceY} L ${midXVal} ${sourceY} L ${midXVal} ${targetY} L ${targetX} ${targetY}`;
    midX = midXVal;
    midY = (sourceY + targetY) / 2;
  }

  return [path, midX, midY];
}

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  markerEnd,
  style,
}: EdgeProps) {
  const [hovered, setHovered] = useState(false);

  const [edgePath, labelX, labelY] = getOrthogonalPath(sourceX, sourceY, targetX, targetY);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('edge-delete', { detail: { id } }));
  };

  return (
    <>
      {/* Wide invisible stroke for easy hover detection */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        style={{ cursor: 'pointer' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />

      {/* Visible edge */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        style={{
          ...style,
          stroke: hovered ? '#ff6b6b' : (style?.stroke as string) || '#00c8d4',
          strokeWidth: 3,
          transition: 'stroke 0.15s ease',
          filter: hovered ? 'drop-shadow(0 0 4px rgba(239,68,68,0.6))' : undefined,
          pointerEvents: 'none',
        }}
        markerEnd={markerEnd}
      />

      {/* X delete button at midpoint, shown on hover */}
      {hovered && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
              zIndex: 10,
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <button
              onClick={handleDelete}
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: '#ef4444',
                border: '2px solid #0d1321',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 700,
                lineHeight: 1,
                boxShadow: '0 0 6px rgba(239,68,68,0.7)',
              }}
            >
              ×
            </button>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
