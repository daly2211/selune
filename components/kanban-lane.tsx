"use client";

import { useState, useRef, useEffect } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { KanbanCard } from "./kanban-card";
import {
    Plus,
    MoreHorizontal,
    ChevronDown,
    ChevronRight,
    Trash2,
    Pencil,
    GripVertical,
} from "lucide-react";
import type { Lane as LaneType } from "@/lib/types";

const statusColors: Record<string, string> = {
    "to do": "bg-status-todo",
    "todo": "bg-status-todo",
    "backlog": "bg-status-todo",
    "in progress": "bg-status-progress",
    "in review": "bg-status-progress",
    "review": "bg-status-progress",
    "done": "bg-status-done",
    "complete": "bg-status-done",
    "completed": "bg-status-done",
};

function getStatusColor(title: string) {
    const lower = title.toLowerCase();
    for (const [key, value] of Object.entries(statusColors)) {
        if (lower.includes(key)) return value;
    }
    return "bg-text-muted";
}

export function KanbanLane({ lane }: { lane: LaneType }) {
    const {
        getFilteredCards,
        createCard,
        updateLane,
        deleteLane,
        toggleLaneCollapse,
        filters,
    } = useStore();

    const cards = getFilteredCards(lane.id);
    const hasActiveFilters =
        filters.search || filters.priorities.length > 0 || filters.tags.length > 0 || filters.dueDateRange;

    const [isAdding, setIsAdding] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [showMenu, setShowMenu] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(lane.title);

    const addInputRef = useRef<HTMLInputElement>(null);
    const editInputRef = useRef<HTMLInputElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const { setNodeRef: setDroppableRef } = useDroppable({
        id: `lane-drop-${lane.id}`,
        data: { type: "lane", laneId: lane.id },
    });

    const {
        attributes,
        listeners,
        setNodeRef: setSortableRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: `lane-${lane.id}`,
        data: { type: "lane-sortable", lane },
        disabled: lane.locked,
    });

    const sortableStyle = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    useEffect(() => {
        if (isAdding && addInputRef.current) addInputRef.current.focus();
    }, [isAdding]);

    useEffect(() => {
        if (isEditing && editInputRef.current) editInputRef.current.focus();
    }, [isEditing]);

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    function handleAddCard() {
        if (newTitle.trim()) {
            void createCard(lane.id, newTitle.trim());
            setNewTitle("");
        }
    }

    function handleEditCommit() {
        if (editTitle.trim()) {
            updateLane(lane.id, { title: editTitle.trim() });
        }
        setIsEditing(false);
    }

    return (
        <div
            ref={setSortableRef}
            style={sortableStyle}
            className={cn(
                "flex-shrink-0 w-[280px] flex flex-col max-h-full",
                isDragging && "opacity-30"
            )}
        >
            {/* Header */}
            <div className="flex items-center gap-1 px-1 py-2 group">
                {!lane.locked && (
                    <button
                        {...attributes}
                        {...listeners}
                        className="p-0.5 rounded opacity-0 group-hover:opacity-30 hover:!opacity-80 cursor-grab active:cursor-grabbing text-text-muted transition-opacity"
                    >
                        <GripVertical size={13} />
                    </button>
                )}

                <button
                    onClick={() => toggleLaneCollapse(lane.id)}
                    className="p-0.5 text-text-muted hover:text-text-tertiary transition-theme"
                >
                    {lane.collapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                </button>

                {/* Status dot */}
                <span className={cn("w-2 h-2 rounded-full flex-shrink-0", getStatusColor(lane.title))} />

                {isEditing ? (
                    <input
                        ref={editInputRef}
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={handleEditCommit}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleEditCommit();
                            if (e.key === "Escape") setIsEditing(false);
                        }}
                        className="flex-1 px-1.5 py-0.5 text-[13px] font-medium bg-bg-tertiary border border-border-strong rounded text-text-primary outline-none"
                    />
                ) : (
                    <span className="flex-1 text-[13px] font-medium text-text-secondary tracking-tight truncate">
                        {lane.title}
                    </span>
                )}

                <span className="text-[11px] text-text-muted font-mono tabular-nums mr-0.5">
                    {cards.length}
                    {lane.laneLimit ? `/${lane.laneLimit}` : ""}
                </span>

                <div className="relative flex items-center gap-0.5">
                    {!lane.locked && (
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-bg-hover text-text-muted hover:text-text-secondary transition-theme"
                        >
                            <MoreHorizontal size={14} />
                        </button>
                    )}

                    {lane.key === "backlog" && (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-bg-hover text-text-muted hover:text-text-secondary transition-theme"
                            title="Add card"
                        >
                            <Plus size={14} />
                        </button>
                    )}

                    {showMenu && !lane.locked && (
                        <div
                            ref={menuRef}
                            className="absolute right-0 top-full mt-1 w-40 bg-bg-elevated border border-border-default rounded-lg shadow-[var(--shadow-popup)] z-50 py-1"
                        >
                            <button
                                onClick={() => {
                                    setIsEditing(true);
                                    setShowMenu(false);
                                }}
                                className="w-full px-3 py-[6px] text-left text-[13px] text-text-secondary hover:bg-bg-hover hover:text-text-primary flex items-center gap-2.5 transition-theme"
                            >
                                <Pencil size={13} className="opacity-60" />
                                Rename
                            </button>
                            <div className="h-px bg-border-subtle mx-2 my-1" />
                            <button
                                onClick={() => {
                                    deleteLane(lane.id);
                                    setShowMenu(false);
                                }}
                                className="w-full px-3 py-[6px] text-left text-[13px] text-accent-red hover:bg-accent-red-subtle flex items-center gap-2.5 transition-theme"
                            >
                                <Trash2 size={13} />
                                Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Cards */}
            {!lane.collapsed && (
                <div
                    ref={setDroppableRef}
                    className="flex-1 overflow-y-auto px-0.5 pb-2 space-y-1 lane-scroll min-h-[48px]"
                >
                    <SortableContext
                        items={cards.map((c) => c.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <AnimatePresence mode="popLayout">
                            {cards.map((card) => (
                                <KanbanCard key={card.id} card={card} />
                            ))}
                        </AnimatePresence>
                    </SortableContext>

                    {cards.length === 0 && !isAdding && (
                        <div className="py-8 text-center">
                            <p className="text-[11px] text-text-muted">
                                {hasActiveFilters ? "No matching cards" : "No cards"}
                            </p>
                        </div>
                    )}

                    {/* Quick add */}
                    {isAdding && (
                        <div className="px-0.5 mt-1">
                            <input
                                ref={addInputRef}
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleAddCard();
                                    if (e.key === "Escape") {
                                        setIsAdding(false);
                                        setNewTitle("");
                                    }
                                }}
                                onBlur={() => {
                                    if (!newTitle.trim()) {
                                        setIsAdding(false);
                                        setNewTitle("");
                                    }
                                }}
                                placeholder="Card title…"
                                className="w-full px-3 py-2 text-[13px] bg-bg-secondary border border-border-default rounded-md text-text-primary placeholder:text-text-muted outline-none focus:border-accent-blue-muted transition-theme"
                            />
                            <div className="flex items-center gap-1.5 mt-1.5">
                                <button
                                    onClick={handleAddCard}
                                    className="px-3 py-1 text-[12px] font-medium bg-accent-blue text-white rounded-md hover:bg-accent-blue-muted transition-theme"
                                >
                                    Add
                                </button>
                                <button
                                    onClick={() => {
                                        setIsAdding(false);
                                        setNewTitle("");
                                    }}
                                    className="px-3 py-1 text-[12px] text-text-tertiary hover:text-text-secondary transition-theme"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {lane.collapsed && (
                <div className="px-2 pb-2">
                    <div className="text-[11px] text-text-muted">{cards.length} cards</div>
                </div>
            )}
        </div>
    );
}
