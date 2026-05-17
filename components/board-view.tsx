"use client";

import { useState, useCallback } from "react";
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
    type DragStartEvent,
    type DragEndEvent,
    type DragOverEvent,
} from "@dnd-kit/core";
import {
    sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { useStore } from "@/lib/store";
import { KanbanLane } from "./kanban-lane";
import { KanbanCardOverlay } from "./kanban-card";
import { Toolbar } from "./toolbar";
import type { Card } from "@/lib/types";
import { Star, Layers, PanelLeftOpen } from "lucide-react";

export function BoardView() {
    const {
        activeBoardId,
        boards,
        getBoardLanes,
        moveCard,
        reorderCards,
        getLaneCards,
        toggleBoardFavorite,
        toggleSidebar,
    } = useStore();

    const board = boards.find((b) => b.id === activeBoardId);
    const lanes = activeBoardId ? getBoardLanes(activeBoardId) : [];

    const [activeCard, setActiveCard] = useState<Card | null>(null);

    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: { distance: 5 },
        }),
        useSensor(TouchSensor, {
            activationConstraint: { distance: 6 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = useCallback(
        (event: DragStartEvent) => {
            const data = event.active.data.current;
            if (data?.type === "card") {
                setActiveCard(data.card as Card);
            }
        },
        []
    );

    const handleDragOver = useCallback(
        (event: DragOverEvent) => {
            const { active, over } = event;
            if (!over) return;

            const activeData = active.data.current;
            const overData = over.data.current;

            if (activeData?.type !== "card") return;

            const activeCardId = active.id as string;
            const card = useStore.getState().cards.find((c) => c.id === activeCardId);
            if (!card) return;

            let targetLaneId: string | null = null;

            if (overData?.type === "card") {
                const overCard = useStore.getState().cards.find((c) => c.id === over.id);
                if (overCard) targetLaneId = overCard.laneId;
            } else if (overData?.type === "lane") {
                targetLaneId = overData.laneId as string;
            } else if (overData?.type === "lane-sortable") {
                targetLaneId = overData.lane.id as string;
            }

            if (targetLaneId && targetLaneId !== card.laneId) {
                const targetCards = getLaneCards(targetLaneId);
                let newOrder = targetCards.length;

                if (overData?.type === "card") {
                    const overCard = targetCards.find((c) => c.id === over.id);
                    if (overCard) newOrder = overCard.order;
                }

                moveCard(activeCardId, targetLaneId, newOrder);
            }
        },
        [moveCard, getLaneCards]
    );

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;
            setActiveCard(null);

            if (!over) return;

            const activeData = active.data.current;
            const overData = over.data.current;

            // Card reorder within same lane
            if (activeData?.type === "card" && overData?.type === "card") {
                const activeCardObj = useStore.getState().cards.find((c) => c.id === active.id);
                const overCardObj = useStore.getState().cards.find((c) => c.id === over.id);

                if (activeCardObj && overCardObj && activeCardObj.laneId === overCardObj.laneId) {
                    const laneCards = getLaneCards(activeCardObj.laneId);
                    const cardIds = laneCards.map((c) => c.id);
                    const oldIdx = cardIds.indexOf(activeCardObj.id);
                    const newIdx = cardIds.indexOf(overCardObj.id);
                    if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
                        const newOrder = [...cardIds];
                        const [moved] = newOrder.splice(oldIdx, 1);
                        newOrder.splice(newIdx, 0, moved);
                        reorderCards(activeCardObj.laneId, newOrder);
                    }
                }
            }
        },
        [reorderCards, getLaneCards]
    );

    if (!board) {
        return (
            <div className="flex-1 flex items-center justify-center bg-bg-primary px-4">
                <div className="text-center max-w-[280px]">
                    <button
                        onClick={toggleSidebar}
                        className="mb-3 inline-flex items-center gap-1.5 rounded-md border border-border-subtle px-2.5 py-1.5 text-[12px] text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-theme md:hidden"
                    >
                        <PanelLeftOpen size={13} />
                        Boards
                    </button>
                    <div className="w-10 h-10 rounded-lg bg-bg-tertiary flex items-center justify-center mx-auto mb-3">
                        <Layers size={18} className="text-text-muted" />
                    </div>
                    <div className="text-[14px] text-text-secondary mb-1">No board selected</div>
                    <p className="text-[12px] text-text-muted leading-relaxed">
                        Create a new board or select one from the sidebar to get started.
                    </p>
                </div>
            </div>
        );
    }

    const totalCards = useStore.getState().cards.filter((c) => c.boardId === board.id && !c.archived).length;

    return (
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-bg-primary">
            {/* Board header */}
            <div className="flex min-h-12 items-center justify-between gap-3 px-3 py-2 sm:px-5 border-b border-border-subtle flex-shrink-0">
                <div className="flex min-w-0 items-center gap-2.5">
                    <button
                        onClick={toggleSidebar}
                        className="p-1.5 rounded-md hover:bg-bg-hover text-text-tertiary hover:text-text-secondary transition-theme md:hidden"
                        title="Open sidebar"
                    >
                        <PanelLeftOpen size={15} />
                    </button>
                    <h1 className="text-[14px] font-semibold text-text-primary tracking-tight truncate">
                        {board.title}
                    </h1>
                    {board.projectPath && (
                        <span className="hidden min-w-0 truncate text-[11px] text-text-muted font-mono sm:block">
                            {board.projectPath}
                        </span>
                    )}
                    <button
                        onClick={() => toggleBoardFavorite(board.id)}
                        className={cn(
                            "p-0.5 rounded transition-theme",
                            board.favorite
                                ? "text-accent-amber"
                                : "text-text-muted hover:text-text-tertiary"
                        )}
                        title={board.favorite ? "Unfavorite" : "Favorite"}
                    >
                        <Star size={13} fill={board.favorite ? "currentColor" : "none"} />
                    </button>
                </div>
                <div className="hidden shrink-0 items-center gap-3 text-[12px] text-text-muted font-mono tabular-nums sm:flex">
                    <span>{lanes.length} lanes</span>
                    <span className="text-border-strong">·</span>
                    <span>{totalCards} cards</span>
                </div>
            </div>

            {/* Toolbar */}
            <Toolbar />

            {/* Board canvas */}
            <div className="flex-1 touch-pan-y overflow-x-hidden overflow-y-auto px-3 py-3 sm:px-4 sm:py-4 xl:touch-auto xl:overflow-x-auto xl:overflow-y-hidden">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                >
                    <div className="flex min-h-full flex-col items-stretch gap-3 xl:h-full xl:flex-row xl:items-start">
                        {lanes.map((lane) => (
                            <KanbanLane key={lane.id} lane={lane} />
                        ))}
                    </div>

                    <DragOverlay>
                        {activeCard && <KanbanCardOverlay card={activeCard} />}
                    </DragOverlay>
                </DndContext>
            </div>
        </div>
    );
}

function cn(...classes: (string | boolean | undefined | null)[]) {
    return classes.filter(Boolean).join(" ");
}
