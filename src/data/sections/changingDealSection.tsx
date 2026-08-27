/**
 * Section 5 — the relationship itself. Two draggable handles set the two
 * numbers in y = fee + rate × x: one slides the whole line, the other tilts it.
 * The old deal stays on screen as a dashed comparand.
 */

import React, { useRef, useState, type ReactElement } from "react";
import { StackLayout } from "@/components/layouts";
import { Block } from "@/components/templates";
import {
    EditableH2,
    EditableParagraph,
    InlineClozeChoice,
    InlineFeedback,
    InlineScrubbleNumber,
    InlineSpotColor,
    InteractionHintSequence,
} from "@/components/atoms";
import { Figure, FigureSlider } from "@/components/molecules";
import { FormulaBlock } from "@/components/molecules";
import { useVar, useSetVar } from "@/stores";
import { clamp, useSpring } from "@/lib/motion";
import {
    choicePropsFromDefinition,
    getVariableInfo,
    numberPropsFromDefinition,
    scrubVarsFromDefinitions,
    spotColorPropsFromDefinition,
} from "../variables";
import {
    ACCENT,
    EASE_150,
    GraphFrame,
    INK_QUIET,
    INK_STRUCTURE,
    PLOT_BOTTOM,
    PLOT_LEFT,
    PLOT_RIGHT,
    PLOT_TOP,
    RATE_PER_MINUTE,
    UNLOCK_FEE,
    VIEW_HEIGHT,
    VIEW_WIDTH,
    X_MAX,
    dollarsFromPx,
    money,
    svgPointFromEvent,
    xPx,
    yPx,
} from "./scooterGraphShared";

const DEFAULT_FEE = 3;
const DEFAULT_RATE = 30; // dollars per hour
const MINUTES_PER_HOUR = 60;
const RATE_HANDLE_MINUTES = 12; // where the steepness handle lives, always on screen

const FEE_TEXT = "#3FA98A"; // readable teal for the readout text
const RATE_TEXT = "#6E70E8"; // readable indigo for the readout text
const RATE_HUE = "#8E90F5"; // price per hour — the second quantity

function DealDrawing() {
    const setVar = useSetVar();
    const fee = useVar<number>("dealFee", DEFAULT_FEE);
    const rate = useVar<number>("dealRate", DEFAULT_RATE);

    const [dragging, setDragging] = useState<"fee" | "rate" | null>(null);
    const [hovered, setHovered] = useState<"fee" | "rate" | null>(null);
    const draggingRef = useRef<"fee" | "rate" | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    const feeScale = useSpring(dragging === "fee" || hovered === "fee" ? 1.15 : 1, {
        stiffness: 400,
        damping: 26,
    });
    const rateScale = useSpring(dragging === "rate" || hovered === "rate" ? 1.15 : 1, {
        stiffness: 400,
        damping: 26,
    });

    // The rate is quoted per hour, so each minute costs rate / 60.
    const costOf = (minutes: number) => fee + (rate / MINUTES_PER_HOUR) * minutes;
    const rateHandleY = yPx(costOf(RATE_HANDLE_MINUTES));

    const handlePointerMove = (event: React.PointerEvent) => {
        const which = draggingRef.current;
        if (!which) return;
        const point = svgPointFromEvent(event, svgRef.current);
        const dollars = dollarsFromPx(point.y);
        if (which === "fee") {
            setVar("dealFee", clamp(Math.round(dollars * 2) / 2, 0, 6));
        } else {
            const perHour = ((dollars - fee) / RATE_HANDLE_MINUTES) * MINUTES_PER_HOUR;
            setVar("dealRate", clamp(Math.round(perHour / 3) * 3, 6, 36));
        }
    };

    const dragHandlers = (which: "fee" | "rate") => ({
        onPointerDown: (event: React.PointerEvent) => {
            (event.currentTarget as Element).setPointerCapture(event.pointerId);
            draggingRef.current = which;
            setDragging(which);
        },
        onPointerMove: handlePointerMove,
        onPointerUp: () => {
            draggingRef.current = null;
            setDragging(null);
        },
        onPointerCancel: () => {
            draggingRef.current = null;
            setDragging(null);
        },
        onPointerEnter: () => setHovered(which),
        onPointerLeave: () => setHovered(null),
    });

    return (
        <svg
            ref={svgRef}
            viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
            className="block w-full select-none"
            role="img"
            aria-label="Cost line with draggable handles for the unlock fee and the hourly price"
        >
            <defs>
                <filter id="deal-handle-shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#0F172A" floodOpacity="0.25" />
                </filter>
                <clipPath id="deal-plot-clip">
                    <rect
                        x={PLOT_LEFT}
                        y={PLOT_TOP}
                        width={PLOT_RIGHT - PLOT_LEFT}
                        height={PLOT_BOTTOM - PLOT_TOP}
                    />
                </clipPath>
            </defs>

            <GraphFrame />

            {/* Readouts, each in its own quantity's colour */}
            <g fontSize="12" style={{ fontVariantNumeric: "tabular-nums", ...EASE_150 }}>
                <text x={24} y={30} fill={FEE_TEXT}>
                    {`${money(fee)} to unlock`}
                </text>
                <text x={VIEW_WIDTH - 24} y={30} fill={RATE_TEXT} textAnchor="end">
                    {`${money(rate)} per hour`}
                </text>
            </g>

            {/* The deal from the earlier sections stays visible to compare against */}
            <g style={EASE_150}>
                <line
                    x1={xPx(0)}
                    y1={yPx(UNLOCK_FEE)}
                    x2={xPx(X_MAX)}
                    y2={yPx(UNLOCK_FEE + RATE_PER_MINUTE * X_MAX)}
                    stroke={INK_QUIET}
                    strokeWidth="2"
                    strokeDasharray="6 5"
                    strokeLinecap="round"
                />
                <text x={xPx(16)} y={132} fontSize="11" fill="#94A3B8" textAnchor="end">
                    the deal you know
                </text>
            </g>

            {/* The line this deal makes */}
            <g clipPath="url(#deal-plot-clip)">
                <line
                    x1={xPx(0)}
                    y1={yPx(costOf(0))}
                    x2={xPx(X_MAX)}
                    y2={yPx(costOf(X_MAX))}
                    stroke={ACCENT}
                    strokeWidth="3"
                    strokeLinecap="round"
                />
            </g>

            {/* Handle 1: the starting cost, on the cost axis */}
            <g>
                <g transform={`translate(${PLOT_LEFT} ${yPx(fee)}) scale(${feeScale})`}>
                    <circle r="11" fill={ACCENT} filter="url(#deal-handle-shadow)" />
                </g>
                <circle
                    cx={PLOT_LEFT}
                    cy={yPx(fee)}
                    r="24"
                    fill="transparent"
                    style={{
                        cursor: dragging === "fee" ? "grabbing" : "grab",
                        touchAction: "none",
                    }}
                    {...dragHandlers("fee")}
                />
            </g>

            {/* Handle 2: the steepness, out at twelve minutes */}
            <g>
                <line
                    x1={xPx(RATE_HANDLE_MINUTES)}
                    y1={rateHandleY}
                    x2={xPx(RATE_HANDLE_MINUTES)}
                    y2={PLOT_BOTTOM}
                    stroke={RATE_HUE}
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    opacity={0.6}
                />
                <g transform={`translate(${xPx(RATE_HANDLE_MINUTES)} ${rateHandleY}) scale(${rateScale})`}>
                    <circle r="11" fill={RATE_HUE} filter="url(#deal-handle-shadow)" />
                </g>
                <circle
                    cx={xPx(RATE_HANDLE_MINUTES)}
                    cy={rateHandleY}
                    r="24"
                    fill="transparent"
                    style={{
                        cursor: dragging === "rate" ? "grabbing" : "grab",
                        touchAction: "none",
                    }}
                    {...dragHandlers("rate")}
                />
                <text
                    x={xPx(RATE_HANDLE_MINUTES)}
                    y={PLOT_BOTTOM - 12}
                    fontSize="11"
                    fill={INK_STRUCTURE}
                    textAnchor="middle"
                >
                    12 min
                </text>
            </g>
        </svg>
    );
}

function DealFigure() {
    const setVar = useSetVar();
    return (
        <Figure
            id="changing-deal"
            onReset={() => {
                setVar("dealFee", DEFAULT_FEE);
                setVar("dealRate", DEFAULT_RATE);
            }}
            caption="Drag the teal dot on the cost axis to change the unlock fee, and the indigo dot at twelve minutes to change the hourly price. The dashed line is the deal from earlier."
        >
            <DealDrawing />
            <div className="flex flex-col gap-3 px-6 pb-5">
                <FigureSlider
                    varName="dealFee"
                    label="Unlock fee"
                    {...numberPropsFromDefinition(getVariableInfo("dealFee"))}
                    formatValue={money}
                />
                <FigureSlider
                    varName="dealRate"
                    label="Price per hour"
                    {...numberPropsFromDefinition(getVariableInfo("dealRate"))}
                    formatValue={money}
                />
            </div>
            <InteractionHintSequence
                hintKey="changing-deal-handles"
                steps={[
                    {
                        gesture: "drag-vertical",
                        label: "Drag the teal dot up the cost axis",
                        position: { x: "14%", y: "69%" },
                        dragPath: {
                            type: "line",
                            startOffset: { x: 0, y: 20 },
                            endOffset: { x: 0, y: -20 },
                        },
                    },
                    {
                        gesture: "drag-vertical",
                        label: "Now drag the indigo dot to tilt the line",
                        position: { x: "61%", y: "42%" },
                        dragPath: {
                            type: "line",
                            startOffset: { x: 0, y: 20 },
                            endOffset: { x: 0, y: -20 },
                        },
                    },
                ]}
            />
        </Figure>
    );
}

export const changingDealSectionBlocks: ReactElement[] = [
    <StackLayout key="layout-changing-deal-heading" maxWidth="xl">
        <Block id="changing-deal-heading" padding="md">
            <EditableH2 id="h2-changing-deal-heading" blockId="changing-deal-heading">
                Changing the Deal
            </EditableH2>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-changing-deal-setup" maxWidth="xl">
        <Block id="changing-deal-setup" padding="sm">
            <EditableParagraph id="para-changing-deal-setup" blockId="changing-deal-setup">
                A rival company charges{" "}
                <InlineScrubbleNumber
                    varName="dealFee"
                    {...numberPropsFromDefinition(getVariableInfo("dealFee"))}
                    formatValue={money}
                />{" "}
                to unlock and{" "}
                <InlineScrubbleNumber
                    varName="dealRate"
                    {...numberPropsFromDefinition(getVariableInfo("dealRate"))}
                    formatValue={money}
                />{" "}
                an hour. Drag the{" "}
                <InlineSpotColor
                    varName="dealFee"
                    {...spotColorPropsFromDefinition(getVariableInfo("dealFee"))}
                >
                    teal dot
                </InlineSpotColor>{" "}
                on the cost axis, then the{" "}
                <InlineSpotColor
                    varName="dealRate"
                    {...spotColorPropsFromDefinition(getVariableInfo("dealRate"))}
                >
                    indigo dot
                </InlineSpotColor>{" "}
                out at twelve minutes, and watch what each one does to the line.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-changing-deal-figure" maxWidth="xl">
        <Block id="changing-deal-figure" padding="sm" hasVisualization>
            <DealFigure />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-changing-deal-formula" maxWidth="xl">
        <Block id="changing-deal-formula" padding="lg">
            <FormulaBlock
                latex="y = \scrub{dealFee} + \dfrac{\scrub{dealRate}}{60} \times x"
                variables={{
                    dealFee: {
                        ...scrubVarsFromDefinitions(["dealFee"]).dealFee,
                        formatValue: (v: number) => money(v),
                    },
                    dealRate: {
                        ...scrubVarsFromDefinitions(["dealRate"]).dealRate,
                        formatValue: (v: number) => money(v),
                    },
                }}
            />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-changing-deal-reflection" maxWidth="xl">
        <Block id="changing-deal-reflection" padding="sm">
            <EditableParagraph id="para-changing-deal-reflection" blockId="changing-deal-reflection">
                Only one of those two numbers tilts the line. The unlock fee slides the
                whole line up and down while its steepness stays exactly the same, which is
                why the two numbers in the equation do such different jobs.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-changing-deal-question" maxWidth="xl">
        <Block id="changing-deal-question" padding="md">
            <EditableParagraph id="para-changing-deal-question" blockId="changing-deal-question">
                A steeper line means the cost is stacking up faster, and that happens when
                you raise{" "}
                <InlineFeedback
                    varName="answerSteeper"
                    correctValue="the price per hour"
                    position="terminal"
                    successMessage="— yes, the hourly price is the one that changes the tilt"
                    failureMessage="— try both dots on the graph once more"
                    hint="One dot moved the line without ever changing its angle"
                    reviewBlockId="changing-deal-figure"
                    reviewLabel="Try the two dots again"
                >
                    <InlineClozeChoice
                        varName="answerSteeper"
                        correctAnswer="the price per hour"
                        options={["the price per hour", "the unlock fee"]}
                        {...choicePropsFromDefinition(getVariableInfo("answerSteeper"))}
                    />
                </InlineFeedback>.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
