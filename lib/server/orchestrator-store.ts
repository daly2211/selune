import { v4 as uuidv4 } from "uuid";
import type {
    ActivityEntry,
    AgentLogEntry,
    Board,
    Card,
    ChecklistItem,
    Lane,
} from "../types";
import { DEFAULT_LANES, isLaneKey, type LaneKey } from "../kanban";
import { getSupabaseClient } from "./supabase";

export interface WorkspaceSummary {
    apiKey: string;
    createdAt: string;
    updatedAt: string;
}

export interface WorkspaceState extends WorkspaceSummary {
    boards: Board[];
    lanes: Lane[];
    cards: Card[];
}

type WorkspaceRow = {
    api_key: string;
    created_at: string;
    updated_at: string;
};

type BoardRow = {
    id: string;
    workspace_key: string;
    title: string;
    description: string;
    project_path: string;
    favorite: boolean;
    archived: boolean;
    created_at: string;
    updated_at: string;
};

type LaneRow = {
    id: string;
    workspace_key: string;
    board_id: string;
    key: string;
    title: string;
    order_index: number;
    collapsed: boolean;
    lane_limit: number | null;
    color: string | null;
    locked: boolean;
    created_at: string;
    updated_at: string;
};

type CardRow = {
    id: string;
    workspace_key: string;
    board_id: string;
    lane_id: string;
    title: string;
    description: string;
    due_date: string | null;
    priority: string;
    color_label: string | null;
    tags: unknown;
    checklist: unknown;
    agent_logs: unknown;
    activity_log: unknown;
    archived: boolean;
    order_index: number;
    created_at: string;
    updated_at: string;
};

function now() {
    return new Date().toISOString();
}

function normalizeArray<T>(value: unknown): T[] {
    return Array.isArray(value) ? (value as T[]) : [];
}

function mapWorkspace(row: WorkspaceRow): WorkspaceSummary {
    return {
        apiKey: row.api_key,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function mapBoard(row: BoardRow): Board {
    return {
        id: row.id,
        title: row.title,
        description: row.description ?? "",
        projectPath: row.project_path ?? "",
        favorite: Boolean(row.favorite),
        archived: Boolean(row.archived),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function mapLane(row: LaneRow): Lane {
    return {
        id: row.id,
        title: row.title,
        key: isLaneKey(row.key) ? row.key : "backlog",
        boardId: row.board_id,
        order: Number(row.order_index) || 0,
        collapsed: Boolean(row.collapsed),
        laneLimit: row.lane_limit ?? null,
        color: row.color ?? null,
        locked: Boolean(row.locked),
    };
}

function mapCard(row: CardRow): Card {
    return {
        id: row.id,
        title: row.title,
        description: row.description ?? "",
        dueDate: row.due_date ?? null,
        priority: (row.priority as Card["priority"]) || "medium",
        colorLabel: row.color_label ?? null,
        tags: normalizeArray<string>(row.tags),
        checklist: normalizeArray<ChecklistItem>(row.checklist),
        agentLogs: normalizeArray<AgentLogEntry>(row.agent_logs),
        activityLog: normalizeArray<ActivityEntry>(row.activity_log),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        archived: Boolean(row.archived),
        laneId: row.lane_id,
        boardId: row.board_id,
        order: Number(row.order_index) || 0,
    };
}

function appendActivityLog(
    activityLog: ActivityEntry[] | unknown,
    entry: ActivityEntry
) {
    const list = normalizeArray<ActivityEntry>(activityLog);
    return [...list, entry];
}

async function getWorkspaceRow(apiKey: string) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from("workspaces")
        .select("api_key, created_at, updated_at")
        .eq("api_key", apiKey)
        .maybeSingle();

    if (error || !data) {
        if (error) console.error("getWorkspaceRow failed", error);
        return null;
    }

    return data as WorkspaceRow;
}

export async function createWorkspace(): Promise<WorkspaceState | null> {
    const supabase = getSupabaseClient();
    const apiKey = uuidv4();
    const timestamp = now();

    const { data, error } = await supabase
        .from("workspaces")
        .insert({
            api_key: apiKey,
            created_at: timestamp,
            updated_at: timestamp,
        })
        .select("api_key, created_at, updated_at")
        .single();

    if (error || !data) {
        console.error("createWorkspace failed", error);
        return null;
    }

    return {
        ...mapWorkspace(data as WorkspaceRow),
        boards: [],
        lanes: [],
        cards: [],
    };
}

export async function getWorkspace(apiKey: string): Promise<WorkspaceSummary | null> {
    const row = await getWorkspaceRow(apiKey);
    return row ? mapWorkspace(row) : null;
}

export async function getWorkspaceState(apiKey: string): Promise<WorkspaceState | null> {
    const workspaceRow = await getWorkspaceRow(apiKey);
    if (!workspaceRow) return null;

    const supabase = getSupabaseClient();
    const { data: boardRows, error: boardError } = await supabase
        .from("boards")
        .select("*")
        .eq("workspace_key", apiKey)
        .order("created_at", { ascending: true });

    if (boardError) {
        console.error("getWorkspaceState boards failed", boardError);
        return null;
    }

    const { data: laneRows, error: laneError } = await supabase
        .from("lanes")
        .select("*")
        .eq("workspace_key", apiKey)
        .order("order_index", { ascending: true });

    if (laneError) {
        console.error("getWorkspaceState lanes failed", laneError);
        return null;
    }

    const { data: cardRows, error: cardError } = await supabase
        .from("cards")
        .select("*")
        .eq("workspace_key", apiKey)
        .order("order_index", { ascending: true });

    if (cardError) {
        console.error("getWorkspaceState cards failed", cardError);
        return null;
    }

    return {
        ...mapWorkspace(workspaceRow),
        boards: (boardRows as BoardRow[]).map(mapBoard),
        lanes: (laneRows as LaneRow[]).map(mapLane),
        cards: (cardRows as CardRow[]).map(mapCard),
    };
}

export async function createBoard(
    apiKey: string,
    params: { title: string; description: string; projectPath: string }
) {
    const supabase = getSupabaseClient();
    const timestamp = now();
    const boardRow: BoardRow = {
        id: uuidv4(),
        workspace_key: apiKey,
        title: params.title,
        description: params.description ?? "",
        project_path: params.projectPath ?? "",
        favorite: false,
        archived: false,
        created_at: timestamp,
        updated_at: timestamp,
    };

    const { error: boardError } = await supabase.from("boards").insert(boardRow);
    if (boardError) {
        console.error("createBoard failed", boardError);
        return null;
    }

    const laneRows: LaneRow[] = DEFAULT_LANES.map((lane, index) => ({
        id: uuidv4(),
        workspace_key: apiKey,
        board_id: boardRow.id,
        key: lane.key,
        title: lane.title,
        order_index: index,
        collapsed: false,
        lane_limit: null,
        color: null,
        locked: true,
        created_at: timestamp,
        updated_at: timestamp,
    }));

    const { error: laneError } = await supabase.from("lanes").insert(laneRows);
    if (laneError) {
        console.error("createBoard lanes failed", laneError);
        return null;
    }

    return {
        board: mapBoard(boardRow),
        lanes: laneRows.map(mapLane),
    };
}

export async function getBoard(apiKey: string, boardId: string): Promise<Board | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from("boards")
        .select("*")
        .eq("workspace_key", apiKey)
        .eq("id", boardId)
        .maybeSingle();

    if (error || !data) {
        if (error) console.error("getBoard failed", error);
        return null;
    }

    return mapBoard(data as BoardRow);
}

export async function updateBoard(
    apiKey: string,
    boardId: string,
    updates: Partial<Pick<Board, "title" | "description" | "projectPath" | "favorite" | "archived">>
): Promise<Board | null> {
    const supabase = getSupabaseClient();
    const updateRow: Partial<BoardRow> = { updated_at: now() };

    if (updates.title !== undefined) updateRow.title = updates.title;
    if (updates.description !== undefined) updateRow.description = updates.description;
    if (updates.projectPath !== undefined) updateRow.project_path = updates.projectPath;
    if (updates.favorite !== undefined) updateRow.favorite = updates.favorite;
    if (updates.archived !== undefined) updateRow.archived = updates.archived;

    const { data, error } = await supabase
        .from("boards")
        .update(updateRow)
        .eq("id", boardId)
        .eq("workspace_key", apiKey)
        .select("*")
        .single();

    if (error || !data) {
        console.error("updateBoard failed", error);
        return null;
    }

    return mapBoard(data as BoardRow);
}

export async function deleteBoard(apiKey: string, boardId: string) {
    const supabase = getSupabaseClient();

    await supabase
        .from("cards")
        .delete()
        .eq("board_id", boardId)
        .eq("workspace_key", apiKey);
    await supabase
        .from("lanes")
        .delete()
        .eq("board_id", boardId)
        .eq("workspace_key", apiKey);

    const { data, error } = await supabase
        .from("boards")
        .delete()
        .eq("id", boardId)
        .eq("workspace_key", apiKey)
        .select("id")
        .maybeSingle();

    if (error || !data) {
        if (error) console.error("deleteBoard failed", error);
        return false;
    }

    return true;
}

export async function createCard(
    apiKey: string,
    params: { boardId: string; laneKey: LaneKey; title: string; description: string }
): Promise<Card | null> {
    const supabase = getSupabaseClient();
    const lane = await supabase
        .from("lanes")
        .select("id")
        .eq("workspace_key", apiKey)
        .eq("board_id", params.boardId)
        .eq("key", params.laneKey)
        .maybeSingle();

    if (lane.error || !lane.data) {
        if (lane.error) console.error("createCard lane lookup failed", lane.error);
        return null;
    }

    const { data: maxRow } = await supabase
        .from("cards")
        .select("order_index")
        .eq("workspace_key", apiKey)
        .eq("lane_id", lane.data.id)
        .order("order_index", { ascending: false })
        .limit(1)
        .maybeSingle();

    const nextOrder = (maxRow?.order_index ?? -1) + 1;
    const timestamp = now();

    const cardRow: CardRow = {
        id: uuidv4(),
        workspace_key: apiKey,
        board_id: params.boardId,
        lane_id: lane.data.id,
        title: params.title,
        description: params.description ?? "",
        due_date: null,
        priority: "medium",
        color_label: null,
        tags: [],
        checklist: [],
        agent_logs: [],
        activity_log: [
            {
                id: uuidv4(),
                action: "created",
                timestamp,
            },
        ],
        archived: false,
        order_index: nextOrder,
        created_at: timestamp,
        updated_at: timestamp,
    };

    const { error } = await supabase.from("cards").insert(cardRow);
    if (error) {
        console.error("createCard failed", error);
        return null;
    }

    return mapCard(cardRow);
}

export async function updateCard(
    apiKey: string,
    cardId: string,
    updates: Partial<
        Pick<
            Card,
            | "title"
            | "description"
            | "dueDate"
            | "priority"
            | "colorLabel"
            | "tags"
            | "checklist"
            | "archived"
            | "order"
            | "laneId"
        >
    > & { laneKey?: string }
): Promise<Card | null> {
    const supabase = getSupabaseClient();
    const { data: cardRow, error } = await supabase
        .from("cards")
        .select("*")
        .eq("id", cardId)
        .eq("workspace_key", apiKey)
        .single();

    if (error || !cardRow) {
        console.error("updateCard lookup failed", error);
        return null;
    }

    const { laneKey, ...cardUpdates } = updates;
    let nextLaneId = cardUpdates.laneId;
    if (!nextLaneId && laneKey && isLaneKey(laneKey)) {
        const { data: laneRow } = await supabase
            .from("lanes")
            .select("id")
            .eq("workspace_key", apiKey)
            .eq("board_id", cardRow.board_id)
            .eq("key", laneKey)
            .maybeSingle();
        nextLaneId = laneRow?.id;
    }

    const updateRow: Partial<CardRow> = {
        updated_at: now(),
    };

    if (cardUpdates.title !== undefined) updateRow.title = cardUpdates.title;
    if (cardUpdates.description !== undefined)
        updateRow.description = cardUpdates.description;
    if (cardUpdates.dueDate !== undefined) updateRow.due_date = cardUpdates.dueDate;
    if (cardUpdates.priority !== undefined) updateRow.priority = cardUpdates.priority;
    if (cardUpdates.colorLabel !== undefined)
        updateRow.color_label = cardUpdates.colorLabel;
    if (cardUpdates.tags !== undefined) updateRow.tags = cardUpdates.tags;
    if (cardUpdates.checklist !== undefined) updateRow.checklist = cardUpdates.checklist;
    if (cardUpdates.archived !== undefined) updateRow.archived = cardUpdates.archived;
    if (cardUpdates.order !== undefined) updateRow.order_index = cardUpdates.order;
    if (nextLaneId) updateRow.lane_id = nextLaneId;

    const nextActivity: ActivityEntry = {
        id: uuidv4(),
        action:
            nextLaneId && nextLaneId !== cardRow.lane_id ? "moved" : "updated",
        timestamp: now(),
        detail:
            nextLaneId && nextLaneId !== cardRow.lane_id
                ? undefined
                : Object.keys(cardUpdates).join(", "),
    };

    updateRow.activity_log = appendActivityLog(cardRow.activity_log, nextActivity);

    if (nextLaneId && nextLaneId !== cardRow.lane_id) {
        const { data: laneRow } = await supabase
            .from("lanes")
            .select("title")
            .eq("id", nextLaneId)
            .eq("workspace_key", apiKey)
            .maybeSingle();
        if (laneRow?.title) {
            const activityLog = appendActivityLog(cardRow.activity_log, {
                ...nextActivity,
                detail: `to \"${laneRow.title}\"`,
            });
            updateRow.activity_log = activityLog;
        }
    }

    const { data: updated, error: updateError } = await supabase
        .from("cards")
        .update(updateRow)
        .eq("id", cardId)
        .eq("workspace_key", apiKey)
        .select("*")
        .single();

    if (updateError || !updated) {
        console.error("updateCard failed", updateError);
        return null;
    }

    return mapCard(updated as CardRow);
}

export async function deleteCard(apiKey: string, cardId: string) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from("cards")
        .delete()
        .eq("id", cardId)
        .eq("workspace_key", apiKey)
        .select("id")
        .maybeSingle();

    if (error || !data) {
        if (error) console.error("deleteCard failed", error);
        return false;
    }

    return true;
}

export async function appendAgentLog(
    apiKey: string,
    cardId: string,
    entry: Omit<AgentLogEntry, "id" | "timestamp">
): Promise<Card | null> {
    const supabase = getSupabaseClient();
    const { data: cardRow, error } = await supabase
        .from("cards")
        .select("*")
        .eq("id", cardId)
        .eq("workspace_key", apiKey)
        .single();

    if (error || !cardRow) {
        console.error("appendAgentLog lookup failed", error);
        return null;
    }

    const log: AgentLogEntry = {
        id: uuidv4(),
        timestamp: now(),
        source: entry.source,
        content: entry.content,
        exitCode: entry.exitCode,
    };

    const updateRow: Partial<CardRow> = {
        agent_logs: [...normalizeArray<AgentLogEntry>(cardRow.agent_logs), log],
        updated_at: now(),
    };

    const { data: updated, error: updateError } = await supabase
        .from("cards")
        .update(updateRow)
        .eq("id", cardId)
        .eq("workspace_key", apiKey)
        .select("*")
        .single();

    if (updateError || !updated) {
        console.error("appendAgentLog failed", updateError);
        return null;
    }

    return mapCard(updated as CardRow);
}

export async function replaceChecklist(
    apiKey: string,
    cardId: string,
    items: ChecklistItem[]
): Promise<Card | null> {
    const supabase = getSupabaseClient();
    const { data: updated, error } = await supabase
        .from("cards")
        .update({ checklist: items, updated_at: now() })
        .eq("id", cardId)
        .eq("workspace_key", apiKey)
        .select("*")
        .single();

    if (error || !updated) {
        console.error("replaceChecklist failed", error);
        return null;
    }

    return mapCard(updated as CardRow);
}

export async function toggleChecklistItem(
    apiKey: string,
    cardId: string,
    itemId: string,
    completed: boolean
): Promise<Card | null> {
    const supabase = getSupabaseClient();
    const { data: cardRow, error } = await supabase
        .from("cards")
        .select("*")
        .eq("id", cardId)
        .eq("workspace_key", apiKey)
        .single();

    if (error || !cardRow) {
        console.error("toggleChecklistItem lookup failed", error);
        return null;
    }

    const checklist = normalizeArray<ChecklistItem>(cardRow.checklist).map((item) =>
        item.id === itemId ? { ...item, completed } : item
    );

    const { data: updated, error: updateError } = await supabase
        .from("cards")
        .update({ checklist, updated_at: now() })
        .eq("id", cardId)
        .eq("workspace_key", apiKey)
        .select("*")
        .single();

    if (updateError || !updated) {
        console.error("toggleChecklistItem failed", updateError);
        return null;
    }

    return mapCard(updated as CardRow);
}

export async function reorderLaneCards(
    apiKey: string,
    laneId: string,
    cardIds: string[]
) {
    const supabase = getSupabaseClient();
    const timestamp = now();
    const updates = cardIds.map((id, index) => ({
        id,
        workspace_key: apiKey,
        lane_id: laneId,
        order_index: index,
        updated_at: timestamp,
    }));

    const { error } = await supabase.from("cards").upsert(updates, {
        onConflict: "id",
    });

    if (error) {
        console.error("reorderLaneCards failed", error);
    }
}

export async function claimNextTodo(apiKey: string, boardId: string) {
    const supabase = getSupabaseClient();
    const { data: todoLane, error: todoError } = await supabase
        .from("lanes")
        .select("id")
        .eq("workspace_key", apiKey)
        .eq("board_id", boardId)
        .eq("key", "todo")
        .maybeSingle();

    const { data: doingLane, error: doingError } = await supabase
        .from("lanes")
        .select("id, title")
        .eq("workspace_key", apiKey)
        .eq("board_id", boardId)
        .eq("key", "doing")
        .maybeSingle();

    if (todoError || doingError || !todoLane || !doingLane) {
        if (todoError || doingError) {
            console.error("claimNextTodo lane lookup failed", todoError || doingError);
        }
        return null;
    }

    const { data: cardRow } = await supabase
        .from("cards")
        .select("*")
        .eq("workspace_key", apiKey)
        .eq("lane_id", todoLane.id)
        .eq("archived", false)
        .order("order_index", { ascending: true })
        .limit(1)
        .maybeSingle();

    if (!cardRow) return null;

    const { data: maxRow } = await supabase
        .from("cards")
        .select("order_index")
        .eq("workspace_key", apiKey)
        .eq("lane_id", doingLane.id)
        .order("order_index", { ascending: false })
        .limit(1)
        .maybeSingle();

    const nextOrder = (maxRow?.order_index ?? -1) + 1;
    const activityLog = appendActivityLog(cardRow.activity_log, {
        id: uuidv4(),
        action: "moved",
        timestamp: now(),
        detail: `to \"${doingLane.title}\"`,
    });

    const { data: updated, error } = await supabase
        .from("cards")
        .update({
            lane_id: doingLane.id,
            order_index: nextOrder,
            updated_at: now(),
            activity_log: activityLog,
        })
        .eq("id", cardRow.id)
        .eq("workspace_key", apiKey)
        .select("*")
        .single();

    if (error || !updated) {
        console.error("claimNextTodo update failed", error);
        return null;
    }

    return mapCard(updated as CardRow);
}

export async function claimNextTodoAcrossBoards(apiKey: string) {
    const supabase = getSupabaseClient();
    const { data: boards, error } = await supabase
        .from("boards")
        .select("*")
        .eq("workspace_key", apiKey)
        .order("created_at", { ascending: true });

    if (error || !boards) {
        if (error) console.error("claimNextTodoAcrossBoards failed", error);
        return null;
    }

    for (const board of boards as BoardRow[]) {
        const card = await claimNextTodo(apiKey, board.id);
        if (card) {
            return { card, board: mapBoard(board) };
        }
    }

    return null;
}

export async function completeTask(
    apiKey: string,
    cardId: string,
    destination: LaneKey = "review"
): Promise<Card | null> {
    const supabase = getSupabaseClient();
    const { data: cardRow, error } = await supabase
        .from("cards")
        .select("*")
        .eq("id", cardId)
        .eq("workspace_key", apiKey)
        .single();

    if (error || !cardRow) {
        console.error("completeTask lookup failed", error);
        return null;
    }

    const { data: laneRow } = await supabase
        .from("lanes")
        .select("id, title")
        .eq("workspace_key", apiKey)
        .eq("board_id", cardRow.board_id)
        .eq("key", destination)
        .maybeSingle();

    if (!laneRow) return null;

    const { data: maxRow } = await supabase
        .from("cards")
        .select("order_index")
        .eq("workspace_key", apiKey)
        .eq("lane_id", laneRow.id)
        .order("order_index", { ascending: false })
        .limit(1)
        .maybeSingle();

    const nextOrder = (maxRow?.order_index ?? -1) + 1;
    const activityLog = appendActivityLog(cardRow.activity_log, {
        id: uuidv4(),
        action: "moved",
        timestamp: now(),
        detail: `to \"${laneRow.title}\"`,
    });

    const { data: updated, error: updateError } = await supabase
        .from("cards")
        .update({
            lane_id: laneRow.id,
            order_index: nextOrder,
            updated_at: now(),
            activity_log: activityLog,
        })
        .eq("id", cardId)
        .eq("workspace_key", apiKey)
        .select("*")
        .single();

    if (updateError || !updated) {
        console.error("completeTask update failed", updateError);
        return null;
    }

    return mapCard(updated as CardRow);
}
