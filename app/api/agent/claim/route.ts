import { NextResponse } from "next/server";
import {
    claimNextTodo,
    claimNextTodoAcrossBoards,
    getBoard,
} from "@/lib/server/orchestrator-store";
import { requireWorkspace } from "@/lib/server/request";

type TaskInfo = {
    id: string;
    title: string;
    description: string;
    pushToBranch?: boolean;
};

function resolveBaseUrl(request: Request) {
    const url = new URL(request.url);
    const forwardedProto = request.headers.get("x-forwarded-proto");
    const forwardedHost = request.headers.get("x-forwarded-host") || request.headers.get("host");
    if (forwardedProto && forwardedHost) {
        return `${forwardedProto}://${forwardedHost}`;
    }
    if (forwardedHost) {
        return `${url.protocol}//${forwardedHost}`;
    }
    return url.origin;
}

function buildPrompt(
    task: TaskInfo,
    projectPath: string,
    boardTitle: string | undefined,
    serverUrl: string,
    apiKey: string
) {
    const instructions = [
        "Use curl to call the server API and keep the task todo list updated.",
        `Base URL: ${serverUrl}`,
        `Header: X-API-Key: ${apiKey}`,
        "Create/replace todo list:",
        `POST ${serverUrl}/api/tasks/${task.id}/todos`,
        "Body: { items: [{ text, completed }] }",
        "Update a single item:",
        `PATCH ${serverUrl}/api/tasks/${task.id}/todos/{todoId}`,
        "Body: { completed: true or false }",
        "Replace full list:",
        `PUT ${serverUrl}/api/tasks/${task.id}/todos`,
        "Body: { items: [...] }",
    ].join(" — ");

    const parts = [`Task: ${task.title}`];
    if (boardTitle) parts.push(`Board: ${boardTitle}`);
    if (task.description) parts.push(task.description);
    if (projectPath) parts.push(`Project path: ${projectPath}`);
    parts.push("---");
    parts.push(instructions);

    if (task.pushToBranch) {
        parts.push(
            "Branch workflow: create a new branch from the default branch, push it to the remote, then report the branch link."
        );
        parts.push(`POST ${serverUrl}/api/agent/branch`);
        parts.push(`Body: { cardId: \"${task.id}\", branchUrl: \"<url>\" }`);
    }

    return parts.join(" — ");
}

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
        const serverUrl = resolveBaseUrl(request);
        const prompt = buildPrompt(
            card as TaskInfo,
            board?.projectPath || "",
            board?.title,
            serverUrl,
            result.apiKey
        );
        return NextResponse.json({
            task: card,
            board,
            projectPath: board?.projectPath || "",
            prompt,
        });
    }

    const claimed = await claimNextTodoAcrossBoards(result.apiKey);
    if (!claimed) {
        return NextResponse.json({ task: null });
    }

    const serverUrl = resolveBaseUrl(request);
    const prompt = buildPrompt(
        claimed.card as TaskInfo,
        claimed.board.projectPath || "",
        claimed.board.title,
        serverUrl,
        result.apiKey
    );

    return NextResponse.json({
        task: claimed.card,
        board: claimed.board,
        projectPath: claimed.board.projectPath || "",
        prompt,
    });
}
