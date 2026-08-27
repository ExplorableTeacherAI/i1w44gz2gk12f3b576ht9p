/**
 * Section 3 — the misconception head-on. The student commits to a guess for a
 * ten minute ride BEFORE the line appears, then the reveal shows both the real
 * line and the "rate only" line three dollars below it.
 */

import React, { useRef, useState, type ReactElement } from "react";
import { StackLayout } from "@/components/layouts";
import { Block } from "@/components/templates";
import {
    Button,
    EditableH2,
    EditableParagraph,
    InlineClozeChoice,
    InlineClozeInput,
    InlineFeedback,
    InlineLinkedHighlight,
    InteractionHintSequence,
} from "@/components/atoms";
import { Figure, FigureSlider } from "@/components/molecules";
import { useVar, useSetVar } from "@/stores";
import { clamp, useSpring } from "@/lib/motion";
import {
    choicePropsFromDefinition,
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
    INK_STRUCTURE,
    PLOT_BOTTOM,
    PLOT_TOP,
    RATE_PER_MINUTE,
    VIEW_HEIGHT,
    VIEW_WIDTH,
    X_MAX,
    Y_MAX,
    costAt,
    dollarsFromPx,
    money,
    svgPointFromEvent,
    useScooterHighlight,
    xPx,
    yPx,
} from "./scooterGraphShared";

const QUESTION_MINUTES = 10;
const DEFAULT_GUESS = 6.5;
const TRUE_COST = costAt(QUESTION_MINUTES); // 8.00
const RATE_ONLY_COST = RATE_PER_MINUTE * QUESTION_MINUTES; // 5.00

function GuessDrawing() {
    const setVar = useSetVar();
    const guess = useVar<number>("guessCost", DEFAULT_GUESS);
    const revealed = useVar<boolean>("feeRevealed", false);
    const { opacity, weight, isActive, hoverProps } = useScooterHighlight();

    const [dragging, setDragging] = useState(false);
    const [hovered, setHovered] = useState(false);
    const draggingRef = useRef(false);
    const svgRef = useRef<SVGSVGElement>(null);
    const handleScale = useSpring(dragging || hovered ? 1.15 : 1, {
        stiffness: 400,
        damping: 26,
    });

    const guessX = xPx(QUESTION_MINUTES);
    const guessY = yPx(guess);

    const handlePointerMove = (event: React.PointerEvent<SVGCircleElement>) => {
        if (!draggingRef.current) return;
        const point = svgPointFromEvent(event, svgRef.current);
        const dollars = clamp(dollarsFromPx(point.y), 0, Y_MAX);
        setVar("guessCost", Math.round(dollars * 2) / 2);
    };

    const gapX = guessX + 16;

    return (
        <svg
            ref={svgRef}
            viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
            className="block w-full select-none"
            role="img"
            aria-label="Cost graph with a draggable guess marker on the ten minute line"
        >
            <defs>
                <filter id="guess-handle-shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#0F172A" floodOpacity="0.25" />
                </filter>
            </defs>

            <GraphFrame opacity={opacity("frame")} />

            {/* Readouts */}
            <g fontSize="12" style={{ fontVariantNumeric: "tabular-nums", ...EASE_150 }}>
                {revealed ? (
                    <>
                        <text x={24} y={30} fill={INK_STRUCTURE} opacity={opacity("readout")}>
                            {`your guess ${money(guess)}`}
                        </text>
                        <text
                            x={VIEW_WIDTH - 24}
                            y={30}
                            fill={ACCENT}
                            textAnchor="end"
                            opacity={opacity("readout")}
                        >
                            {`actual ${money(TRUE_COST)}`}
                        </text>
                    </>
                ) : (
                    <text
                        x={VIEW_WIDTH / 2}
                        y={30}
                        fill={INK}
                        textAnchor="middle"
                        opacity={opacity("readout")}
                    >
                        A 10 minute ride — where will the cost land?
                    </text>
                )}
            </g>

            {/* The ten minute line the guess slides along */}
            <g opacity={opacity("frame")} style={EASE_150}>
                <line
                    x1={guessX}
                    y1={PLOT_BOTTOM}
                    x2={guessX}
                    y2={PLOT_TOP}
                    stroke={INK_QUIET}
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                />
                <text
                    x={guessX}
                    y={PLOT_BOTTOM + 20}
                    fontSize="11"
                    fill={INK_STRUCTURE}
                    textAnchor="middle"
                >
                    10 min
                </text>
            </g>

            {revealed && (
                <>
                    {/* What the ride would cost with no unlock fee */}
                    <g
                        opacity={opacity("rateOnly")}
                        style={{ ...EASE_150, cursor: "default" }}
                        {...hoverProps("rateOnly")}
                    >
                        <Halo active={isActive("rateOnly")}>
                            <line
                                x1={xPx(0)}
                                y1={yPx(0)}
                                x2={xPx(X_MAX)}
                                y2={yPx(RATE_PER_MINUTE * X_MAX)}
                                stroke={INK_STRUCTURE}
                                strokeWidth="9"
                                strokeLinecap="round"
                            />
                        </Halo>
                        <line
                            x1={xPx(0)}
                            y1={yPx(0)}
                            x2={xPx(X_MAX)}
                            y2={yPx(RATE_PER_MINUTE * X_MAX)}
                            stroke={INK_STRUCTURE}
                            strokeWidth={weight("rateOnly", 2)}
                            strokeDasharray="6 5"
                            strokeLinecap="round"
                            style={EASE_150}
                        />
                        <circle cx={guessX} cy={yPx(RATE_ONLY_COST)} r="5" fill={INK_STRUCTURE} />
                        <text
                            x={520}
                            y={yPx(RATE_PER_MINUTE * X_MAX) + 20}
                            fontSize="11"
                            fill={INK_STRUCTURE}
                            textAnchor="end"
                        >
                            no unlock fee
                        </text>
                    </g>

                    {/* The real cost line */}
                    <g opacity={opacity("realLine")} style={EASE_150}>
                        <line
                            x1={xPx(0)}
                            y1={yPx(costAt(0))}
                            x2={xPx(X_MAX)}
                            y2={yPx(costAt(X_MAX))}
                            stroke={ACCENT}
                            strokeWidth="3"
                            strokeLinecap="round"
                        />
                        <circle cx={guessX} cy={yPx(TRUE_COST)} r="7" fill={ACCENT} />
                    </g>

                    {/* The three dollar gap between them */}
                    <g
                        opacity={opacity("gap")}
                        style={{ ...EASE_150, cursor: "default" }}
                        {...hoverProps("gap")}
                    >
                        <Halo active={isActive("gap")}>
                            <line
                                x1={gapX}
                                y1={yPx(RATE_ONLY_COST)}
                                x2={gapX}
                                y2={yPx(TRUE_COST)}
                                stroke={ACCENT}
                                strokeWidth="10"
                                strokeLinecap="round"
                            />
                        </Halo>
                        <line
                            x1={gapX}
                            y1={yPx(RATE_ONLY_COST)}
                            x2={gapX}
                            y2={yPx(TRUE_COST)}
                            stroke={ACCENT}
                            strokeWidth={weight("gap", 3)}
                            strokeLinecap="round"
                            style={EASE_150}
                        />
                        <line
                            x1={gapX - 5}
                            y1={yPx(RATE_ONLY_COST)}
                            x2={gapX + 5}
                            y2={yPx(RATE_ONLY_COST)}
                            stroke={ACCENT}
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                        <line
                            x1={gapX - 5}
                            y1={yPx(TRUE_COST)}
                            x2={gapX + 5}
                            y2={yPx(TRUE_COST)}
                            stroke={ACCENT}
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                        <text x={gapX + 10} y={193} fontSize="11" fill={INK}>
                            +$3 unlock fee
                        </text>
                    </g>
                </>
            )}

            {/* The student's committed guess */}
            <g opacity={opacity("guess")} style={EASE_150}>
                <line
                    x1={xPx(0)}
                    y1={guessY}
                    x2={guessX}
                    y2={guessY}
                    stroke={revealed ? INK_QUIET : ACCENT}
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    opacity={0.8}
                />
                {!revealed && (
                    <text
                        x={guessX - 30}
                        y={guessY - 12}
                        fontSize="11"
                        fill={INK}
                        textAnchor="end"
                        style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                        {`your guess ${money(guess)}`}
                    </text>
                )}
                <g transform={`translate(${guessX} ${guessY}) scale(${handleScale})`}>
                    <circle
                        r="11"
                        fill={revealed ? "#FFFFFF" : ACCENT}
                        stroke={revealed ? INK_STRUCTURE : ACCENT}
                        strokeWidth="2.5"
                        filter="url(#guess-handle-shadow)"
                    />
                </g>
                <circle
                    cx={guessX}
                    cy={guessY}
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

function GuessFigure() {
    const setVar = useSetVar();
    const guess = useVar<number>("guessCost", DEFAULT_GUESS);
    const revealed = useVar<boolean>("feeRevealed", false);
    const hasGuessed = guess !== DEFAULT_GUESS;

    return (
        <Figure
            id="unlock-fee-guess"
            onReset={() => {
                setVar("guessCost", DEFAULT_GUESS);
                setVar("feeRevealed", false);
            }}
            caption="Place your guess for a 10 minute ride on the dashed line, then reveal the real cost. The reset arrow hides it again."
        >
            <GuessDrawing />
            <div className="flex flex-col gap-3 px-6 pb-5">
                <FigureSlider
                    varName="guessCost"
                    label="Your guess"
                    {...numberPropsFromDefinition(getVariableInfo("guessCost"))}
                    formatValue={money}
                />
                <Button
                    variant="outline"
                    size="sm"
                    className="self-start"
                    disabled={!hasGuessed || revealed}
                    onClick={() => setVar("feeRevealed", true)}
                >
                    {revealed ? "Real cost shown" : "Show the real cost"}
                </Button>
            </div>
            <InteractionHintSequence
                hintKey="unlock-fee-guess-drag"
                steps={[
                    {
                        gesture: "drag-vertical",
                        label: "Drag the teal marker to your guess",
                        position: { x: "53%", y: "53%" },
                        dragPath: {
                            type: "line",
                            startOffset: { x: 0, y: 24 },
                            endOffset: { x: 0, y: -24 },
                        },
                    },
                ]}
            />
        </Figure>
    );
}

export const unlockFeeSectionBlocks: ReactElement[] = [
    <StackLayout key="layout-unlock-fee-heading" maxWidth="xl">
        <Block id="unlock-fee-heading" padding="md">
            <EditableH2 id="h2-unlock-fee-heading" blockId="unlock-fee-heading">
                Don't Forget the Unlock Fee
            </EditableH2>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-unlock-fee-setup" maxWidth="xl">
        <Block id="unlock-fee-setup" padding="sm">
            <EditableParagraph id="para-unlock-fee-setup" blockId="unlock-fee-setup">
                Here is a ten minute ride with the line hidden. Drag the teal marker up or
                down the dashed ten minute line to where you think the cost lands, then
                press show the real cost.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-unlock-fee-figure" maxWidth="xl">
        <Block id="unlock-fee-figure" padding="sm" hasVisualization>
            <GuessFigure />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-unlock-fee-reflection" maxWidth="xl">
        <Block id="unlock-fee-reflection" padding="sm">
            <EditableParagraph id="para-unlock-fee-reflection" blockId="unlock-fee-reflection">
                Most first guesses land on five dollars, which is fifty cents times ten and
                nothing else. The{" "}
                <InlineLinkedHighlight
                    varName="scooterHighlight"
                    highlightId="rateOnly"
                    {...linkedHighlightPropsFromDefinition(getVariableInfo("scooterHighlight"))}
                >
                    dashed line
                </InlineLinkedHighlight>{" "}
                is exactly that ride, and the real cost sits{" "}
                <InlineLinkedHighlight
                    varName="scooterHighlight"
                    highlightId="gap"
                    {...linkedHighlightPropsFromDefinition(getVariableInfo("scooterHighlight"))}
                >
                    three dollars
                </InlineLinkedHighlight>{" "}
                above it, because the scooter charges you before you move.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-unlock-fee-question-cost" maxWidth="xl">
        <Block id="unlock-fee-question-cost" padding="md">
            <EditableParagraph id="para-unlock-fee-question-cost" blockId="unlock-fee-question-cost">
                Now a shorter trip. What does a 6 minute ride cost in dollars?{" "}
                <InlineFeedback
                    varName="answerCostAt6"
                    correctValue={["6", "$6", "6.00", "$6.00", "6 dollars"]}
                    position="standalone"
                    successMessage="Yes! Three dollars to unlock plus three dollars of riding"
                    failureMessage="That answer counts the riding time and leaves the unlock fee out."
                    hint="Six minutes of riding is three dollars, and the scooter charged you before you moved"
                    visualizationHint={{
                        blockId: "ride-line-figure",
                        hintKey: "feedback-unlock-fee-six",
                        label: "Check it on the line",
                        steps: [
                            {
                                gesture: "drag",
                                label: "Drag the teal marker left until it reads 6 minutes",
                                position: { x: "45%", y: "51%" },
                                dragPath: {
                                    type: "line",
                                    startOffset: { x: 20, y: -10 },
                                    endOffset: { x: -20, y: 10 },
                                },
                                completionVar: "rideMinutes",
                                completionValue: 6,
                                completionTolerance: 0.6,
                            },
                        ],
                        resetVars: { rideMinutes: 8 },
                    }}
                >
                    <InlineClozeInput
                        varName="answerCostAt6"
                        correctAnswer={["6", "$6", "6.00", "$6.00", "6 dollars"]}
                        {...clozePropsFromDefinition(getVariableInfo("answerCostAt6"))}
                    />
                </InlineFeedback>
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-unlock-fee-question-shift" maxWidth="xl">
        <Block id="unlock-fee-question-shift" padding="md">
            <EditableParagraph id="para-unlock-fee-question-shift" blockId="unlock-fee-question-shift">
                Compared with the dashed line, the unlock fee shifts the whole cost line{" "}
                <InlineFeedback
                    varName="answerFeeShift"
                    correctValue="up"
                    position="terminal"
                    successMessage="— right, every single point lifts by the same three dollars"
                    failureMessage="— look at the two lines again"
                    hint="The gap between them is three dollars at one minute and still three dollars at twenty"
                    reviewBlockId="unlock-fee-figure"
                    reviewLabel="Look at the two lines again"
                >
                    <InlineClozeChoice
                        varName="answerFeeShift"
                        correctAnswer="up"
                        options={["up", "down", "steeper", "flatter"]}
                        {...choicePropsFromDefinition(getVariableInfo("answerFeeShift"))}
                    />
                </InlineFeedback>.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
