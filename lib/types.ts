import type { LaneKey } from "./kanban";

export type Priority = "low" | "medium" | "high" | "urgent";

export interface ChecklistItem {
    id: string;
    text: string;
    completed: boolean;
}

export interface ActivityEntry {
    id: string;
    action: string;
    timestamp: string;
    detail?: string;
}

export interface AgentLogEntry {
    id: string;
    timestamp: string;
    source: "client" | "agent";
    content: string;
    exitCode?: number;
}

export interface Card {
    id: string;
    title: string;
    description: string;
    dueDate: string | null;
    priority: Priority;
    colorLabel: string | null;
    tags: string[];
    checklist: ChecklistItem[];
    pushToBranch: boolean;
    branchUrl: string | null;
    agentLogs: AgentLogEntry[];
    activityLog: ActivityEntry[];
    createdAt: string;
    updatedAt: string;
    archived: boolean;
    laneId: string;
    boardId: string;
    order: number;
}

export interface Lane {
    id: string;
    title: string;
    key: LaneKey;
    boardId: string;
    order: number;
    collapsed: boolean;
    laneLimit: number | null;
    color: string | null;
    locked: boolean;
}

export interface Board {
    id: string;
    title: string;
    description: string;
    projectPath: string;
    favorite: boolean;
    archived: boolean;
    createdAt: string;
    updatedAt: string;
}

export type SortField = "manual" | "created" | "updated" | "priority" | "dueDate" | "title";
export type SortDirection = "asc" | "desc";

export interface FilterState {
    search: string;
    priorities: Priority[];
    tags: string[];
    dueDateRange: "overdue" | "today" | "week" | "month" | null;
    showArchived: boolean;
}

export interface PendingCardPosition {
    laneId: string;
    boardId: string;
    order: number;
    updatedAt: string;
    expiresAt: number;
}

export interface PendingCardCreate {
    card: Card;
    expiresAt: number;
}

export interface AppState {
    apiKey: string | null;
    workspaceReady: boolean;

    // Data
    boards: Board[];
    lanes: Lane[];
    cards: Card[];

    // UI State
    activeBoardId: string | null;
    activeCardId: string | null;
    commandPaletteOpen: boolean;
    boardCreateOpen: boolean;
    sidebarCollapsed: boolean;
    filters: FilterState;
    sortField: SortField;
    sortDirection: SortDirection;
    pendingCardPositions: Record<string, PendingCardPosition>;
    pendingCardCreates: Record<string, PendingCardCreate>;

    // Undo
    undoStack: UndoAction[];

    // Board CRUD
    createBoard: (
        title: string,
        projectPath: string,
        description?: string
    ) => Promise<Board | null>;
    updateBoard: (id: string, updates: Partial<Board>) => void;
    deleteBoard: (id: string) => void;
    toggleBoardFavorite: (id: string) => void;
    archiveBoard: (id: string) => void;

    // Lane CRUD
    createLane: (boardId: string, title: string) => Promise<Lane | null> | null;
    updateLane: (id: string, updates: Partial<Lane>) => void;
    deleteLane: (id: string) => void;
    reorderLanes: (boardId: string, laneIds: string[]) => void;
    toggleLaneCollapse: (id: string) => void;

    // Card CRUD
    createCard: (laneId: string, title: string) => Promise<Card | null>;
    updateCard: (id: string, updates: Partial<Card>) => void;
    deleteCard: (id: string) => void;
    archiveCard: (id: string) => void;
    duplicateCard: (id: string) => Promise<Card | null>;
    moveCard: (cardId: string, toLaneId: string, newOrder: number) => void;
    reorderCards: (laneId: string, cardIds: string[]) => void;

    // UI Actions
    setActiveBoard: (id: string | null) => void;
    setActiveCard: (id: string | null) => void;
    toggleCommandPalette: () => void;
    openBoardCreate: () => void;
    closeBoardCreate: () => void;
    toggleSidebar: () => void;
    setFilters: (filters: Partial<FilterState>) => void;
    resetFilters: () => void;
    setSort: (field: SortField, direction: SortDirection) => void;
    setApiKey: (apiKey: string | null) => void;
    setWorkspaceData: (workspace: {
        boards: Board[];
        lanes: Lane[];
        cards: Card[];
    }) => void;
    bootstrapWorkspace: () => Promise<string | null>;
    attachWorkspace: (apiKey: string) => Promise<boolean>;
    syncWorkspace: () => Promise<void>;

    // Undo
    undo: () => void;

    // Computed
    getBoardLanes: (boardId: string) => Lane[];
    getLaneCards: (laneId: string) => Card[];
    getFilteredCards: (laneId: string) => Card[];
    getAllTags: () => string[];
}

export interface UndoAction {
    type: string;
    description: string;
    undo: () => void;
}
