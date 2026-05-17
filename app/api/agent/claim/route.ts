import { NextResponse } from "next/server";
import {
    claimNextTodo,
    claimNextTodoAcrossBoards,
    getBoard,
} from "@/lib/server/orchestrator-store";
import { requireWorkspace } from "@/lib/server/request";

export async function POST(request: Request) {
    const result = await requireWorkspace(request);
    if ("error" in result) return result.error;

    const body = await request.json().catch(() => ({}));
    const boardId = typeof body.boardId === "string" ? body.boardId : "";

    if (boardId) {
        const card = await claimNextTodo(result.apiKey, boardId);
        if (!card) {
            return NextResponse.json({ task: null });
        }
        const board = await getBoard(result.apiKey, boardId);
        return NextResponse.json({
            task: card,
            board,
            projectPath: board?.projectPath || "",
        });
    }

    const claimed = await claimNextTodoAcrossBoards(result.apiKey);
    if (!claimed) {
        return NextResponse.json({ task: null });
    }

    return NextResponse.json({
        task: claimed.card,
        board: claimed.board,
        projectPath: claimed.board.projectPath || "",
    });
}
