/**
 * Section 5 — the close. Keeps the promise the opening made, names the two
 * numbers worth carrying away, and points at what comes next. No new idea, no
 * visual, no question.
 */

import { type ReactElement } from "react";
import { StackLayout } from "@/components/layouts";
import { Block } from "@/components/templates";
import { EditableH2, EditableParagraph, InlineTooltip } from "@/components/atoms";

export const wrapUpSectionBlocks: ReactElement[] = [
    <StackLayout key="layout-wrap-up-heading" maxWidth="xl">
        <Block id="wrap-up-heading" padding="md">
            <EditableH2 id="h2-wrap-up-heading" blockId="wrap-up-heading">
                Wrapping Up
            </EditableH2>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-wrap-up-move" maxWidth="xl">
        <Block id="wrap-up-move" padding="sm">
            <EditableParagraph id="para-wrap-up-move" blockId="wrap-up-move">
                Every question here came down to one move: find your number on one axis,
                travel across to the line, and read off the other axis. Going up from
                minutes gave you a cost, and coming down from a cost gave you minutes. The
                line did the algebra for you.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-wrap-up-next" maxWidth="xl">
        <Block id="wrap-up-next" padding="sm">
            <EditableParagraph id="para-wrap-up-next" blockId="wrap-up-next">
                Two numbers shaped that line:{" "}
                <InlineTooltip
                    id="tooltip-wrap-up-intercept"
                    tooltip="The cost at zero minutes, which here is the unlock fee. On a graph this starting value is called the y-intercept."
                    color="#D9921A"
                    bgColor="rgba(247, 178, 59, 0.18)"
                >
                    where it starts
                </InlineTooltip>
                , and{" "}
                <InlineTooltip
                    id="tooltip-wrap-up-gradient"
                    tooltip="The cost added for each extra minute. On a graph this rate of rise is called the gradient, or slope."
                    color="#6E70E8"
                    bgColor="rgba(142, 144, 245, 0.16)"
                >
                    how fast it rises
                </InlineTooltip>
                . The
                unlock fee was the easy one to forget, and forgetting it was wrong by three
                dollars every single time. Next you will put two lines on one graph, which
                is how you settle whether the scooter or the bus is the better deal.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
