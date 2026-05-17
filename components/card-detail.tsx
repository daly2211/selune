"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Priority, ChecklistItem } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
    X,
    Calendar,
    CheckSquare,
    Plus,
    Trash2,
    Copy,
    Archive,
    AlertTriangle,
    ArrowUp,
    ArrowDown,
    Minus,
    Clock,
    MessageSquare,
    GripVertical,
    Bold,
    Italic,
    List,
} from "lucide-react";

const priorities: { value: Priority; label: string; icon: typeof ArrowUp; class: string }[] = [
    { value: "urgent", label: "Urgent", icon: AlertTriangle, class: "text-priority-urgent" },
    { value: "high", label: "High", icon: ArrowUp, class: "text-priority-high" },
    { value: "medium", label: "Medium", icon: Minus, class: "text-priority-medium" },
    { value: "low", label: "Low", icon: ArrowDown, class: "text-priority-low" },
];

const colors = [
    { value: "blue", class: "bg-accent-blue", label: "Blue" },
    { value: "red", class: "bg-accent-red", label: "Red" },
    { value: "amber", class: "bg-accent-amber", label: "Amber" },
    { value: "green", class: "bg-accent-green", label: "Green" },
    { value: "purple", class: "bg-accent-purple", label: "Purple" },
];

// Subcomponent for sortable checklist item
function SortableChecklistItem({
    item,
    onToggle,
    onDelete,
}: {
    item: ChecklistItem;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: item.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-2.5 py-1 group rounded-md hover:bg-bg-hover/40 px-1 -mx-1 transition-theme"
        >
            <button
                {...attributes}
                {...listeners}
                className="opacity-0 group-hover:opacity-40 hover:!opacity-100 cursor-grab active:cursor-grabbing text-text-muted transition-theme"
            >
                <GripVertical size={13} />
            </button>
            <button
                onClick={() => onToggle(item.id)}
                className={cn(
                    "w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-theme",
                    item.completed
                        ? "bg-accent-green border-accent-green"
                        : "border-border-strong hover:border-text-tertiary"
                )}
            >
                {item.completed && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path
                            d="M2 5L4 7L8 3"
                            stroke="white"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                )}
            </button>
            <span
                className={cn(
                    "flex-1 text-[13px]",
                    item.completed ? "text-text-muted line-through" : "text-text-secondary"
                )}
            >
                {item.text}
            </span>
            <button
                onClick={() => onDelete(item.id)}
                className="opacity-0 group-hover:opacity-100 p-0.5 text-text-muted hover:text-accent-red transition-theme"
            >
                <X size={12} />
            </button>
        </div>
    );
}

export function CardDetail() {
    const {
        activeCardId,
        cards,
        lanes,
        setActiveCard,
        updateCard,
        deleteCard,
        archiveCard,
        duplicateCard,
    } = useStore();

    const card = cards.find((c) => c.id === activeCardId);
    const lane = card ? lanes.find((l) => l.id === card.laneId) : null;

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [isEditingDesc, setIsEditingDesc] = useState(false);
    const [newTag, setNewTag] = useState("");
    const [newCheckItem, setNewCheckItem] = useState("");

    const titleRef = useRef<HTMLTextAreaElement>(null);
    const descRef = useRef<HTMLTextAreaElement>(null);
    const lastCardIdRef = useRef<string | null>(null);

    // DnD sensors for checklist
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        if (!card) return;
        if (card.id !== lastCardIdRef.current) {
            setTitle(card.title);
            setDescription(card.description);
            lastCardIdRef.current = card.id;
        }
    }, [card]);

    const handleClose = useCallback(() => {
        if (card) {
            if (title !== card.title || description !== card.description) {
                updateCard(card.id, { title: title.trim() || card.title, description });
            }
        }
        setActiveCard(null);
    }, [card, title, description, updateCard, setActiveCard]);

    useEffect(() => {
        function handleKey(e: KeyboardEvent) {
            if (e.key === "Escape") handleClose();
        }
        if (activeCardId) {
            document.addEventListener("keydown", handleKey);
            return () => document.removeEventListener("keydown", handleKey);
        }
    }, [activeCardId, handleClose]);

    function handleAddTag() {
        if (!card || !newTag.trim()) return;
        const tags = [...card.tags];
        if (!tags.includes(newTag.trim())) {
            tags.push(newTag.trim());
            updateCard(card.id, { tags });
        }
        setNewTag("");
    }

    function handleRemoveTag(tag: string) {
        if (!card) return;
        updateCard(card.id, { tags: card.tags.filter((t) => t !== tag) });
    }

    function handleAddCheckItem() {
        if (!card || !newCheckItem.trim()) return;
        const item: ChecklistItem = {
            id: uuidv4(),
            text: newCheckItem.trim(),
            completed: false,
        };
        updateCard(card.id, { checklist: [...card.checklist, item] });
        setNewCheckItem("");
    }

    function handleToggleCheckItem(itemId: string) {
        if (!card) return;
        updateCard(card.id, {
            checklist: card.checklist.map((c) =>
                c.id === itemId ? { ...c, completed: !c.completed } : c
            ),
        });
    }

    function handleDeleteCheckItem(itemId: string) {
        if (!card) return;
        updateCard(card.id, {
            checklist: card.checklist.filter((c) => c.id !== itemId),
        });
    }

    function handleDragChecklistEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (!card || !over || active.id === over.id) return;
        const oldIndex = card.checklist.findIndex((c) => c.id === active.id);
        const newIndex = card.checklist.findIndex((c) => c.id === over.id);
        const newChecklist = arrayMove(card.checklist, oldIndex, newIndex);
        updateCard(card.id, { checklist: newChecklist });
    }

    function insertMarkdown(prefix: string, suffix: string = "") {
        if (!descRef.current) return;
        const { selectionStart, selectionEnd, value } = descRef.current;
        const selectedText = value.substring(selectionStart, selectionEnd);
        const newText =
            value.substring(0, selectionStart) +
            prefix +
            selectedText +
            suffix +
            value.substring(selectionEnd);
        setDescription(newText);
        setTimeout(() => {
            if (descRef.current) {
                descRef.current.focus();
                descRef.current.setSelectionRange(
                    selectionStart + prefix.length,
                    selectionEnd + prefix.length
                );
            }
        }, 0);
    }

    if (!card) return null;

    const currentPriority = priorities.find((p) => p.value === card.priority);
    const PriorityIcon = currentPriority?.icon || Minus;

    return (
        <AnimatePresence>
            {activeCardId && (
                <>
                    {/* Backdrop with Glassmorphism blur */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.12 }}
                        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                        onClick={handleClose}
                    />

                    {/* Side panel with Glassmorphism */}
                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 40 }}
                        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[680px] bg-bg-primary/95 backdrop-blur-3xl border-l border-border-default shadow-[var(--shadow-popup)] flex overflow-hidden"
                    >
                        {/* Main content */}
                        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                            {/* Top bar */}
                            <div className="flex items-center justify-between px-5 h-12 border-b border-border-subtle flex-shrink-0 bg-bg-sidebar/50 backdrop-blur-xl">
                                <div className="flex items-center gap-2 text-[12px] text-text-muted font-mono">
                                    <span className="text-text-tertiary">{lane?.title}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => {
                                            void duplicateCard(card.id);
                                            handleClose();
                                        }}
                                        className="p-1.5 rounded-md hover:bg-bg-hover text-text-tertiary hover:text-text-secondary transition-theme"
                                        title="Duplicate"
                                    >
                                        <Copy size={14} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            archiveCard(card.id);
                                            handleClose();
                                        }}
                                        className="p-1.5 rounded-md hover:bg-bg-hover text-text-tertiary hover:text-text-secondary transition-theme"
                                        title="Archive"
                                    >
                                        <Archive size={14} />
                                    </button>
                                    <button
                                        onClick={handleClose}
                                        className="p-1.5 rounded-md hover:bg-bg-hover text-text-tertiary hover:text-text-primary transition-theme"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Scrollable body */}
                            <div className="flex-1 overflow-y-auto">
                                <div className="px-6 pt-6 pb-4">
                                    {/* Title */}
                                    <textarea
                                        ref={titleRef}
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        onBlur={() => {
                                            if (title.trim() && title !== card.title) {
                                                updateCard(card.id, { title: title.trim() });
                                            }
                                        }}
                                        rows={1}
                                        className="w-full text-[20px] font-semibold text-text-primary bg-transparent outline-none placeholder:text-text-muted resize-none leading-tight"
                                        placeholder="Card title…"
                                        style={{ fieldSizing: "content" } as React.CSSProperties}
                                    />

                                    {/* Markdown Description Editor */}
                                    <div className="mt-4">
                                        {isEditingDesc ? (
                                            <div className="border border-border-default rounded-lg bg-bg-secondary/50 backdrop-blur-sm overflow-hidden focus-within:border-accent-blue/50 transition-theme">
                                                <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border-subtle bg-bg-tertiary/30">
                                                    <button
                                                        onClick={() => insertMarkdown("**", "**")}
                                                        className="p-1.5 rounded hover:bg-bg-hover text-text-tertiary hover:text-text-secondary"
                                                        title="Bold"
                                                    >
                                                        <Bold size={13} />
                                                    </button>
                                                    <button
                                                        onClick={() => insertMarkdown("*", "*")}
                                                        className="p-1.5 rounded hover:bg-bg-hover text-text-tertiary hover:text-text-secondary"
                                                        title="Italic"
                                                    >
                                                        <Italic size={13} />
                                                    </button>
                                                    <button
                                                        onClick={() => insertMarkdown("- ")}
                                                        className="p-1.5 rounded hover:bg-bg-hover text-text-tertiary hover:text-text-secondary"
                                                        title="Bullet List"
                                                    >
                                                        <List size={13} />
                                                    </button>
                                                </div>
                                                <textarea
                                                    ref={descRef}
                                                    value={description}
                                                    onChange={(e) => setDescription(e.target.value)}
                                                    onBlur={() => {
                                                        if (description !== card.description) {
                                                            updateCard(card.id, { description });
                                                        }
                                                        setIsEditingDesc(false);
                                                    }}
                                                    placeholder="Add a detailed description… (Markdown supported)"
                                                    rows={4}
                                                    className="w-full px-3 py-2 text-[14px] text-text-secondary bg-transparent placeholder:text-text-muted outline-none resize-y leading-relaxed"
                                                    style={{ fieldSizing: "content" } as React.CSSProperties}
                                                />
                                            </div>
                                        ) : (
                                            <div
                                                onClick={() => setIsEditingDesc(true)}
                                                className={cn(
                                                    "min-h-[60px] text-[14px] leading-relaxed cursor-text rounded-md transition-theme",
                                                    !description ? "text-text-muted" : "text-text-secondary"
                                                )}
                                            >
                                                {!description ? (
                                                    "Add a description…"
                                                ) : (
                                                    <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-bg-secondary prose-pre:border prose-pre:border-border-subtle">
                                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                            {description}
                                                        </ReactMarkdown>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Checklist with DnD */}
                                {(card.checklist.length > 0 || true) && (
                                    <div className="px-6 py-4 border-t border-border-subtle">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-[13px] font-medium text-text-primary flex items-center gap-2">
                                                <CheckSquare size={14} className="text-text-tertiary" />
                                                Checklist
                                                {card.checklist.length > 0 && (
                                                    <span className="text-[11px] text-text-muted font-normal">
                                                        {card.checklist.filter((c) => c.completed).length}/
                                                        {card.checklist.length}
                                                    </span>
                                                )}
                                            </h3>
                                        </div>

                                        {card.checklist.length > 0 && (
                                            <div className="h-1 bg-bg-tertiary rounded-full mb-3 overflow-hidden">
                                                <div
                                                    className="h-full bg-accent-green rounded-full transition-all duration-200"
                                                    style={{
                                                        width: `${(card.checklist.filter((c) => c.completed).length /
                                                                card.checklist.length) *
                                                            100
                                                            }%`,
                                                    }}
                                                />
                                            </div>
                                        )}

                                        <div className="space-y-0.5">
                                            <DndContext
                                                sensors={sensors}
                                                collisionDetection={closestCenter}
                                                onDragEnd={handleDragChecklistEnd}
                                            >
                                                <SortableContext
                                                    items={card.checklist.map((c) => c.id)}
                                                    strategy={verticalListSortingStrategy}
                                                >
                                                    {card.checklist.map((item) => (
                                                        <SortableChecklistItem
                                                            key={item.id}
                                                            item={item}
                                                            onToggle={handleToggleCheckItem}
                                                            onDelete={handleDeleteCheckItem}
                                                        />
                                                    ))}
                                                </SortableContext>
                                            </DndContext>
                                        </div>

                                        <div className="flex items-center gap-2 mt-2">
                                            <Plus size={13} className="text-text-muted flex-shrink-0" />
                                            <input
                                                value={newCheckItem}
                                                onChange={(e) => setNewCheckItem(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") handleAddCheckItem();
                                                }}
                                                placeholder="Add item…"
                                                className="flex-1 py-1 text-[13px] bg-transparent text-text-secondary placeholder:text-text-muted outline-none"
                                            />
                                        </div>
                                    </div>
                                )}

                                {card.agentLogs.length > 0 && (
                                    <div className="px-6 py-4 border-t border-border-subtle">
                                        <h3 className="text-[13px] font-medium text-text-primary mb-3 flex items-center gap-2">
                                            <MessageSquare size={14} className="text-text-tertiary" />
                                            Agent logs
                                        </h3>
                                        <div className="space-y-3">
                                            {[...card.agentLogs].reverse().map((entry) => (
                                                <div
                                                    key={entry.id}
                                                    className="rounded-md border border-border-subtle bg-bg-secondary/70"
                                                >
                                                    <div className="flex items-center justify-between px-3 py-2 border-b border-border-subtle">
                                                        <div className="text-[11px] text-text-muted font-mono">
                                                            {format(new Date(entry.timestamp), "MMM d, HH:mm")}
                                                        </div>
                                                        <div className="text-[11px] text-text-muted">
                                                            {entry.source}
                                                            {typeof entry.exitCode === "number"
                                                                ? ` · exit ${entry.exitCode}`
                                                                : ""}
                                                        </div>
                                                    </div>
                                                    <pre className="px-3 py-2 text-[12px] text-text-secondary whitespace-pre-wrap max-h-[220px] overflow-auto">
                                                        {entry.content}
                                                    </pre>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Activity */}
                                <div className="px-6 py-4 border-t border-border-subtle">
                                    <h3 className="text-[13px] font-medium text-text-primary mb-3 flex items-center gap-2">
                                        <MessageSquare size={14} className="text-text-tertiary" />
                                        Activity
                                    </h3>
                                    <div className="space-y-3">
                                        {[...card.activityLog].reverse().map((entry) => (
                                            <div key={entry.id} className="flex items-start gap-2.5">
                                                <div className="w-5 h-5 rounded-full bg-bg-tertiary flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <Clock size={10} className="text-text-muted" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-[13px] text-text-secondary">
                                                        {entry.action}
                                                        {entry.detail && (
                                                            <span className="text-text-muted"> · {entry.detail}</span>
                                                        )}
                                                    </div>
                                                    <div className="text-[11px] text-text-muted mt-0.5 font-mono">
                                                        {format(new Date(entry.timestamp), "MMM d, HH:mm")}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Properties sidebar */}
                        <div className="w-[220px] border-l border-border-subtle bg-bg-sidebar/50 backdrop-blur-xl flex-shrink-0 overflow-y-auto">
                            <div className="p-5 space-y-6">
                                {/* Status (lane) */}
                                <div>
                                    <div className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-2">
                                        Status
                                    </div>
                                    <div className="flex items-center gap-2 text-[13px] text-text-primary">
                                        <span
                                            className={cn(
                                                "w-2 h-2 rounded-full",
                                                lane?.title.toLowerCase().includes("done")
                                                    ? "bg-status-done"
                                                    : lane?.title.toLowerCase().includes("progress")
                                                        ? "bg-status-progress"
                                                        : "bg-status-todo"
                                            )}
                                        />
                                        {lane?.title || "—"}
                                    </div>
                                </div>

                                {/* Priority */}
                                <div>
                                    <div className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-2">
                                        Priority
                                    </div>
                                    <div className="space-y-0.5">
                                        {priorities.map((p) => {
                                            const Icon = p.icon;
                                            return (
                                                <button
                                                    key={p.value}
                                                    onClick={() => updateCard(card.id, { priority: p.value })}
                                                    className={cn(
                                                        "w-full flex items-center gap-2 px-2 py-1 rounded-md text-[13px] transition-theme text-left",
                                                        card.priority === p.value
                                                            ? "bg-bg-hover text-text-primary"
                                                            : "text-text-tertiary hover:bg-bg-hover/60 hover:text-text-secondary"
                                                    )}
                                                >
                                                    <Icon
                                                        size={14}
                                                        className={card.priority === p.value ? p.class : ""}
                                                    />
                                                    <span>{p.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Due Date */}
                                <div>
                                    <div className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-2">
                                        Due date
                                    </div>
                                    <input
                                        type="date"
                                        value={card.dueDate ? format(new Date(card.dueDate), "yyyy-MM-dd") : ""}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            updateCard(card.id, {
                                                dueDate: v ? new Date(v).toISOString() : null,
                                            });
                                        }}
                                        className="w-full px-2 py-1.5 text-[12px] bg-bg-tertiary border border-border-default rounded-md text-text-secondary outline-none focus:border-accent-blue-muted [color-scheme:dark] transition-theme"
                                    />
                                    {card.dueDate && (
                                        <button
                                            onClick={() => updateCard(card.id, { dueDate: null })}
                                            className="text-[11px] text-text-muted hover:text-accent-red mt-1.5 transition-theme"
                                        >
                                            Clear date
                                        </button>
                                    )}
                                </div>

                                {/* Color */}
                                <div>
                                    <div className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-2">
                                        Label
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <button
                                            onClick={() => updateCard(card.id, { colorLabel: null })}
                                            className={cn(
                                                "w-5 h-5 rounded border-2 transition-theme",
                                                !card.colorLabel
                                                    ? "border-text-tertiary"
                                                    : "border-border-default bg-bg-tertiary hover:border-border-strong"
                                            )}
                                            title="None"
                                        />
                                        {colors.map((c) => (
                                            <button
                                                key={c.value}
                                                onClick={() => updateCard(card.id, { colorLabel: c.value })}
                                                className={cn(
                                                    "w-5 h-5 rounded transition-theme",
                                                    c.class,
                                                    card.colorLabel === c.value
                                                        ? "ring-2 ring-white/25 ring-offset-1 ring-offset-bg-sidebar"
                                                        : "hover:ring-1 hover:ring-white/15"
                                                )}
                                                title={c.label}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Tags */}
                                <div>
                                    <div className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-2">
                                        Tags
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        {card.tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] text-text-secondary bg-bg-tertiary rounded group transition-theme border border-border-default"
                                            >
                                                {tag}
                                                <button
                                                    onClick={() => handleRemoveTag(tag)}
                                                    className="opacity-0 group-hover:opacity-100 hover:text-accent-red transition-theme text-[9px]"
                                                >
                                                    <X size={10} />
                                                </button>
                                            </span>
                                        ))}
                                        <input
                                            value={newTag}
                                            onChange={(e) => setNewTag(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") handleAddTag();
                                            }}
                                            placeholder="Add tag…"
                                            className="px-1.5 py-0.5 text-[11px] bg-transparent border border-dashed border-border-strong rounded text-text-tertiary placeholder:text-text-muted outline-none w-20 focus:border-accent-blue/50"
                                        />
                                    </div>
                                </div>

                                {/* Meta */}
                                <div className="pt-4 border-t border-border-subtle space-y-2.5">
                                    <div className="flex justify-between text-[11px]">
                                        <span className="text-text-muted">Created</span>
                                        <span className="text-text-tertiary font-mono">
                                            {format(new Date(card.createdAt), "MMM d")}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-[11px]">
                                        <span className="text-text-muted">Updated</span>
                                        <span className="text-text-tertiary font-mono">
                                            {format(new Date(card.updatedAt), "MMM d")}
                                        </span>
                                    </div>
                                </div>

                                {/* Delete */}
                                <div className="pt-4 border-t border-border-subtle">
                                    <button
                                        onClick={() => deleteCard(card.id)}
                                        className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-[12px] text-accent-red hover:bg-accent-red-subtle rounded-md transition-theme"
                                    >
                                        <Trash2 size={13} />
                                        Delete tracking
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
