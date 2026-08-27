/**
 * Shared model + view foundation for the "Solving Problems with a Graph" lesson.
 *
 * Every figure in the lesson draws the SAME axes at the SAME scale (minutes
 * across, dollars up), so a student who learns to read one figure can read all
 * three. The domain model lives here too — the drawing always derives from it.
 */

import React from "react";
import { useVar, useSetVar } from "@/stores";
import { type Vec2 } from "@/lib/motion";

// ── Domain model: an e-scooter that charges to unlock, then per minute ───────

export const UNLOCK_FEE = 3; // dollars, paid before the wheels turn
export const RATE_PER_MINUTE = 0.5; // dollars per minute
export const X_MAX = 20; // minutes shown
export const Y_MAX = 14; // dollars shown

/** y = 3 + 0.5x — the one relationship the whole lesson explores. */
export const costAt = (minutes: number) => UNLOCK_FEE + RATE_PER_MINUTE * minutes;
/** The inverse: how many minutes a given amount of money buys. */
export const minutesFor = (dollars: number) =>
    Math.max(0, (dollars - UNLOCK_FEE) / RATE_PER_MINUTE);

// ── One formatter per quantity, used by figures, sliders and prose ───────────

export const money = (dollars: number) => `$${dollars.toFixed(2)}`;
export const minutesLabel = (minutes: number) => `${Math.round(minutes)} min`;

// ── View geometry (gutters reserved BEFORE the plot is sized) ────────────────

export const VIEW_WIDTH = 560;
export const VIEW_HEIGHT = 360;
export const PLOT_LEFT = 66;
export const PLOT_RIGHT = 528;
export const PLOT_TOP = 66;
export const PLOT_BOTTOM = 300;

export const xPx = (minutes: number) =>
    PLOT_LEFT + (minutes / X_MAX) * (PLOT_RIGHT - PLOT_LEFT);
export const yPx = (dollars: number) =>
    PLOT_BOTTOM - (dollars / Y_MAX) * (PLOT_BOTTOM - PLOT_TOP);
export const minutesFromPx = (x: number) =>
    ((x - PLOT_LEFT) / (PLOT_RIGHT - PLOT_LEFT)) * X_MAX;
export const dollarsFromPx = (y: number) =>
    ((PLOT_BOTTOM - y) / (PLOT_BOTTOM - PLOT_TOP)) * Y_MAX;

// ── Palette (FIGURE_DESIGN_LANGUAGE: ink + paper + ONE accent) ───────────────

export const INK = "#334155";
export const INK_STRUCTURE = "#64748B";
export const INK_QUIET = "#CBD5E1";
export const GRID = "#EEF2F6";
export const ACCENT = "#62D0AD"; // the manipulable quantity
export const PARTNER = "#8E90F5"; // only for the covariation partner (minutes answer)

export const EASE_150 = {
    transition: "opacity 150ms ease, stroke-width 150ms ease",
} as const;

// ── Shared highlight channel: prose phrase ↔ figure element ─────────────────

export const useScooterHighlight = () => {
    const highlight = useVar<string>("scooterHighlight", "");
    const setVar = useSetVar();
    return {
        active: highlight,
        /** Target keeps full strength; everything else recedes. */
        opacity: (id: string) => (highlight && highlight !== id ? 0.35 : 1),
        weight: (id: string, resting: number) =>
            highlight === id ? resting * 1.6 : resting,
        isActive: (id: string) => highlight === id,
        hoverProps: (id: string) => ({
            onPointerEnter: () => setVar("scooterHighlight", id),
            onPointerLeave: () => setVar("scooterHighlight", ""),
        }),
    };
};

/** The soft halo half of the highlight "pop". */
export const Halo = ({
    active,
    children,
}: {
    active: boolean;
    children: React.ReactNode;
}) => (active ? <g opacity={0.28}>{children}</g> : null);

// ── Pointer helper ──────────────────────────────────────────────────────────

export const svgPointFromEvent = (
    event: React.PointerEvent,
    svg: SVGSVGElement | null,
): Vec2 => {
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
        x: ((event.clientX - rect.left) / rect.width) * VIEW_WIDTH,
        y: ((event.clientY - rect.top) / rect.height) * VIEW_HEIGHT,
    };
};

// ── The shared frame: grid, axes, ticks, direct axis titles ──────────────────

const DOLLAR_TICKS = [0, 2, 4, 6, 8, 10, 12, 14];
const MINUTE_TICKS = [0, 4, 8, 12, 16, 20];

export function GraphFrame({ opacity = 1 }: { opacity?: number }) {
    return (
        <g opacity={opacity} style={EASE_150}>
            {/* Quiet grid */}
            {DOLLAR_TICKS.map((dollars) => (
                <line
                    key={`grid-y-${dollars}`}
                    x1={PLOT_LEFT}
                    y1={yPx(dollars)}
                    x2={PLOT_RIGHT}
                    y2={yPx(dollars)}
                    stroke={GRID}
                    strokeWidth="1.5"
                />
            ))}
            {MINUTE_TICKS.map((minutes) => (
                <line
                    key={`grid-x-${minutes}`}
                    x1={xPx(minutes)}
                    y1={PLOT_TOP}
                    x2={xPx(minutes)}
                    y2={PLOT_BOTTOM}
                    stroke={GRID}
                    strokeWidth="1.5"
                />
            ))}

            {/* Axes */}
            <line
                x1={PLOT_LEFT}
                y1={PLOT_TOP}
                x2={PLOT_LEFT}
                y2={PLOT_BOTTOM}
                stroke={INK_STRUCTURE}
                strokeWidth="2"
                strokeLinecap="round"
            />
            <line
                x1={PLOT_LEFT}
                y1={PLOT_BOTTOM}
                x2={PLOT_RIGHT}
                y2={PLOT_BOTTOM}
                stroke={INK_STRUCTURE}
                strokeWidth="2"
                strokeLinecap="round"
            />

            {/* Tick labels — anchored back toward the ink so nothing clips */}
            <g fontSize="11" fill={INK_STRUCTURE} style={{ fontVariantNumeric: "tabular-nums" }}>
                {DOLLAR_TICKS.map((dollars) => (
                    <text
                        key={`label-y-${dollars}`}
                        x={PLOT_LEFT - 10}
                        y={yPx(dollars) + 4}
                        textAnchor="end"
                    >
                        {`$${dollars}`}
                    </text>
                ))}
                {MINUTE_TICKS.map((minutes) => (
                    <text
                        key={`label-x-${minutes}`}
                        x={xPx(minutes)}
                        y={PLOT_BOTTOM + 20}
                        textAnchor="middle"
                    >
                        {minutes}
                    </text>
                ))}
            </g>

            {/* Direct axis titles — no legend anywhere in this lesson */}
            <text x={30} y={54} fontSize="11" fill={INK_STRUCTURE}>
                cost in dollars (y)
            </text>
            <text
                x={(PLOT_LEFT + PLOT_RIGHT) / 2}
                y={PLOT_BOTTOM + 44}
                fontSize="11"
                fill={INK_STRUCTURE}
                textAnchor="middle"
            >
                minutes ridden (x)
            </text>
        </g>
    );
}
