import { useRef, type PointerEvent, type KeyboardEvent } from "react";
import { eyes, shapes, movePosition, type Config, type Point } from "./model";
type Props = {
  config: Config;
  interactive?: boolean;
  onMove?: (p: Point) => void;
  label?: string;
  keyboardLabel?: string;
  className?: string;
};
export default function Icon({
  config,
  interactive = false,
  onMove,
  label,
  keyboardLabel,
  className,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ id: number; start: Point; position: Point } | null>(
    null,
  );
  const shape = shapes.find((s) => s.id === config.shape)!;
  const eye = eyes.find((e) => e.id === config.eyes)!;
  function local(e: PointerEvent<SVGGElement>): Point {
    const svg = svgRef.current!;
    const point = svg.createSVGPoint();
    point.x = e.clientX;
    point.y = e.clientY;
    const m = svg.getScreenCTM();
    if (!m) return config.position;
    const p = point.matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  }
  function down(e: PointerEvent<SVGGElement>) {
    if (!interactive || !onMove || !e.isPrimary) return;
    e.preventDefault();
    e.currentTarget.focus();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = {
      id: e.pointerId,
      start: local(e),
      position: { ...config.position },
    };
  }
  function move(e: PointerEvent<SVGGElement>) {
    if (drag.current?.id !== e.pointerId || !onMove) return;
    const p = local(e);
    onMove(
      movePosition(config, {
        x: drag.current.position.x + p.x - drag.current.start.x,
        y: drag.current.position.y + p.y - drag.current.start.y,
      }),
    );
  }
  function key(e: KeyboardEvent<SVGGElement>) {
    const step = e.shiftKey ? 20 : 4;
    const directions: Record<string, Point> = {
      ArrowLeft: { x: -step, y: 0 },
      ArrowRight: { x: step, y: 0 },
      ArrowUp: { x: 0, y: -step },
      ArrowDown: { x: 0, y: step },
    };
    const d = directions[e.key];
    if (!d || !onMove) return;
    e.preventDefault();
    onMove(
      movePosition(config, {
        x: config.position.x + d.x,
        y: config.position.y + d.y,
      }),
    );
  }
  return (
    <svg
      ref={svgRef}
      className={className}
      viewBox="0 0 1024 1024"
      xmlns="http://www.w3.org/2000/svg"
      role={interactive ? "group" : label ? "img" : undefined}
      aria-label={label}
      aria-hidden={!interactive && !label ? true : undefined}
    >
      {config.background && (
        <rect width="1024" height="1024" fill={config.background} />
      )}
      <path
        d={shape.d}
        fill={config.color}
        stroke={config.outline ? "#000" : undefined}
        strokeWidth={config.outline ? config.thickness * 2 : undefined}
        strokeLinejoin="round"
        paintOrder="stroke fill"
      />
      <g
        transform={`translate(${config.position.x} ${config.position.y})`}
        className={interactive ? "eye-handle" : undefined}
        tabIndex={interactive ? 0 : undefined}
        role={interactive ? "group" : undefined}
        aria-label={interactive ? keyboardLabel : undefined}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
        onLostPointerCapture={() => {
          drag.current = null;
        }}
        onKeyDown={key}
      >
        {interactive && (
          <rect
            x="-175"
            y="-165"
            width="350"
            height="330"
            rx="40"
            fill="transparent"
          />
        )}
        <path d={eye.d} fill="#fff" />
        {interactive && (
          <rect
            className="eye-focus"
            x="-175"
            y="-165"
            width="350"
            height="330"
            rx="40"
            fill="none"
            stroke="#000"
            strokeWidth="3"
            strokeDasharray="8 8"
          />
        )}
      </g>
    </svg>
  );
}
