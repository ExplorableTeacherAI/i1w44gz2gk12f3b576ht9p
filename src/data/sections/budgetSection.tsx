/**
 * Section 4 — the same graph read the other way. The student drags a budget
 * line (the output) and the graph hands back the minutes (the input): solving
 * for an unknown by reading down instead of up.
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
    INK_STRUCTURE,
    PARTNER,
    PLOT_BOTTOM,
    PLOT_LEFT,
    PLOT_RIGHT,
    UNLOCK_FEE,
    VIEW_HEIGHT,
    VIEW_WIDTH,
    X_MAX,
    Y_MAX,
    costAt,
    dollarsFromPx,
    minutesFor,
    money,
    svgPointFromEvent,
    useScooterHighlight,
    xPx,
    yPx,
} from "./scooterGraphShared";

const DEFAULT_BUDGET = 5;

const affordableMinutes = (budget: number) =>
    budget < UNLOCK_FEE ? 0 : clamp(minutesFor(budget), 0, X_MAX);

// ── Reactive prose helper ───────────────────────────────────────────────────

function AffordableMinutesText() {
    const budget = useVar<number>("rideBudget", DEFAULT_BUDGET);
    return <span>{Math.round(affordableMinutes(budget))}</span>;
}

function BudgetDrawing() {
    const setVar = useSetVar();
    const budget = useVar<number>("rideBudget", DEFAULT_BUDGET);
    const { opacity, weight, isActive, hoverProps } = useScooterHighlight();

    const [dragging, setDragging] = useState(false);
    const [hovered, setHovered] = useState(false);
    const draggingRef = useRef(false);
    const svgRef = useRef<SVGSVGElement>(null);
    const handleScale = useSpring(dragging || hovered ? 1.15 : 1, {
        stiffness: 400,
        damping: 26,
    });

    const budgetY = yPx(budget);
    const minutes = affordableMinutes(budget);
    const crossingX = xPx(minutes);
    const canRide = budget >= UNLOCK_FEE;
    const handleX = 500;

    const handlePointerMove = (event: React.PointerEvent) => {
        if (!draggingRef.current) return;
        const point = svgPointFromEvent(event, svgRef.current);
        const dollars = clamp(dollarsFromPx(point.y), 1, Y_MAX - 1);
        setVar("rideBudget", Math.round(dollars * 2) / 2);
    };

    const dragHandlers = {
        onPointerDown: (event: React.PointerEvent) => {
            (event.currentTarget as Element).setPointerCapture(event.pointerId);
            draggingRef.current = true;
            setDragging(true);
        },
        onPointerMove: handlePointerMove,
        onPointerUp: () => {
            draggingRef.current = false;
            setDragging(false);
        },
        onPointerCancel: () => {
            draggingRef.current = false;
            setDragging(false);
        },
        onPointerEnter: () => setHovered(true),
        onPointerLeave: () => setHovered(false),
    };

    // Keep the minutes label inside the plot at every reachable value.
    const labelAnchor = crossingX > 440 ? "end" : "start";
    const labelX = crossingX > 440 ? crossingX - 10 : crossingX + 10;

    return (
        <svg
            ref={svgRef}
            viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
            className="block w-full select-none"
            role="img"
            aria-label="Cost graph with a draggable horizontal budget line showing the minutes it buys"
        >
            <defs>
                <filter id="budget-handle-shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#0F172A" floodOpacity="0.25" />
                </filter>
            </defs>

            <GraphFrame opacity={opacity("frame")} />

            {/* Readouts: the money you set, the minutes the graph gives back */}
            <g fontSize="12" style={{ fontVariantNumeric: "tabular-nums", ...EASE_150 }}>
                <text x={24} y={30} fill={ACCENT} opacity={opacity("budgetLine")}>
                    {`budget ${money(budget)}`}
                </text>
                <text
                    x={VIEW_WIDTH - 24}
                    y={30}
                    fill={PARTNER}
                    textAnchor="end"
                    opacity={opacity("frame")}
                >
                    {`buys ${Math.round(minutes)} min of riding`}
                </text>
            </g>

            {/* The cost line is now the given structure, not the accent */}
            <g opacity={opacity("frame")} style={EASE_150}>
                <line
                    x1={xPx(0)}
                    y1={yPx(costAt(0))}
                    x2={xPx(X_MAX)}
                    y2={yPx(costAt(X_MAX))}
                    stroke={INK_STRUCTURE}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                />
                <text x={VIEW_WIDTH - 28} y={56} fontSize="11" fill={INK_STRUCTURE} textAnchor="end">
                    cost of the ride
                </text>
            </g>

            {/* Where the budget meets the cost, and the minutes below it */}
            {canRide && (
                <g opacity={opacity("frame")} style={EASE_150}>
                    <line
                        x1={crossingX}
                        y1={budgetY}
                        x2={crossingX}
                        y2={PLOT_BOTTOM}
                        stroke={PARTNER}
                        strokeWidth="2"
                        strokeDasharray="5 4"
                    />
                    <circle cx={crossingX} cy={PLOT_BOTTOM} r="6" fill={PARTNER} />
                    <text
                        x={labelX}
                        y={PLOT_BOTTOM - 12}
                        fontSize="11"
                        fill={PARTNER}
                        textAnchor={labelAnchor}
                        style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                        {`${Math.round(minutes)} min`}
                    </text>
                </g>
            )}

            {!canRide && (
                <text
                    x={PLOT_LEFT + 12}
                    y={budgetY - 14}
                    fontSize="11"
                    fill={INK}
                    opacity={opacity("frame")}
                >
                    not even enough to unlock
                </text>
            )}

            {/* The draggable budget line */}
            <g opacity={opacity("budgetLine")} style={EASE_150} {...hoverProps("budgetLine")}>
                <Halo active={isActive("budgetLine")}>
                    <line
                        x1={PLOT_LEFT}
                        y1={budgetY}
                        x2={PLOT_RIGHT}
                        y2={budgetY}
                        stroke={ACCENT}
                        strokeWidth="10"
                        strokeLinecap="round"
                    />
                </Halo>
                <line
                    x1={PLOT_LEFT}
                    y1={budgetY}
                    x2={PLOT_RIGHT}
                    y2={budgetY}
                    stroke={ACCENT}
                    strokeWidth={weight("budgetLine", 3)}
                    strokeLinecap="round"
                    style={EASE_150}
                />
                {canRide && <circle cx={crossingX} cy={budgetY} r="7" fill={ACCENT} />}
                <g transform={`translate(${handleX} ${budgetY}) scale(${handleScale})`}>
                    <circle r="11" fill={ACCENT} filter="url(#budget-handle-shadow)" />
                </g>
                <rect
                    x={PLOT_LEFT}
                    y={budgetY - 14}
                    width={PLOT_RIGHT - PLOT_LEFT}
                    height={28}
                    fill="transparent"
                    style={{ cursor: dragging ? "grabbing" : "grab", touchAction: "none" }}
                    {...dragHandlers}
                />
            </g>
        </svg>
    );
}

function BudgetFigure() {
    const setVar = useSetVar();
    return (
        <Figure
            id="budget-line"
            onReset={() => setVar("rideBudget", DEFAULT_BUDGET)}
            caption="Drag the teal budget line up and down. Where it meets the cost line, the dashed drop shows the minutes that money buys."
        >
            <BudgetDrawing />
            <div className="px-6 pb-5">
                <FigureSlider
                    varName="rideBudget"
                    label="Money available"
                    {...numberPropsFromDefinition(getVariableInfo("rideBudget"))}
                    formatValue={money}
                />
            </div>
            <InteractionHintSequence
                hintKey="budget-line-drag"
                steps={[
                    {
                        gesture: "drag-vertical",
                        label: "Drag the teal budget line up or down",
                        position: { x: "89%", y: "60%" },
                        dragPath: {
                            type: "line",
                            startOffset: { x: 0, y: 22 },
                            endOffset: { x: 0, y: -22 },
                        },
                    },
                ]}
            />
        </Figure>
    );
}

export const budgetSectionBlocks: ReactElement[] = [
    <StackLayout key="layout-budget-heading" maxWidth="xl">
        <Block id="budget-heading" padding="md">
            <EditableH2 id="h2-budget-heading" blockId="budget-heading">
                Working Backwards from a Budget
            </EditableH2>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-budget-setup" maxWidth="xl">
        <Block id="budget-setup" padding="sm">
            <EditableParagraph id="para-budget-setup" blockId="budget-setup">
                Now flip the question: you know the money, not the minutes. With{" "}
                <InlineScrubbleNumber
                    varName="rideBudget"
                    {...numberPropsFromDefinition(getVariableInfo("rideBudget"))}
                    formatValue={money}
                />{" "}
                in your account, the{" "}
                <InlineLinkedHighlight
                    varName="scooterHighlight"
                    highlightId="budgetLine"
                    {...linkedHighlightPropsFromDefinition(getVariableInfo("scooterHighlight"))}
                >
                    teal budget line
                </InlineLinkedHighlight>{" "}
                meets the cost line above <AffordableMinutesText /> minutes. Drag that line
                up or down and the answer on the bottom axis moves with it.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-budget-figure" maxWidth="xl">
        <Block id="budget-line-figure" padding="sm" hasVisualization>
            <BudgetFigure />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-budget-reflection" maxWidth="xl">
        <Block id="budget-reflection" padding="sm">
            <EditableParagraph id="para-budget-reflection" blockId="budget-reflection">
                Reading down from a cost is the same graph doing the opposite job. Drop the
                budget under three dollars and the two lines never meet, because the unlock
                fee alone has eaten it.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-budget-question" maxWidth="xl">
        <Block id="budget-question" padding="md">
            <EditableParagraph id="para-budget-question" blockId="budget-question">
                A friend has exactly six dollars to spend. How many minutes of riding does
                that buy?{" "}
                <InlineFeedback
                    varName="answerMinutesFor6"
                    correctValue={["6", "6 minutes", "6 min"]}
                    position="standalone"
                    successMessage="That's it! Three dollars unlocks the scooter, and the other three buy six minutes"
                    failureMessage="Not quite!"
                    hint="Take the unlock fee off the six dollars first, then count the half-dollar minutes that are left"
                    visualizationHint={{
                        blockId: "budget-line-figure",
                        hintKey: "feedback-budget-six",
                        label: "Find it on the graph",
                        steps: [
                            {
                                gesture: "drag-vertical",
                                label: "Drag the teal budget line to six dollars",
                                position: { x: "89%", y: "60%" },
                                dragPath: {
                                    type: "line",
                                    startOffset: { x: 0, y: 16 },
                                    endOffset: { x: 0, y: -16 },
                                },
                                completionVar: "rideBudget",
                                completionValue: 6,
                                completionTolerance: 0.4,
                            },
                        ],
                        resetVars: { rideBudget: DEFAULT_BUDGET },
                    }}
                >
                    <InlineClozeInput
                        varName="answerMinutesFor6"
                        correctAnswer={["6", "6 minutes", "6 min"]}
                        {...clozePropsFromDefinition(getVariableInfo("answerMinutesFor6"))}
                    />
                </InlineFeedback>
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
