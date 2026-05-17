"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";
import {
    Search,
    Plus,
    Undo2,
    Settings,
    ArrowRight,
    FolderKanban,
} from "lucide-react";

interface Command {
    id: string;
    label: string;
    description?: string;
    icon: typeof Search;
    action: () => void;
    group: string;
}

export function CommandPalette() {
    const {
        commandPaletteOpen,
        toggleCommandPalette,
        boards,
        setActiveBoard,
        openBoardCreate,
        undo,
        undoStack,
        toggleSidebar,
    } = useStore();

    const [query, setQuery] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const [selectedIndex, setSelectedIndex] = useState(0);

    const commands = useMemo<Command[]>(() => {
        const cmds: Command[] = [];

        boards
            .filter((b) => !b.archived)
            .forEach((b) => {
                cmds.push({
                    id: `go-${b.id}`,
                    label: b.title,
                    description: "Switch to board",
                    icon: FolderKanban,
                    action: () => {
                        setActiveBoard(b.id);
                        toggleCommandPalette();
                    },
                    group: "Boards",
                });
            });

        cmds.push({
            id: "new-board",
            label: "New Board",
            description: "Create a new board",
            icon: Plus,
            action: () => {
                openBoardCreate();
                toggleCommandPalette();
            },
            group: "Actions",
        });

        if (undoStack.length > 0) {
            cmds.push({
                id: "undo",
                label: "Undo",
                description: undoStack[undoStack.length - 1]?.description,
                icon: Undo2,
                action: () => {
                    undo();
                    toggleCommandPalette();
                },
                group: "Actions",
            });
        }

        cmds.push({
            id: "toggle-sidebar",
            label: "Toggle Sidebar",
            icon: Settings,
            action: () => {
                toggleSidebar();
                toggleCommandPalette();
            },
            group: "View",
        });

        return cmds;
    }, [boards, undoStack, setActiveBoard, openBoardCreate, undo, toggleSidebar, toggleCommandPalette]);

    const filtered = useMemo(() => {
        if (!query) return commands;
        const q = query.toLowerCase();
        return commands.filter(
            (c) =>
                c.label.toLowerCase().includes(q) ||
                c.description?.toLowerCase().includes(q) ||
                c.group.toLowerCase().includes(q)
        );
    }, [commands, query]);

    const groups = useMemo(() => {
        const map = new Map<string, Command[]>();
        filtered.forEach((c) => {
            const arr = map.get(c.group) || [];
            arr.push(c);
            map.set(c.group, arr);
        });
        return map;
    }, [filtered]);

    useEffect(() => {
        if (commandPaletteOpen) {
            setQuery("");
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [commandPaletteOpen]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
        }
        if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex((i) => Math.max(i - 1, 0));
        }
        if (e.key === "Enter" && filtered[selectedIndex]) {
            filtered[selectedIndex].action();
        }
        if (e.key === "Escape") {
            toggleCommandPalette();
        }
    }

    if (!commandPaletteOpen) return null;

    let flatIndex = -1;

    return (
        <AnimatePresence>
            <motion.div
                ref={overlayRef}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="fixed inset-0 z-[100] flex items-start justify-center pt-[16vh] px-4"
                onClick={(e) => {
                    if (e.target === overlayRef.current) toggleCommandPalette();
                }}
            >
                <div className="absolute inset-0 bg-black/50" />

                <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.99 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.99 }}
                    transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
                    className="relative w-full max-w-[520px] bg-bg-primary border border-border-default rounded-xl shadow-[var(--shadow-popup)] overflow-hidden"
                >
                    {/* Input */}
                    <div className="flex items-center gap-2.5 px-4 h-12 border-b border-border-subtle">
                        <Search size={15} className="text-text-muted flex-shrink-0" />
                        <input
                            ref={inputRef}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type a command…"
                            className="flex-1 bg-transparent text-[14px] text-text-primary placeholder:text-text-muted outline-none"
                        />
                        <kbd>Esc</kbd>
                    </div>

                    {/* Results */}
                    <div className="max-h-[320px] overflow-y-auto py-1">
                        {filtered.length === 0 && (
                            <div className="px-4 py-8 text-center text-[13px] text-text-muted">
                                No results found
                            </div>
                        )}

                        {Array.from(groups.entries()).map(([group, items]) => (
                            <div key={group}>
                                <div className="px-4 py-1.5 text-[11px] font-medium text-text-muted uppercase tracking-[0.04em]">
                                    {group}
                                </div>
                                {items.map((cmd) => {
                                    flatIndex++;
                                    const idx = flatIndex;
                                    const Icon = cmd.icon;
                                    return (
                                        <button
                                            key={cmd.id}
                                            onClick={cmd.action}
                                            onMouseEnter={() => setSelectedIndex(idx)}
                                            className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-theme ${selectedIndex === idx
                                                    ? "bg-bg-hover text-text-primary"
                                                    : "text-text-secondary hover:bg-bg-hover/50"
                                                }`}
                                        >
                                            <Icon size={15} className="flex-shrink-0 opacity-50" />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[13px] truncate">{cmd.label}</div>
                                                {cmd.description && (
                                                    <div className="text-[11px] text-text-muted truncate">
                                                        {cmd.description}
                                                    </div>
                                                )}
                                            </div>
                                            {selectedIndex === idx && (
                                                <ArrowRight size={12} className="text-text-muted flex-shrink-0" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-2 border-t border-border-subtle flex items-center gap-4 text-[10px] text-text-muted">
                        <span className="flex items-center gap-1"><kbd>↑↓</kbd> navigate</span>
                        <span className="flex items-center gap-1"><kbd>↵</kbd> select</span>
                        <span className="flex items-center gap-1"><kbd>esc</kbd> close</span>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
