export const DEFAULT_LANES = [
    { key: "backlog", title: "Backlog" },
    { key: "todo", title: "To Do" },
    { key: "doing", title: "Doing" },
    { key: "review", title: "Human Review" },
    { key: "done", title: "Done" },
] as const;

export type LaneKey = (typeof DEFAULT_LANES)[number]["key"];

export function isLaneKey(value: string): value is LaneKey {
    return DEFAULT_LANES.some((lane) => lane.key === value);
}
