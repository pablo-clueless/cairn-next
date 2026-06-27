"use client";

import { useRef, useState } from "react";
import {
  CircleIcon,
  MousePointer2Icon,
  PenLineIcon,
  SquareIcon,
  Trash2Icon,
  TypeIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

type Point = [number, number];

type Shape =
  | { id: string; type: "path"; points: Point[]; color: string; width: number }
  | { id: string; type: "rect" | "ellipse"; x: number; y: number; w: number; h: number; color: string; width: number }
  | { id: string; type: "text"; x: number; y: number; text: string; color: string };

type Tool = "select" | "pen" | "rect" | "ellipse" | "text" | "eraser";

const COLORS = ["#1e293b", "#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#a855f7"];
const uid = () => Math.random().toString(36).slice(2, 10);

function parseShapes(raw: string): Shape[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Shape[]) : [];
  } catch {
    return [];
  }
}

/** Axis-aligned bounding box of a shape, for hit-testing select/erase. */
function bbox(s: Shape): { x: number; y: number; w: number; h: number } {
  if (s.type === "path") {
    const xs = s.points.map((p) => p[0]);
    const ys = s.points.map((p) => p[1]);
    const x = Math.min(...xs);
    const y = Math.min(...ys);
    return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
  }
  if (s.type === "text") return { x: s.x, y: s.y - 16, w: Math.max(40, s.text.length * 9), h: 22 };
  return { x: s.x, y: s.y, w: s.w, h: s.h };
}

function hit(s: Shape, x: number, y: number): boolean {
  const b = bbox(s);
  const pad = 6;
  return x >= b.x - pad && x <= b.x + b.w + pad && y >= b.y - pad && y <= b.y + b.h + pad;
}

interface WhiteboardProps {
  initialValue: string;
  onChange: (json: string) => void;
}

/** A lightweight SVG whiteboard. Shapes serialize to a JSON string (the doc content). */
export const Whiteboard = ({ initialValue, onChange }: WhiteboardProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [shapes, setShapes] = useState<Shape[]>(() => parseShapes(initialValue));
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState(COLORS[0]);
  const [draft, setDraft] = useState<Shape | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const drag = useRef<{ id: string; ox: number; oy: number } | null>(null);

  const commit = (next: Shape[]) => {
    setShapes(next);
    onChange(JSON.stringify(next));
  };

  const localPoint = (e: React.PointerEvent): Point => {
    const rect = svgRef.current!.getBoundingClientRect();
    return [Math.round(e.clientX - rect.left), Math.round(e.clientY - rect.top)];
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const [x, y] = localPoint(e);
    (e.target as Element).setPointerCapture?.(e.pointerId);

    if (tool === "eraser") {
      const target = [...shapes].reverse().find((s) => hit(s, x, y));
      if (target) commit(shapes.filter((s) => s.id !== target.id));
      return;
    }
    if (tool === "select") {
      const target = [...shapes].reverse().find((s) => hit(s, x, y));
      setSelectedId(target?.id ?? null);
      if (target) {
        const b = bbox(target);
        drag.current = { id: target.id, ox: x - b.x, oy: y - b.y };
      }
      return;
    }
    if (tool === "text") {
      const text = window.prompt("Text:");
      if (text) commit([...shapes, { id: uid(), type: "text", x, y, text, color }]);
      return;
    }
    if (tool === "pen") {
      setDraft({ id: uid(), type: "path", points: [[x, y]], color, width: 2 });
      return;
    }
    // rect / ellipse
    setDraft({ id: uid(), type: tool, x, y, w: 0, h: 0, color, width: 2 });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const [x, y] = localPoint(e);

    if (drag.current) {
      const d = drag.current;
      setShapes((prev) =>
        prev.map((s) => {
          if (s.id !== d.id) return s;
          const b = bbox(s);
          const dx = x - d.ox - b.x;
          const dy = y - d.oy - b.y;
          return moveShape(s, dx, dy);
        }),
      );
      return;
    }
    if (!draft) return;
    if (draft.type === "path") {
      setDraft({ ...draft, points: [...draft.points, [x, y]] });
    } else if (draft.type === "rect" || draft.type === "ellipse") {
      setDraft({ ...draft, w: x - draft.x, h: y - draft.y });
    }
  };

  const onPointerUp = () => {
    if (drag.current) {
      drag.current = null;
      commit(shapes);
      return;
    }
    if (!draft) return;
    // Discard zero-size shapes (a stray click). Only path/rect/ellipse are drafts.
    let keep = true;
    if (draft.type === "path") keep = draft.points.length > 1;
    else if (draft.type === "rect" || draft.type === "ellipse")
      keep = Math.abs(draft.w) > 3 || Math.abs(draft.h) > 3;
    if (keep) commit([...shapes, normalize(draft)]);
    setDraft(null);
  };

  const tools: { tool: Tool; icon: typeof PenLineIcon; label: string }[] = [
    { tool: "select", icon: MousePointer2Icon, label: "Select / move" },
    { tool: "pen", icon: PenLineIcon, label: "Pen" },
    { tool: "rect", icon: SquareIcon, label: "Rectangle" },
    { tool: "ellipse", icon: CircleIcon, label: "Ellipse" },
    { tool: "text", icon: TypeIcon, label: "Text" },
    { tool: "eraser", icon: Trash2Icon, label: "Erase" },
  ];

  const render = draft ? [...shapes, draft] : shapes;

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5 rounded-md border p-0.5">
          {tools.map((t) => (
            <button
              key={t.tool}
              type="button"
              title={t.label}
              onClick={() => setTool(t.tool)}
              className={cn(
                "grid size-7 place-items-center rounded",
                tool === t.tool ? "bg-brand text-white" : "hover:bg-muted",
              )}
            >
              <t.icon className="size-4" />
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 rounded-md border p-1">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Color ${c}`}
              onClick={() => setColor(c)}
              className={cn("size-5 rounded-full", color === c && "ring-foreground ring-2")}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        {selectedId && tool === "select" && (
          <button
            type="button"
            className="text-muted-foreground hover:text-destructive ml-1 text-xs"
            onClick={() => {
              commit(shapes.filter((s) => s.id !== selectedId));
              setSelectedId(null);
            }}
          >
            Delete selection
          </button>
        )}
        <button
          type="button"
          className="text-muted-foreground hover:text-destructive ml-auto text-xs"
          onClick={() => commit([])}
        >
          Clear board
        </button>
      </div>

      <svg
        ref={svgRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className={cn(
          "min-h-[60vh] flex-1 touch-none rounded-md border bg-white",
          tool === "select" ? "cursor-default" : "cursor-crosshair",
        )}
      >
        {render.map((s) => (
          <ShapeView key={s.id} shape={s} selected={s.id === selectedId} />
        ))}
      </svg>
    </div>
  );
};

const ShapeView = ({ shape: s, selected }: { shape: Shape; selected: boolean }) => {
  const stroke = selected ? "#2563eb" : undefined;
  if (s.type === "path") {
    return (
      <polyline
        points={s.points.map((p) => p.join(",")).join(" ")}
        fill="none"
        stroke={stroke ?? s.color}
        strokeWidth={s.width}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
  }
  if (s.type === "text") {
    return (
      <text x={s.x} y={s.y} fill={stroke ?? s.color} fontSize={16}>
        {s.text}
      </text>
    );
  }
  const n = normalize(s);
  if (s.type === "rect") {
    return <rect x={n.x} y={n.y} width={n.w} height={n.h} fill="none" stroke={stroke ?? s.color} strokeWidth={s.width} />;
  }
  return (
    <ellipse
      cx={n.x + n.w / 2}
      cy={n.y + n.h / 2}
      rx={n.w / 2}
      ry={n.h / 2}
      fill="none"
      stroke={stroke ?? s.color}
      strokeWidth={s.width}
    />
  );
};

/** Normalize a rect/ellipse so width/height are positive (handles drag up-left). */
function normalize<T extends Shape>(s: T): T {
  if (s.type !== "rect" && s.type !== "ellipse") return s;
  return {
    ...s,
    x: s.w < 0 ? s.x + s.w : s.x,
    y: s.h < 0 ? s.y + s.h : s.y,
    w: Math.abs(s.w),
    h: Math.abs(s.h),
  };
}

function moveShape(s: Shape, dx: number, dy: number): Shape {
  if (s.type === "path") return { ...s, points: s.points.map(([px, py]) => [px + dx, py + dy]) };
  return { ...s, x: s.x + dx, y: s.y + dy };
}
