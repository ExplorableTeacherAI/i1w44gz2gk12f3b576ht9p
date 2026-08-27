/**
 * Section 2 — the cost line itself. A rider marker rides the line; dragging it
 * reads the cost at any number of minutes. The unlock fee and the climb are
 * both hoverable from the prose.
 */

import React, { useRef, useState, type ReactElement } from "react";
import { StackLayout } from "@/components/layouts";
import { Block } from "@/components/templates";
import {
    EditableH2,
    EditableParagraph,
    InlineClozeInput,
    InlineFeedback,
    InlineLinkedHighlight,
    InlineScrubbleNumber,
    InteractionHintSequence,
} from "@/components/atoms";
import { Figure, FigureSlider } from "@/components/molecules";
import { useVar, useSetVar } from "@/stores";
import { clamp, useSpring } from "@/lib/motion";
import {
    clozePropsFromDefinition,
    getVariableInfo,
    linkedHighlightPropsFromDefinition,
    numberPropsFromDefinition,
} from "../variables";
import {
    ACCENT,
    EASE_150,
    GraphFrame,
    Halo,
    INK,
    INK_QUIET,
    PLOT_BOTTOM,
    PLOT_LEFT,
    VIEW_HEIGHT,
    VIEW_WIDTH,
    X_MAX,
    costAt,
    minutesFromPx,
    minutesLabel,
    money,
    svgPointFromEvent,
    useScooterHighlight,
    xPx,
    yPx,
} from "./scooterGraphShared";

const DEFAULT_MINUTES = 8;

// ── Reactive prose helpers (keep every sentence true at every value) ─────────

function RideCostText() {
    const minutes = useVar<number>("rideMinutes", DEFAULT_MINUTES);
    return <span>{money(costAt(minutes))}</span>;
}

// ── The drawing ─────────────────────────────────────────────────────────────

function RideLineDrawing() {
    const setVar = useSetVar();
    const minutes = useVar<number>("rideMinutes", DEFAULT_MINUTES);
    const { opacity, weight, isActive, hoverProps } = useScooterHighlight();

    const [dragging, setDragging] = useState(false);
    const [hovered, setHovered] = useState(false);
    const draggingRef = useRef(false);
    const svgRef = useRef<SVGSVGElement>(null);
    const handleScale = useSpring(dragging || hovered ? 1.15 : 1, {
        stiffness: 400,
        damping: 26,
    });

    const cost = costAt(minutes);
    const markerX = xPx(minutes);
    const markerY = yPx(cost);

    const lineStart = { x: xPx(0), y: yPx(costAt(0)) };
    const lineEnd = { x: xPx(X_MAX), y: yPx(costAt(X_MAX)) };

    const handlePointerMove = (event: React.PointerEvent<SVGCircleElement>) => {
        if (!draggingRef.current) return;
        const point = svgPointFromEvent(event, svgRef.current);
        setVar("rideMinutes", clamp(Math.round(minutesFromPx(point.x)), 0, X_MAX));
    };

    const showGhost = minutes !== DEFAULT_MINUTES;

    return (
        <svg
            ref={svgRef}
            viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
            className="block w-full select-none"
            role="img"
            aria-label="Graph of scooter cost against minutes ridden, with a draggable marker on the line"
        >
            <defs>
                <filter id="ride-line-handle-shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#0F172A" floodOpacity="0.25" />
                </filter>
            </defs>

            <GraphFrame opacity={opacity("frame")} />

            {/* Live reading, written as the calculation it is */}
            <text
                x={VIEW_WIDTH / 2}
                y={30}
                fontSize="12"
                fill={INK}
                textAnchor="middle"
                opacity={opacity("readout")}
                style={{ fontVariantNumeric: "tabular-nums", ...EASE_150 }}
            >
                {`${minutes} min → $3 + $0.50 × ${minutes} = ${money(cost)}`}
            </text>

            {/* Where the last reading was taken — the before-state stays visible */}
            {showGhost && (
                <g opacity={opacity("ghost") * 0.85} style={EASE_150}>
                    <line
                        x1={xPx(DEFAULT_MINUTES)}
                        y1={yPx(costAt(DEFAULT_MINUTES))}
                        x2={xPx(DEFAULT_MINUTES)}
                        y2={PLOT_BOTTOM}
                        stroke={INK_QUIET}
                        strokeWidth="1.5"
                        strokeDasharray="3 4"
                    />
                    <circle
                        cx={xPx(DEFAULT_MINUTES)}
                        cy={yPx(costAt(DEFAULT_MINUTES))}
                        r="5"
                        fill="#FFFFFF"
                        stroke={INK_QUIET}
                        strokeWidth="2"
                    />
                    <text
                        x={xPx(DEFAULT_MINUTES)}
                        y={yPx(costAt(DEFAULT_MINUTES)) - 14}
                        fontSize="10"
                        fill="#94A3B8"
                        textAnchor="middle"
                    >
                        8 min · $7.00
                    </text>
                </g>
            )}

            {/* The climb — hoverable from the prose */}
            <g
                opacity={opacity("climb")}
                style={{ ...EASE_150, cursor: "default" }}
                {...hoverProps("climb")}
            >
                <Halo active={isActive("climb")}>
                    <line
                        x1={lineStart.x}
                        y1={lineStart.y}
                        x2={lineEnd.x}
                        y2={lineEnd.y}
                        stroke={ACCENT}
                        strokeWidth="10"
                        strokeLinecap="round"
                    />
                </Halo>
                <line
                    x1={lineStart.x}
                    y1={lineStart.y}
                    x2={lineEnd.x}
                    y2={lineEnd.y}
                    stroke={ACCENT}
                    strokeWidth={weight("climb", 3)}
                    strokeLinecap="round"
                    style={EASE_150}
                />
            </g>

            {/* The unlock fee — the three dollars before any minute is ridden */}
            <g
                opacity={opacity("fee")}
                style={{ ...EASE_150, cursor: "default" }}
                {...hoverProps("fee")}
            >
                <Halo active={isActive("fee")}>
                    <line
                        x1={PLOT_LEFT}
                        y1={yPx(0)}
                        x2={PLOT_LEFT}
                        y2={yPx(3)}
                        stroke={ACCENT}
                        strokeWidth="10"
                        strokeLinecap="round"
                    />
                </Halo>
                <line
                    x1={PLOT_LEFT}
                    y1={yPx(0)}
                    x2={PLOT_LEFT}
                    y2={yPx(3)}
                    stroke={ACCENT}
                    strokeWidth={weight("fee", 3.5)}
                    strokeLinecap="round"
                    style={EASE_150}
                />
                <circle cx={PLOT_LEFT} cy={yPx(3)} r={isActive("fee") ? 7 : 5.5} fill={ACCENT} />
                <text x={PLOT_LEFT + 12} y={yPx(1.4)} fontSize="11" fill={INK}>
                    $3 to unlock
                </text>
            </g>

            {/* Guides from the marker out to both axes */}
            <g opacity={opacity("marker")} style={EASE_150}>
                <line
                    x1={markerX}
                    y1={markerY}
                    x2={markerX}
                    y2={PLOT_BOTTOM}
                    stroke={ACCENT}
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    opacity={0.75}
                />
                <line
                    x1={markerX}
                    y1={markerY}
                    x2={PLOT_LEFT}
                    y2={markerY}
                    stroke={ACCENT}
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    opacity={0.75}
                />

                {/* Draggable rider marker */}
                <g transform={`translate(${markerX} ${markerY}) scale(${handleScale})`}>
                    <circle r="11" fill={ACCENT} filter="url(#ride-line-handle-shadow)" />
                </g>
                <circle
                    cx={markerX}
                    cy={markerY}
                    r="24"
                    fill="transparent"
                    style={{ cursor: dragging ? "grabbing" : "grab", touchAction: "none" }}
                    onPointerDown={(event) => {
                        event.currentTarget.setPointerCapture(event.pointerId);
                        draggingRef.current = true;
                        setDragging(true);
                    }}
                    onPointerMove={handlePointerMove}
                    onPointerUp={() => {
                        draggingRef.current = false;
                        setDragging(false);
                    }}
                    onPointerCancel={() => {
                        draggingRef.current = false;
                        setDragging(false);
                    }}
                    onPointerEnter={() => setHovered(true)}
                    onPointerLeave={() => setHovered(false)}
                />
            </g>
        </svg>
    );
}

function RideLineFigure() {
    const setVar = useSetVar();
    return (
        <Figure
            id="ride-line"
            onReset={() => setVar("rideMinutes", DEFAULT_MINUTES)}
            caption="Drag the teal marker along the line. The dashed guides show the minutes you picked and the cost that goes with them."
        >
            <RideLineDrawing />
            <div className="px-6 pb-5">
                <FigureSlider
                    varName="rideMinutes"
                    label="Minutes ridden"
                    {...numberPropsFromDefinition(getVariableInfo("rideMinutes"))}
                    formatValue={minutesLabel}
                />
            </div>
            <InteractionHintSequence
                hintKey="ride-line-marker-drag"
                steps={[
                    {
                        gesture: "drag",
                        label: "Drag the teal marker along the line",
                        position: { x: "45%", y: "51%" },
                        dragPath: {
                            type: "line",
                            startOffset: { x: -24, y: 12 },
                            endOffset: { x: 24, y: -12 },
                        },
                    },
                ]}
            />
        </Figure>
    );
}

export const rideLineSectionBlocks: ReactElement[] = [
    <StackLayout key="layout-ride-line-heading" maxWidth="xl">
        <Block id="ride-line-heading" padding="md">
            <EditableH2 id="h2-ride-line-heading" blockId="ride-line-heading">
                The Scooter Ride Line
            </EditableH2>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-ride-line-setup" maxWidth="xl">
        <Block id="ride-line-setup" padding="sm">
            <EditableParagraph id="para-ride-line-setup" blockId="ride-line-setup">
                This scooter charges three dollars to unlock, then fifty cents for every
                minute you ride. At{" "}
                <InlineScrubbleNumber
                    varName="rideMinutes"
                    {...numberPropsFromDefinition(getVariableInfo("rideMinutes"))}
                    formatValue={(v) => `${Math.round(v)}`}
                />{" "}
                minutes the line sits at <RideCostText />, the unlock fee plus fifty cents
                for each of those minutes. Slide the teal marker along the line and the
                reading follows you.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-ride-line-figure" maxWidth="xl">
        <Block id="ride-line-figure" padding="sm" hasVisualization>
            <RideLineFigure />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-ride-line-reflection" maxWidth="xl">
        <Block id="ride-line-reflection" padding="sm">
            <EditableParagraph id="para-ride-line-reflection" blockId="ride-line-reflection">
                Every ride starts at the{" "}
                <InlineLinkedHighlight
                    varName="scooterHighlight"
                    highlightId="fee"
                    {...linkedHighlightPropsFromDefinition(getVariableInfo("scooterHighlight"))}
                >
                    unlock fee
                </InlineLinkedHighlight>{" "}
                before the wheels even turn, and from there the line{" "}
                <InlineLinkedHighlight
                    varName="scooterHighlight"
                    highlightId="climb"
                    {...linkedHighlightPropsFromDefinition(getVariableInfo("scooterHighlight"))}
                >
                    climbs
                </InlineLinkedHighlight>{" "}
                at a steady fifty cents a minute. Those two numbers are the whole story of
                this graph.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-ride-line-question" maxWidth="xl">
        <Block id="ride-line-question" padding="md">
            <EditableParagraph id="para-ride-line-question" blockId="ride-line-question">
                A rider keeps the scooter for 14 minutes. Reading up from 14 until you
                meet the line, what does that ride cost in dollars?{" "}
                <InlineFeedback
                    varName="answerCostAt14"
                    correctValue={["10", "$10", "10.00", "$10.00", "10 dollars"]}
                    position="standalone"
                    successMessage="Exactly right! Three dollars to unlock, and fourteen half-dollars of riding"
                    failureMessage="Not quite yet!"
                    hint="Follow 14 straight up to the line, then straight across to the cost axis"
                    visualizationHint={{
                        blockId: "ride-line-figure",
                        hintKey: "feedback-ride-line-14",
                        label: "Read it off the graph",
                        steps: [
                            {
                                gesture: "drag",
                                label: "Drag the teal marker right until it reads 14 minutes",
                                position: { x: "45%", y: "51%" },
                                dragPath: {
                                    type: "line",
                                    startOffset: { x: -20, y: 10 },
                                    endOffset: { x: 30, y: -15 },
                                },
                                completionVar: "rideMinutes",
                                completionValue: 14,
                                completionTolerance: 0.6,
                            },
                        ],
                        resetVars: { rideMinutes: DEFAULT_MINUTES },
                    }}
                >
                    <InlineClozeInput
                        varName="answerCostAt14"
                        correctAnswer={["10", "$10", "10.00", "$10.00", "10 dollars"]}
                        {...clozePropsFromDefinition(getVariableInfo("answerCostAt14"))}
                    />
                </InlineFeedback>
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
