create table if not exists workspaces (
    api_key text primary key,
    created_at timestamptz not null,
    updated_at timestamptz not null
);

create table if not exists boards (
    id uuid primary key,
    workspace_key text not null references workspaces(api_key) on delete cascade,
    title text not null,
    description text not null default '',
    project_path text not null default '',
    favorite boolean not null default false,
    archived boolean not null default false,
    created_at timestamptz not null,
    updated_at timestamptz not null
);

create table if not exists lanes (
    id uuid primary key,
    workspace_key text not null references workspaces(api_key) on delete cascade,
    board_id uuid not null references boards(id) on delete cascade,
    key text not null,
    title text not null,
    order_index integer not null,
    collapsed boolean not null default false,
    lane_limit integer,
    color text,
    locked boolean not null default true,
    created_at timestamptz not null,
    updated_at timestamptz not null
);

create table if not exists cards (
    id uuid primary key,
    workspace_key text not null references workspaces(api_key) on delete cascade,
    board_id uuid not null references boards(id) on delete cascade,
    lane_id uuid not null references lanes(id) on delete cascade,
    title text not null,
    description text not null default '',
    due_date timestamptz,
    priority text not null,
    color_label text,
    tags jsonb not null default '[]'::jsonb,
    checklist jsonb not null default '[]'::jsonb,
    agent_logs jsonb not null default '[]'::jsonb,
    activity_log jsonb not null default '[]'::jsonb,
    archived boolean not null default false,
    order_index integer not null,
    created_at timestamptz not null,
    updated_at timestamptz not null
);

create index if not exists boards_workspace_key_idx on boards(workspace_key);
create index if not exists lanes_workspace_key_idx on lanes(workspace_key);
create index if not exists cards_workspace_key_idx on cards(workspace_key);
create index if not exists cards_lane_id_idx on cards(lane_id);
