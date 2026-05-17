"use client";

import { useState, useRef, useEffect } from "react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Plus,
    Star,
    Archive,
    ChevronDown,
    ChevronRight,
    MoreHorizontal,
    Trash2,
    PanelLeftClose,
    PanelLeftOpen,
    Pencil,
    Inbox,
    Search,
    BarChart3,
    FolderKanban,
    Layers,
    MoreVertical,
} from "lucide-react";

const favoriteColors = [
    "bg-accent-green",
    "bg-accent-blue",
    "bg-accent-purple",
    "bg-accent-amber",
    "bg-accent-red",
];

function hashColor(str: string) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return favoriteColors[Math.abs(hash) % favoriteColors.length];
}

export function Sidebar() {
    const {
        boards,
        activeBoardId,
        sidebarCollapsed,
        setActiveBoard,
        deleteBoard,
        toggleBoardFavorite,
        archiveBoard,
        toggleSidebar,
        toggleCommandPalette,
        openBoardCreate,
    } = useStore();

    const [showArchived, setShowArchived] = useState(false);
    const [contextMenu, setContextMenu] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const editInputRef = useRef<HTMLInputElement>(null);
    const contextRef = useRef<HTMLDivElement>(null);

    const favoriteBoards = boards.filter((b) => b.favorite && !b.archived);
    const regularBoards = boards.filter((b) => !b.favorite && !b.archived);
    const archivedBoards = boards.filter((b) => b.archived);

    useEffect(() => {
        if (editingId && editInputRef.current) editInputRef.current.focus();
    }, [editingId]);

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (contextRef.current && !contextRef.current.contains(e.target as Node)) {
                setContextMenu(null);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    function startEdit(id: string, title: string) {
        setEditingId(id);
        setEditTitle(title);
        setContextMenu(null);
    }

    function commitEdit(id: string) {
        if (editTitle.trim()) {
            useStore.getState().updateBoard(id, { title: editTitle.trim() });
        }
        setEditingId(null);
    }

    if (sidebarCollapsed) {
        return (
            <div className="w-[46px] flex-shrink-0 bg-bg-sidebar/90 backdrop-blur-md border-r border-border-default flex flex-col items-center pt-3 pb-2 gap-1">
                <button
                    onClick={toggleSidebar}
                    className="p-2 rounded-md hover:bg-bg-hover text-text-tertiary hover:text-text-secondary transition-theme"
                    title="Expand sidebar"
                >
                    <PanelLeftOpen size={16} />
                </button>
                <div className="w-5 h-px bg-border-subtle my-2" />
                {boards
                    .filter((b) => !b.archived)
                    .map((b) => (
                        <button
                            key={b.id}
                            onClick={() => setActiveBoard(b.id)}
                            className={cn(
                                "w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-semibold transition-theme",
                                activeBoardId === b.id
                                    ? "bg-accent-blue-subtle text-accent-blue"
                                    : "text-text-muted hover:bg-bg-hover hover:text-text-secondary"
                            )}
                            title={b.title}
                        >
                            {b.title.charAt(0).toUpperCase()}
                        </button>
                    ))}
            </div>
        );
    }

    const NavItem = ({
        icon: Icon,
        label,
        onClick,
        active,
    }: {
        icon: typeof Inbox;
        label: string;
        onClick?: () => void;
        active?: boolean;
    }) => (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-2.5 px-2.5 py-[5px] rounded-md text-[13px] transition-theme",
                active
                    ? "bg-bg-hover text-text-primary"
                    : "text-text-secondary hover:bg-bg-hover/60 hover:text-text-primary"
            )}
        >
            <Icon size={15} className="flex-shrink-0 opacity-60" />
            <span>{label}</span>
        </button>
    );

    const BoardItem = ({ board }: { board: (typeof boards)[0] }) => (
        <div className="relative group">
            {editingId === board.id ? (
                <input
                    ref={editInputRef}
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => commitEdit(board.id)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") commitEdit(board.id);
                        if (e.key === "Escape") setEditingId(null);
                    }}
                    className="w-full px-2.5 py-[5px] text-[13px] bg-bg-tertiary border border-border-strong rounded-md text-text-primary outline-none"
                />
            ) : (
                <button
                    onClick={() => setActiveBoard(board.id)}
                    className={cn(
                        "w-full flex items-center gap-2.5 px-2.5 py-[5px] rounded-md text-[13px] transition-theme",
                        activeBoardId === board.id
                            ? "bg-bg-hover text-text-primary"
                            : "text-text-secondary hover:bg-bg-hover/60 hover:text-text-primary"
                    )}
                >
                    {board.favorite ? (
                        <span className={cn("w-[6px] h-[6px] rounded-full flex-shrink-0", hashColor(board.id))} />
                    ) : (
                        <FolderKanban size={14} className="flex-shrink-0 opacity-40" />
                    )}
                    <span className="truncate flex-1 text-left">{board.title}</span>
                    {board.favorite && !activeBoardId && (
                        <Star size={11} className="flex-shrink-0 text-accent-amber opacity-50" />
                    )}
                </button>
            )}
            {editingId !== board.id && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setContextMenu(contextMenu === board.id ? null : board.id);
                    }}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-bg-active text-text-tertiary hover:text-text-secondary transition-theme"
                >
                    <MoreHorizontal size={14} />
                </button>
            )}
            {contextMenu === board.id && (
                <div
                    ref={contextRef}
                    className="absolute right-0 top-full mt-1 w-44 bg-bg-elevated border border-border-default rounded-lg shadow-[var(--shadow-popup)] z-50 py-1"
                >
                    <button
                        onClick={() => {
                            toggleBoardFavorite(board.id);
                            setContextMenu(null);
                        }}
                        className="w-full px-3 py-[6px] text-left text-[13px] text-text-secondary hover:bg-bg-hover hover:text-text-primary flex items-center gap-2.5 transition-theme"
                    >
                        <Star size={14} className="opacity-60" />
                        {board.favorite ? "Remove from favorites" : "Add to favorites"}
                    </button>
                    <button
                        onClick={() => startEdit(board.id, board.title)}
                        className="w-full px-3 py-[6px] text-left text-[13px] text-text-secondary hover:bg-bg-hover hover:text-text-primary flex items-center gap-2.5 transition-theme"
                    >
                        <Pencil size={14} className="opacity-60" />
                        Rename
                    </button>
                    <button
                        onClick={() => {
                            archiveBoard(board.id);
                            setContextMenu(null);
                        }}
                        className="w-full px-3 py-[6px] text-left text-[13px] text-text-secondary hover:bg-bg-hover hover:text-text-primary flex items-center gap-2.5 transition-theme"
                    >
                        <Archive size={14} className="opacity-60" />
                        Archive
                    </button>
                    <div className="h-px bg-border-subtle mx-2 my-1" />
                    <button
                        onClick={() => {
                            deleteBoard(board.id);
                            setContextMenu(null);
                        }}
                        className="w-full px-3 py-[6px] text-left text-[13px] text-accent-red hover:bg-accent-red-subtle flex items-center gap-2.5 transition-theme"
                    >
                        <Trash2 size={14} />
                        Delete
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <div className="w-[220px] flex-shrink-0 bg-bg-sidebar/90 backdrop-blur-md border-r border-border-default flex flex-col h-full select-none z-10 relative">
            {/* Brand header */}
            <div className="px-3 h-12 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-accent-blue flex items-center justify-center">
                        <Layers size={11} className="text-white" />
                    </div>
                    <span className="text-[13px] font-semibold text-text-primary tracking-tight">
                        Selune
                    </span>
                </div>
                <div className="flex items-center gap-0.5">
                    <button
                        onClick={() => toggleCommandPalette()}
                        className="p-1.5 rounded-md hover:bg-bg-hover text-text-tertiary hover:text-text-secondary transition-theme"
                        title="Search (⌘K)"
                    >
                        <Search size={14} />
                    </button>
                    <button
                        onClick={toggleSidebar}
                        className="p-1.5 rounded-md hover:bg-bg-hover text-text-tertiary hover:text-text-secondary transition-theme"
                        title="Collapse sidebar"
                    >
                        <PanelLeftClose size={14} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-2 pb-2">
                {/* Favorites */}
                {favoriteBoards.length > 0 && (
                    <div className="mb-3">
                        <div className="px-2.5 py-1.5 text-[11px] font-medium text-text-muted uppercase tracking-[0.05em]">
                            Favorites
                        </div>
                        <div className="space-y-px">
                            {favoriteBoards.map((b) => (
                                <BoardItem key={b.id} board={b} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Workspace */}
                <div className="mb-3">
                    <div className="px-2.5 py-1.5 text-[11px] font-medium text-text-muted uppercase tracking-[0.05em] flex items-center justify-between">
                        <span>Workspace</span>
                    </div>
                    <div className="space-y-px">
                        {regularBoards.map((b) => (
                            <BoardItem key={b.id} board={b} />
                        ))}
                    </div>
                </div>

                {/* New board */}
                <button
                    onClick={openBoardCreate}
                    className="w-full flex items-center gap-2.5 px-2.5 py-[5px] rounded-md text-[13px] text-text-muted hover:bg-bg-hover/60 hover:text-text-secondary transition-theme mb-3"
                >
                    <Plus size={14} className="opacity-50" />
                    <span>New board</span>
                </button>

                {boards.filter((b) => !b.archived).length === 0 && (
                    <div className="px-2.5 py-6 text-center">
                        <p className="text-[12px] text-text-muted mb-2">No boards yet</p>
                        <button
                            onClick={openBoardCreate}
                            className="text-[12px] text-accent-blue hover:underline transition-theme"
                        >
                            Create your first board
                        </button>
                    </div>
                )}

                {/* Archived */}
                {archivedBoards.length > 0 && (
                    <div>
                        <button
                            onClick={() => setShowArchived(!showArchived)}
                            className="w-full px-2.5 py-1.5 text-[11px] font-medium text-text-muted uppercase tracking-[0.05em] flex items-center gap-1.5 hover:text-text-tertiary transition-theme"
                        >
                            {showArchived ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                            Archived ({archivedBoards.length})
                        </button>
                        {showArchived && (
                            <div className="space-y-px mt-0.5">
                                {archivedBoards.map((b) => (
                                    <BoardItem key={b.id} board={b} />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-border-subtle">
                <div className="text-[11px] text-text-muted flex items-center gap-1.5">
                    <kbd>⌘</kbd><kbd>K</kbd>
                    <span className="ml-1 text-text-muted">Command</span>
                </div>
            </div>
        </div>
    );
}
