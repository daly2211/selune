import { NextResponse } from "next/server";
import { appendAgentLog, completeTask } from "@/lib/server/orchestrator-store";
import { requireWorkspace } from "@/lib/server/request";
import { isLaneKey } from "@/lib/kanban";

export async function POST(request: Request) {
    const result = await requireWorkspace(request);
    if ("error" in result) return result.error;

    const body = await request.json().catch(() => ({}));
    const cardId = typeof body.cardId === "string" ? body.cardId : "";
    const logs = typeof body.logs === "string" ? body.logs : "";
    const exitCode = typeof body.exitCode === "number" ? body.exitCode : undefined;
    const destination =
        typeof body.destination === "string" && isLaneKey(body.destination)
            ? body.destination
            : "review";

    if (!cardId) {
        return NextResponse.json({ error: "Missing cardId" }, { status: 400 });
    }

    let card = await completeTask(result.apiKey, cardId, destination);
    if (!card) {
        return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    if (logs) {
        card = (await appendAgentLog(result.apiKey, cardId, {
            source: "client",
            content: logs,
            exitCode,
        })) || card;
    }

    return NextResponse.json({ card });
}
