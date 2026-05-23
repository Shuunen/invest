// oxlint-disable react/no-multi-comp, id-length, no-magic-numbers
import { kebabCase } from "es-toolkit";
import { useCallback, useMemo, useRef, useState } from "react";
import { maxPercentage } from "../../utils/constants.ts";

function toRad(deg: number) {
  return ((deg - 90) * Math.PI) / 180;
}

function point(radius: number, deg: number, center: { x: number; y: number }) {
  const angle = toRad(deg);
  return { px: center.x + radius * Math.cos(angle), py: center.y + radius * Math.sin(angle) };
}

type PieSliceProps = {
  end: number;
  fill: string;
  fraction: number;
  isHovered: boolean;
  label: string;
  mid: number;
  onEnter: () => void;
  size: number;
  start: number;
  total: number;
};

type SliceGeometryArgs = { end: number; fraction?: number; inset?: number; mid: number; size: number; start: number };

const chartPadding = 10;
const fullCircleThreshold = 359.999;
const sliceHoverInset = 6;
const hoverRingGap = 5;
const hoverDashPattern = "8 4";
const hoverDashCycle = 12;
const themedStrokeColor = "var(--color-base-100)";
const themedLabelColor = "white";
const themedShadowColor = "color-mix(in oklab, black 35%, transparent)";

function deriveSliceGeometry({ end, fraction = 0, inset = 0, mid, size, start }: SliceGeometryArgs) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - chartPadding - inset;
  const normalizedFraction = Math.min(1, Math.max(0, fraction));
  const labelOffset = 12 + 88 * normalizedFraction ** 1.15;
  const labelR = outerR - labelOffset;
  const center = { x: cx, y: cy };
  const lp = point(labelR, mid, center);

  if (end - start >= fullCircleThreshold) return { arcPath: "", cx, cy, fullCircle: true, lp, outerR, path: "" };

  const startPt = point(outerR, start, center);
  const endPt = point(outerR, end, center);
  const large = end - start > 180 ? 1 : 0;
  const arcPath = `M ${startPt.px} ${startPt.py} A ${outerR} ${outerR} 0 ${large} 1 ${endPt.px} ${endPt.py}`;
  const path = `M ${cx} ${cy} L ${startPt.px} ${startPt.py} A ${outerR} ${outerR} 0 ${large} 1 ${endPt.px} ${endPt.py} Z`;

  return { arcPath, cx, cy, fullCircle: false, lp, outerR, path };
}

type PieSliceFillProps = Pick<PieSliceProps, "end" | "fill" | "isHovered" | "label" | "onEnter" | "size" | "start">;

function PieSliceFill({ end, fill, isHovered, label, onEnter, size, start }: PieSliceFillProps) {
  const { cx, cy, fullCircle, outerR, path } = deriveSliceGeometry({ end, mid: 0, size, start });
  const { arcPath: hoverArcPath } = deriveSliceGeometry({ end, inset: sliceHoverInset, mid: 0, size, start });
  const testId = `slice-${kebabCase(label)}`;
  const fillHoverStyle = {
    filter: isHovered ? "brightness(1.15)" : "brightness(1)",
    transition: "filter 180ms ease",
  };
  const hoverRingStyle = {
    opacity: isHovered ? 1 : 0,
    transition: "opacity 180ms ease",
  };

  if (fullCircle)
    return (
      <g onMouseEnter={onEnter} data-testid={testId}>
        <circle cx={cx} cy={cy} fill={fill} r={outerR} stroke={themedStrokeColor} strokeWidth="2" style={fillHoverStyle} />
        <circle cx={cx} cy={cy} r={outerR - hoverRingGap} fill="none" stroke={themedStrokeColor} strokeWidth="2" strokeDasharray={hoverDashPattern} className="pie-dash" style={hoverRingStyle} />
      </g>
    );

  return (
    <g onMouseEnter={onEnter} data-testid={testId}>
      <path d={path} fill={fill} stroke={themedStrokeColor} strokeWidth="2" style={fillHoverStyle} />
      <path d={hoverArcPath} fill="none" stroke={themedStrokeColor} strokeWidth="2" strokeDasharray={hoverDashPattern} strokeLinecap="round" className="pie-dash" style={hoverRingStyle} />
    </g>
  );
}

function PieSliceLabel({ end, fill, fraction, isHovered, label, mid, size, start }: Omit<PieSliceProps, "onEnter">) {
  const { cx, cy, fullCircle, lp } = deriveSliceGeometry({ end, fraction, mid, size, start });
  const pctText = `${Math.round(fraction * maxPercentage)}%`;
  const charWidth = isHovered ? 9 : 8;
  const padX = 8;
  const badgeHeight = isHovered ? 48 : 44;
  const badgeWidth = Math.max(label.length, pctText.length) * charWidth + padX * 2;
  const fontWeight = isHovered ? "bold" : "normal";
  const anchor = fullCircle ? { x: cx, y: cy } : { x: lp.px, y: lp.py };
  const badgeX = anchor.x - badgeWidth / 2;
  const badgeY = anchor.y - badgeHeight / 2;
  const textTestId = `slice-label-text-${kebabCase(label)}`;

  return (
    <g style={{ pointerEvents: "none" }} data-testid={`slice-label-${kebabCase(label)}`}>
      <rect x={badgeX} y={badgeY} width={badgeWidth} height={badgeHeight} fill={fill} fillOpacity="0.8" rx="4" style={{ filter: `drop-shadow(0 2px 4px ${themedShadowColor})` }} />
      <text dominantBaseline="middle" fontSize="14" fontWeight={fontWeight} textAnchor="middle" x={anchor.x} y={anchor.y} data-testid={textTestId}>
        <tspan dy="-0.6em" fill={themedLabelColor} x={anchor.x}>
          {label}
        </tspan>
        <tspan dy="1.4em" fill={themedLabelColor} x={anchor.x}>
          {pctText}
        </tspan>
      </text>
    </g>
  );
}

type Entry = {
  fill: string;
  label: string;
  value: number;
};

type PieChartProps = {
  entries: Entry[];
  name: string;
  size?: number;
};

const popoverBoundaryPadding = 14;
const popoverCursorOffset = 42;
const hideInnerLabelBelowPercents = 7;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function computePopoverCoordinate(containerSize: number, cursorPosition: number, popoverSize: number) {
  const minPos = popoverBoundaryPadding;
  const maxPos = Math.max(minPos, containerSize - popoverSize - popoverBoundaryPadding);
  const forwardPos = cursorPosition + popoverCursorOffset;
  const backwardPos = cursorPosition - popoverSize - popoverCursorOffset;

  if (forwardPos <= maxPos) return forwardPos;
  if (backwardPos >= minPos) return backwardPos;
  return clamp(forwardPos, minPos, maxPos);
}

function usePieState(entries: Entry[]) {
  const [hovered, setHovered] = useState<string | undefined>(undefined);
  const [popoverPos, setPopoverPos] = useState({ left: 0, top: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const total = useMemo(() => entries.reduce((sum, { value }) => sum + value, 0), [entries]);

  const slices = useMemo(() => {
    let cursor = 0;
    return entries.map(({ label, value, fill }) => {
      const fraction = total === 0 ? 0 : value / total;
      const sweep = fraction * 360;
      const start = cursor;
      const mid = cursor + sweep / 2;
      cursor += sweep;
      return { end: cursor, fill, fraction, label, mid, start, value };
    });
  }, [entries, total]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    const containerRect = containerRef.current?.getBoundingClientRect();
    const popoverRect = popoverRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    const popoverWidth = popoverRect?.width ?? 0;
    const popoverHeight = popoverRect?.height ?? 0;
    const relativeX = event.clientX - containerRect.left;
    const relativeY = event.clientY - containerRect.top;

    setPopoverPos({
      left: computePopoverCoordinate(containerRect.width, relativeX, popoverWidth),
      top: computePopoverCoordinate(containerRect.height, relativeY, popoverHeight),
    });
  }, []);

  const hoveredSlice = hovered === undefined ? undefined : slices.find(slice => slice.label === hovered);

  return { containerRef, handleMouseMove, hovered, hoveredSlice, popoverPos, popoverRef, setHovered, slices, total };
}

export function PieChart({ entries, name, size = 300 }: PieChartProps) {
  const { containerRef, handleMouseMove, hovered, hoveredSlice, popoverPos, popoverRef, setHovered, slices, total } = usePieState(entries);
  const shouldRenderPopover = hoveredSlice !== undefined;

  return (
    <div
      className="relative"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        setHovered(undefined);
      }}
    >
      <svg height={`${size}px`} viewBox={`0 0 ${size} ${size}`} width="100%" aria-label={`${name} allocation pie chart`} role="img" data-testid={kebabCase(`${name}-chart`)} className="overflow-visible">
        <defs>
          <style>{`@keyframes pie-dash { to { stroke-dashoffset: -${hoverDashCycle}; } } .pie-dash { animation: pie-dash 1s linear infinite; }`}</style>
        </defs>
        {slices.map(slice => (
          <PieSliceFill key={slice.label} {...slice} isHovered={hovered === slice.label} onEnter={() => setHovered(slice.label)} size={size} />
        ))}
        {slices.map(slice => slice.value * maxPercentage > hideInnerLabelBelowPercents && <PieSliceLabel key={slice.label} {...slice} isHovered={hovered === slice.label} size={size} total={total} />)}
      </svg>
      {shouldRenderPopover && (
        <div className="absolute rounded-lg border bg-base-100 px-3 py-2 whitespace-nowrap shadow-md" ref={popoverRef} style={{ left: `${popoverPos.left}px`, top: `${popoverPos.top}px` }} data-testid="pie-popover">
          <span className="font-bold">{hoveredSlice.label}</span>
          <span className="ml-2 text-base-content">{`${Math.round(hoveredSlice.fraction * maxPercentage)}%`}</span>
        </div>
      )}
    </div>
  );
}
