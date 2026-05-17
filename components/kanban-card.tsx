"use client";

import { useEffect, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Card, Priority } from "@/lib/types";
import {
    Calendar,
    CheckSquare,
    AlertTriangle,
    ArrowUp,
    ArrowDown,
    Minus,
    GripVertical,
    MessageSquare,
} from "lucide-react";
import { format, isPast, isToday } from "date-fns";

const priorityConfig: Record<Priority, { icon: typeof ArrowUp; label: string; class: string }> = {
    urgent: { icon: AlertTriangle, label: "Urgent", class: "text-priority-urgent" },
    high: { icon: ArrowUp, label: "High", class: "text-priority-high" },
    medium: { icon: Minus, label: "Medium", class: "text-priority-medium" },
    low: { icon: ArrowDown, label: "Low", class: "text-priority-low" },
};

function colorLabelClass(color: Card["colorLabel"]) {
    return cn(
        !color && "bg-text-primary",
        color === "blue" && "bg-accent-blue",
        color === "red" && "bg-accent-red",
        color === "amber" && "bg-accent-amber",
        color === "green" && "bg-accent-green",
        color === "purple" && "bg-accent-purple"
    );
}

export function KanbanCard({ card }: { card: Card }) {
    const setActiveCard = useStore((s) => s.setActiveCard);
    const [useWholeCardDrag, setUseWholeCardDrag] = useState(false);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: card.id,
        data: { type: "card", card },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    useEffect(() => {
        const query = window.matchMedia("(min-width: 1280px)");
        const updateDragMode = () => setUseWholeCardDrag(query.matches);

        updateDragMode();
        query.addEventListener("change", updateDragMode);
        return () => query.removeEventListener("change", updateDragMode);
    }, []);

    const priority = priorityConfig[card.priority];
    const PriorityIcon = priority.icon;
    const completedChecklist = card.checklist.filter((c) => c.completed).length;
    const totalChecklist = card.checklist.length;
    const isOverdue = card.dueDate && isPast(new Date(card.dueDate)) && !isToday(new Date(card.dueDate));

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            layout
            layoutId={card.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: isDragging ? 0.3 : 1, y: 0 }}
            exit={{ opacity: 0, y: -6, transition: { duration: 0.12 } }}
            {...(useWholeCardDrag ? attributes : {})}
            {...(useWholeCardDrag ? listeners : {})}
            className={cn(
                "group relative overflow-hidden rounded-md border bg-bg-secondary border-border-subtle transition-theme hover:bg-bg-tertiary hover:border-border-default xl:cursor-grab xl:active:cursor-grabbing",
                isDragging && "opacity-30"
            )}
            onClick={() => setActiveCard(card.id)}
        >
            <div className={cn("absolute inset-x-0 top-0 h-[2px]", colorLabelClass(card.colorLabel))} />

            <div className="px-3 py-3">
                {/* Title row */}
                <div className="flex items-start gap-2">
                    <button
                        type="button"
                        {...attributes}
                        {...listeners}
                        onClick={(e) => e.stopPropagation()}
                        className="hidden touch-none -ml-1 mt-0.5 flex-shrink-0 rounded p-0.5 text-text-muted cursor-grab active:cursor-grabbing transition-theme hover:bg-bg-hover hover:text-text-secondary xl:flex xl:opacity-0 xl:group-hover:opacity-70"
                        title="Drag card"
                    >
                        <GripVertical size={13} />
                    </button>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div className="text-[13px] text-text-primary leading-[1.4] break-words">
                                {card.title}
                            </div>
                            {card.colorLabel && (
                                <div
                                    className={cn(
                                        "w-2 h-2 rounded-full mt-1 flex-shrink-0",
                                        colorLabelClass(card.colorLabel)
                                    )}
                                />
                            )}
                        </div>

                        {card.description && (
                            <div className="text-[12px] text-text-tertiary line-clamp-2 mt-1 leading-[1.5]">
                                {card.description}
                            </div>
                        )}

                        {/* Meta */}
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1.5">
                            {/* Priority */}
                            <span className={cn("inline-flex items-center", priority.class)} title={priority.label}>
                                <PriorityIcon size={12} />
                            </span>

                            {/* Due date */}
                            {card.dueDate && (
                                <span
                                    className={cn(
                                        "inline-flex items-center gap-1 text-[11px]",
                                        isOverdue ? "text-accent-red" : "text-text-tertiary"
                                    )}
                                >
                                    <Calendar size={11} />
                                    {format(new Date(card.dueDate), "MMM d")}
                                </span>
                            )}

                            {/* Checklist */}
                            {totalChecklist > 0 && (
                                <span
                                    className={cn(
                                        "inline-flex items-center gap-1 text-[11px]",
                                        completedChecklist === totalChecklist
                                            ? "text-accent-green"
                                            : "text-text-tertiary"
                                    )}
                                >
                                    <CheckSquare size={11} />
                                    {completedChecklist}/{totalChecklist}
                                </span>
                            )}

                            {/* Activity count */}
                            {card.activityLog.length > 1 && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-text-muted">
                                    <MessageSquare size={10} />
                                    {card.activityLog.length}
                                </span>
                            )}
                        </div>

                        {/* Tags */}
                        {card.tags.length > 0 && (
                            <div className="flex items-center gap-1 mt-2 flex-wrap">
                                {card.tags.slice(0, 3).map((tag) => (
                                    <span
                                        key={tag}
                                        className="inline-flex px-1.5 py-[1px] text-[10px] text-text-tertiary bg-bg-hover rounded"
                                    >
                                        {tag}
                                    </span>
                                ))}
                                {card.tags.length > 3 && (
                                    <span className="text-[10px] text-text-muted">
                                        +{card.tags.length - 3}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <button
                type="button"
                {...attributes}
                {...listeners}
                onClick={(e) => e.stopPropagation()}
                className="flex min-h-11 touch-none select-none items-center justify-center border-t border-border-subtle text-text-muted cursor-grab active:cursor-grabbing transition-theme hover:bg-bg-hover hover:text-text-secondary xl:hidden"
                title="Drag card"
            >
                <GripVertical size={16} />
            </button>
        </motion.div>
    );
}

/** Drag overlay */
export function KanbanCardOverlay({ card }: { card: Card }) {
    const priority = priorityConfig[card.priority];
    const PriorityIcon = priority.icon;

    return (
        <div className="drag-overlay relative overflow-hidden touch-none rounded-md border bg-bg-secondary border-accent-blue/30 w-[min(268px,calc(100vw-2rem))] shadow-[var(--shadow-lg)]">
            <div className={cn("absolute inset-x-0 top-0 h-[2px]", colorLabelClass(card.colorLabel))} />

            <div className="px-3 py-3">
                <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div className="text-[13px] text-text-primary leading-[1.4]">
                                {card.title}
                            </div>
                            {card.colorLabel && (
                                <div
                                    className={cn(
                                        "w-2 h-2 rounded-full mt-1 flex-shrink-0",
                                        colorLabelClass(card.colorLabel)
                                    )}
                                />
                            )}
                        </div>
                        {card.description && (
                            <div className="text-[12px] text-text-tertiary line-clamp-2 mt-1 leading-[1.5]">
                                {card.description}
                            </div>
                        )}
                        <div className="flex items-center gap-2 mt-1.5">
                            <span className={cn("inline-flex items-center", priority.class)}>
                                <PriorityIcon size={12} />
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
