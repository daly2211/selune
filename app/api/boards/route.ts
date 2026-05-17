import { NextResponse } from "next/server";
import { createBoard } from "@/lib/server/orchestrator-store";
import { requireWorkspace } from "@/lib/server/request";

export async function POST(request: Request) {
    const result = await requireWorkspace(request);
    if ("error" in result) return result.error;

    const body = await request.json().catch(() => ({}));
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description = typeof body.description === "string" ? body.description : "";
    const projectPath = typeof body.projectPath === "string" ? body.projectPath : "";

    if (!title) {
        return NextResponse.json({ error: "Missing title" }, { status: 400 });
    }

    const created = await createBoard(result.apiKey, {
        title,
        description,
        projectPath,
    });
    if (!created) {
        return NextResponse.json({ error: "Failed to create board" }, { status: 500 });
    }
    return NextResponse.json(created);
}
