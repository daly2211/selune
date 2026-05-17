"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
    AppState,
    Board,
    Card,
    Lane,
    FilterState,
    Priority,
    SortField,
    SortDirection,
    UndoAction,
} from "./types";

const defaultFilters: FilterState = {
    search: "",
    priorities: [],
    tags: [],
    dueDateRange: null,
    showArchived: false,
};

function now() {
    return new Date().toISOString();
}

function matchesPriority(card: Card, priorities: Priority[]): boolean {
    if (priorities.length === 0) return true;
    return priorities.includes(card.priority);
}

function matchesTags(card: Card, tags: string[]): boolean {
    if (tags.length === 0) return true;
    return tags.some((t) => card.tags.includes(t));
}

function matchesDueDate(
    card: Card,
    range: FilterState["dueDateRange"]
): boolean {
    if (!range) return true;
    if (!card.dueDate) return false;
    const due = new Date(card.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    switch (range) {
        case "overdue":
            return due < today;
        case "today":
            return due >= today && due <= endOfDay;
        case "week": {
            const weekEnd = new Date(today);
            weekEnd.setDate(weekEnd.getDate() + 7);
            return due >= today && due <= weekEnd;
        }
        case "month": {
            const monthEnd = new Date(today);
            monthEnd.setMonth(monthEnd.getMonth() + 1);
            return due >= today && due <= monthEnd;
        }
    }
}

function matchesSearch(card: Card, search: string): boolean {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
        card.title.toLowerCase().includes(s) ||
        card.description.toLowerCase().includes(s) ||
        card.tags.some((t) => t.toLowerCase().includes(s))
    );
}

const priorityOrder: Record<Priority, number> = {
    urgent: 0,
    high: 1,
    medium: 2,
    low: 3,
};

async function apiFetch<T>(
    apiKey: string | null,
    input: string,
    init: RequestInit = {}
): Promise<T> {
    if (!apiKey) {
        throw new Error("Missing API key");
    }

    const headers = new Headers(init.headers);
    headers.set("x-api-key", apiKey);
    if (!headers.has("content-type")) {
        headers.set("content-type", "application/json");
    }

    const response = await fetch(input, { ...init, headers });
    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Request failed: ${response.status}`);
    }
    return response.json();
}

function resolveActiveBoardId(currentId: string | null, boards: Board[]) {
    if (currentId && boards.some((b) => b.id === currentId)) {
        return currentId;
    }
    return boards[0]?.id ?? null;
}

export const useStore = create<AppState>()(
    persist(
        (set, get) => ({
            apiKey: null,
            workspaceReady: false,
            boards: [],
            lanes: [],
            cards: [],
            activeBoardId: null,
            activeCardId: null,
            commandPaletteOpen: false,
            boardCreateOpen: false,
            sidebarCollapsed: false,
            filters: { ...defaultFilters },
            sortField: "manual" as SortField,
            sortDirection: "desc" as SortDirection,
            undoStack: [] as UndoAction[],

            setApiKey: (apiKey) => set({ apiKey }),

            setWorkspaceData: (workspace) => {
                set((state) => ({
                    boards: workspace.boards,
                    lanes: workspace.lanes,
                    cards: workspace.cards,
                    activeBoardId: resolveActiveBoardId(
                        state.activeBoardId,
                        workspace.boards
                    ),
                    workspaceReady: true,
                }));
            },

            bootstrapWorkspace: async () => {
                try {
                    const response = await fetch("/api/workspaces/bootstrap", {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                    });
                    if (!response.ok) return null;
                    const data = (await response.json()) as {
                        apiKey: string;
                        workspace: { boards: Board[]; lanes: Lane[]; cards: Card[] };
                    };
                    set({ apiKey: data.apiKey, workspaceReady: true });
                    get().setWorkspaceData(data.workspace);
                    return data.apiKey;
                } catch (error) {
                    console.error("bootstrapWorkspace failed", error);
                    return null;
                }
            },

            attachWorkspace: async (apiKey: string) => {
                try {
                    const response = await fetch("/api/workspaces/attach", {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({ apiKey }),
                    });
                    if (!response.ok) return false;
                    const data = (await response.json()) as {
                        apiKey: string;
                        workspace: { boards: Board[]; lanes: Lane[]; cards: Card[] };
                    };
                    set({ apiKey: data.apiKey, workspaceReady: true });
                    get().setWorkspaceData(data.workspace);
                    return true;
                } catch (error) {
                    console.error("attachWorkspace failed", error);
                    return false;
                }
            },

            syncWorkspace: async () => {
                const apiKey = get().apiKey;
                if (!apiKey) return;
                try {
                    const data = await apiFetch<{
                        workspace: { boards: Board[]; lanes: Lane[]; cards: Card[] };
                    }>(apiKey, "/api/workspaces/state", { method: "GET" });
                    get().setWorkspaceData(data.workspace);
                } catch (error) {
                    console.error("syncWorkspace failed", error);
                }
            },

            // Board CRUD
            createBoard: async (title: string, projectPath: string, description = "") => {
                const apiKey = get().apiKey;
                if (!apiKey) return null;
                try {
                    const data = await apiFetch<{ board: Board; lanes: Lane[] }>(
                        apiKey,
                        "/api/boards",
                        {
                            method: "POST",
                            body: JSON.stringify({ title, description, projectPath }),
                        }
                    );
                    set((state) => ({
                        boards: [...state.boards, data.board],
                        lanes: [...state.lanes, ...data.lanes],
                        activeBoardId: data.board.id,
                    }));
                    return data.board;
                } catch (error) {
                    console.error("createBoard failed", error);
                    return null;
                }
            },

            updateBoard: (id, updates) => {
                set((state) => ({
                    boards: state.boards.map((b) =>
                        b.id === id ? { ...b, ...updates, updatedAt: now() } : b
                    ),
                }));
                const apiKey = get().apiKey;
                if (!apiKey) return;
                void apiFetch<{ board: Board }>(apiKey, `/api/boards/${id}`, {
                    method: "PATCH",
                    body: JSON.stringify(updates),
                })
                    .then((data) =>
                        set((state) => ({
                            boards: state.boards.map((b) =>
                                b.id === id ? data.board : b
                            ),
                        }))
                    )
                    .catch(() => undefined);
            },

            deleteBoard: (id) => {
                const state = get();
                const board = state.boards.find((b) => b.id === id);
                const boardLanes = state.lanes.filter((l) => l.boardId === id);
                const boardCards = state.cards.filter((c) => c.boardId === id);
                set((s) => ({
                    boards: s.boards.filter((b) => b.id !== id),
                    lanes: s.lanes.filter((l) => l.boardId !== id),
                    cards: s.cards.filter((c) => c.boardId !== id),
                    activeBoardId: s.activeBoardId === id ? null : s.activeBoardId,
                    undoStack: board
                        ? [
                              ...s.undoStack,
                              {
                                  type: "deleteBoard",
                                  description: `Deleted board "${board.title}"`,
                                  undo: () =>
                                      set((s2) => ({
                                          boards: [...s2.boards, board],
                                          lanes: [...s2.lanes, ...boardLanes],
                                          cards: [...s2.cards, ...boardCards],
                                      })),
                              },
                          ]
                        : s.undoStack,
                }));

                const apiKey = get().apiKey;
                if (!apiKey) return;
                void apiFetch<{ ok: true }>(apiKey, `/api/boards/${id}`, {
                    method: "DELETE",
                }).catch(() => undefined);
            },

            toggleBoardFavorite: (id) => {
                const board = get().boards.find((b) => b.id === id);
                if (!board) return;
                get().updateBoard(id, { favorite: !board.favorite });
            },

            archiveBoard: (id) => {
                const board = get().boards.find((b) => b.id === id);
                if (!board) return;
                get().updateBoard(id, { archived: !board.archived });
                set((state) => ({
                    activeBoardId: state.activeBoardId === id ? null : state.activeBoardId,
                }));
            },

            // Lane CRUD (fixed lanes)
            createLane: async (_boardId, _title) => null,

            updateLane: (id, updates) =>
                set((s) => ({
                    lanes: s.lanes.map((l) =>
                        l.id === id ? { ...l, ...updates } : l
                    ),
                })),

            deleteLane: (_id) => undefined,

            reorderLanes: (_boardId, _laneIds) => undefined,

            toggleLaneCollapse: (id) =>
                set((s) => ({
                    lanes: s.lanes.map((l) =>
                        l.id === id ? { ...l, collapsed: !l.collapsed } : l
                    ),
                })),

            // Card CRUD
            createCard: async (laneId, title) => {
                const state = get();
                const lane = state.lanes.find((l) => l.id === laneId);
                if (!lane || lane.key !== "backlog") return null;
                const apiKey = state.apiKey;
                if (!apiKey) return null;
                try {
                    const data = await apiFetch<{ card: Card }>(apiKey, "/api/cards", {
                        method: "POST",
                        body: JSON.stringify({
                            boardId: lane.boardId,
                            title,
                            description: "",
                            laneKey: "backlog",
                        }),
                    });

                    set((s) => ({ cards: [...s.cards, data.card] }));
                    return data.card;
                } catch (error) {
                    console.error("createCard failed", error);
                    return null;
                }
            },

            updateCard: (id, updates) => {
                set((s) => ({
                    cards: s.cards.map((c) =>
                        c.id === id ? { ...c, ...updates, updatedAt: now() } : c
                    ),
                }));

                const apiKey = get().apiKey;
                if (!apiKey) return;
                void apiFetch<{ card: Card }>(apiKey, `/api/cards/${id}`, {
                    method: "PATCH",
                    body: JSON.stringify(updates),
                })
                    .then((data) =>
                        set((s) => ({
                            cards: s.cards.map((c) =>
                                c.id === id ? data.card : c
                            ),
                        }))
                    )
                    .catch(() => undefined);
            },

            deleteCard: (id) => {
                const state = get();
                const card = state.cards.find((c) => c.id === id);
                set((s) => ({
                    cards: s.cards.filter((c) => c.id !== id),
                    activeCardId: s.activeCardId === id ? null : s.activeCardId,
                    undoStack: card
                        ? [
                              ...s.undoStack,
                              {
                                  type: "deleteCard",
                                  description: `Deleted "${card.title}"`,
                                  undo: () =>
                                      set((s2) => ({ cards: [...s2.cards, card] })),
                              },
                          ]
                        : s.undoStack,
                }));

                const apiKey = get().apiKey;
                if (!apiKey) return;
                void apiFetch<{ ok: true }>(apiKey, `/api/cards/${id}`, {
                    method: "DELETE",
                }).catch(() => undefined);
            },

            archiveCard: (id) => {
                const card = get().cards.find((c) => c.id === id);
                if (!card) return;
                get().updateCard(id, { archived: !card.archived });
            },

            duplicateCard: async (id) => {
                const state = get();
                const original = state.cards.find((c) => c.id === id);
                if (!original) return null;
                const backlogLane = state.lanes.find(
                    (l) => l.boardId === original.boardId && l.key === "backlog"
                );
                if (!backlogLane) return null;
                return get().createCard(backlogLane.id, `${original.title} (copy)`);
            },

            moveCard: (cardId, toLaneId, newOrder) => {
                const state = get();
                const lane = state.lanes.find((l) => l.id === toLaneId);
                if (!lane) return;
                set((s) => ({
                    cards: s.cards.map((c) => {
                        if (c.id === cardId) {
                            return {
                                ...c,
                                laneId: toLaneId,
                                boardId: lane.boardId,
                                order: newOrder,
                                updatedAt: now(),
                            };
                        }
                        return c;
                    }),
                }));

                const apiKey = get().apiKey;
                if (!apiKey) return;
                void apiFetch<{ card: Card }>(apiKey, `/api/cards/${cardId}`, {
                    method: "PATCH",
                    body: JSON.stringify({ laneId: toLaneId, order: newOrder }),
                }).catch(() => undefined);
            },

            reorderCards: (laneId, cardIds) => {
                set((s) => ({
                    cards: s.cards.map((c) => {
                        if (c.laneId !== laneId) return c;
                        const idx = cardIds.indexOf(c.id);
                        return idx >= 0 ? { ...c, order: idx } : c;
                    }),
                }));

                const apiKey = get().apiKey;
                if (!apiKey) return;
                void apiFetch<{ ok: true }>(apiKey, `/api/lanes/${laneId}/reorder`, {
                    method: "POST",
                    body: JSON.stringify({ cardIds }),
                }).catch(() => undefined);
            },

            // UI
            setActiveBoard: (id) => set({ activeBoardId: id }),
            setActiveCard: (id) => set({ activeCardId: id }),
            toggleCommandPalette: () =>
                set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
            openBoardCreate: () => set({ boardCreateOpen: true }),
            closeBoardCreate: () => set({ boardCreateOpen: false }),
            toggleSidebar: () =>
                set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
            setFilters: (f) =>
                set((s) => ({ filters: { ...s.filters, ...f } })),
            resetFilters: () => set({ filters: { ...defaultFilters } }),
            setSort: (field, direction) =>
                set({ sortField: field, sortDirection: direction }),

            // Undo
            undo: () => {
                const state = get();
                const lastAction = state.undoStack[state.undoStack.length - 1];
                if (lastAction) {
                    lastAction.undo();
                    set((s) => ({
                        undoStack: s.undoStack.slice(0, -1),
                    }));
                }
            },

            // Computed
            getBoardLanes: (boardId) => {
                return get()
                    .lanes.filter((l) => l.boardId === boardId)
                    .sort((a, b) => a.order - b.order);
            },

            getLaneCards: (laneId) => {
                return get()
                    .cards.filter((c) => c.laneId === laneId && !c.archived)
                    .sort((a, b) => a.order - b.order);
            },

            getFilteredCards: (laneId) => {
                const state = get();
                const { filters, sortField, sortDirection } = state;
                let result = state.cards.filter(
                    (c) => c.laneId === laneId && (filters.showArchived || !c.archived)
                );

                result = result.filter(
                    (c) =>
                        matchesSearch(c, filters.search) &&
                        matchesPriority(c, filters.priorities) &&
                        matchesTags(c, filters.tags) &&
                        matchesDueDate(c, filters.dueDateRange)
                );

                result.sort((a, b) => {
                    let cmp = 0;
                    switch (sortField) {
                        case "manual":
                            cmp = a.order - b.order;
                            break;
                        case "created":
                            cmp =
                                new Date(a.createdAt).getTime() -
                                new Date(b.createdAt).getTime();
                            break;
                        case "updated":
                            cmp =
                                new Date(a.updatedAt).getTime() -
                                new Date(b.updatedAt).getTime();
                            break;
                        case "priority":
                            cmp = priorityOrder[a.priority] - priorityOrder[b.priority];
                            break;
                        case "dueDate":
                            if (!a.dueDate && !b.dueDate) cmp = 0;
                            else if (!a.dueDate) cmp = 1;
                            else if (!b.dueDate) cmp = -1;
                            else
                                cmp =
                                    new Date(a.dueDate).getTime() -
                                    new Date(b.dueDate).getTime();
                            break;
                        case "title":
                            cmp = a.title.localeCompare(b.title);
                            break;
                    }
                    if (sortField === "manual") return cmp;
                    return sortDirection === "asc" ? cmp : -cmp;
                });

                return result;
            },

            getAllTags: () => {
                const state = get();
                const tagSet = new Set<string>();
                state.cards.forEach((c) => c.tags.forEach((t) => tagSet.add(t)));
                return Array.from(tagSet).sort();
            },
        }),
        {
            name: "selune-store",
            partialize: (state) => ({
                activeBoardId: state.activeBoardId,
                sidebarCollapsed: state.sidebarCollapsed,
                sortField: state.sortField,
                sortDirection: state.sortDirection,
                filters: state.filters,
            }),
        }
    )
);
