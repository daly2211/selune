import { NextResponse } from "next/server";
import { createCard } from "@/lib/server/orchestrator-store";
import { requireWorkspace } from "@/lib/server/request";

export async function POST(request: Request) {
    const result = await requireWorkspace(request);
    if ("error" in result) return result.error;

    const body = await request.json().catch(() => ({}));
    const boardId = typeof body.boardId === "string" ? body.boardId : "";
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description = typeof body.description === "string" ? body.description : "";
    const laneKey = typeof body.laneKey === "string" ? body.laneKey : "backlog";

    if (!boardId || !title) {
        return NextResponse.json({ error: "Missing boardId or title" }, { status: 400 });
    }

    if (laneKey !== "backlog") {
        return NextResponse.json(
            { error: "Cards can only be created in Backlog" },
            { status: 400 }
        );
    }

    const card = await createCard(result.apiKey, {
        boardId,
        laneKey: "backlog",
        title,
        description,
    });

    if (!card) {
        return NextResponse.json({ error: "Board or lane not found" }, { status: 404 });
    }

    return NextResponse.json({ card });
}
