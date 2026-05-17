import { NextResponse } from "next/server";
import { deleteBoard, updateBoard } from "@/lib/server/orchestrator-store";
import { requireWorkspace } from "@/lib/server/request";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ boardId: string }> }
) {
    const result = await requireWorkspace(request);
    if ("error" in result) return result.error;

    const { boardId } = await params;
    const body = await request.json().catch(() => ({}));
    const board = await updateBoard(result.apiKey, boardId, body);

    if (!board) {
        return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    return NextResponse.json({ board });
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ boardId: string }> }
) {
    const result = await requireWorkspace(request);
    if ("error" in result) return result.error;

    const { boardId } = await params;
    const ok = await deleteBoard(result.apiKey, boardId);
    if (!ok) {
        return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
}
