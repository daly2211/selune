export type Json = unknown;

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
    tags: Json;
    checklist: Json;
    push_to_branch: boolean;
    branch_url: string | null;
    agent_logs: Json;
    activity_log: Json;
    archived: boolean;
    order_index: number;
    created_at: string;
    updated_at: string;
};

type Table<Row> = {
    Row: Row;
    Insert: Partial<Row>;
    Update: Partial<Row>;
    Relationships: [];
};

export type Database = {
    public: {
        Tables: {
            workspaces: Table<WorkspaceRow>;
            boards: Table<BoardRow>;
            lanes: Table<LaneRow>;
            cards: Table<CardRow>;
        };
        Views: Record<string, never>;
        Functions: Record<string, never>;
        Enums: Record<string, never>;
        CompositeTypes: Record<string, never>;
    };
};
