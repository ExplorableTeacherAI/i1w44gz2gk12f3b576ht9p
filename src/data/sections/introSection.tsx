/**
 * Section 1 — orientation. Plain narrative: the scooter scene, what the graph
 * is made of, and the promise the rest of the lesson keeps. No visual, no
 * question.
 */

import { type ReactElement } from "react";
import { StackLayout } from "@/components/layouts";
import { Block } from "@/components/templates";
import { EditableH1, EditableParagraph } from "@/components/atoms";

export const introSectionBlocks: ReactElement[] = [
    <StackLayout key="layout-intro-title" maxWidth="xl">
        <Block id="intro-title" padding="md">
            <EditableH1 id="h1-intro-title" blockId="intro-title">
                Solving Problems with a Graph
            </EditableH1>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-intro-hook" maxWidth="xl">
        <Block id="intro-hook" padding="sm">
            <EditableParagraph id="para-intro-hook" blockId="intro-hook">
                You tap the app, the scooter beeps, and the meter starts running. Two
                friends ride the same scooter for different lengths of time and get
                charged very different amounts. Neither of them does any arithmetic to
                work out why.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-intro-axes" maxWidth="xl">
        <Block id="intro-axes" padding="sm">
            <EditableParagraph id="para-intro-axes" blockId="intro-axes">
                Everything you need is already sitting in one straight line on a graph.
                Minutes ridden run along the bottom as x, and the cost in dollars rises
                up the side as y. You have read points off axes like these before.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-intro-promise" maxWidth="xl">
        <Block id="intro-promise" padding="sm">
            <EditableParagraph id="para-intro-promise" blockId="intro-promise">
                By the end of this page you will be able to look at that line and work
                out something nobody has told you, like exactly how long nine dollars
                keeps you rolling.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
