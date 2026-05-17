import { NextResponse } from "next/server";
import { deleteBoard, updateBoard } from "@/lib/server/orchestrator-store";
import { requireWorkspace } from "@/lib/server/request";

export async function PATCH(
    request: Request,
    { params }: { params: { boardId: string } }
) {
    const result = await requireWorkspace(request);
    if ("error" in result) return result.error;

    const body = await request.json().catch(() => ({}));
    const board = await updateBoard(result.apiKey, params.boardId, body);

    if (!board) {
        return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    return NextResponse.json({ board });
}

export async function DELETE(
    request: Request,
    { params }: { params: { boardId: string } }
) {
    const result = await requireWorkspace(request);
    if ("error" in result) return result.error;

    const ok = await deleteBoard(result.apiKey, params.boardId);
    if (!ok) {
        return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
}
