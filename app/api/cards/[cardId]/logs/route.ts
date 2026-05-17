import { NextResponse } from "next/server";
import { appendAgentLog } from "@/lib/server/orchestrator-store";
import { requireWorkspace } from "@/lib/server/request";

export async function POST(
    request: Request,
    { params }: { params: { cardId: string } }
) {
    const result = await requireWorkspace(request);
    if ("error" in result) return result.error;

    const body = await request.json().catch(() => ({}));
    const content = typeof body.content === "string" ? body.content : "";
    const source = body.source === "agent" ? "agent" : "client";
    const exitCode = typeof body.exitCode === "number" ? body.exitCode : undefined;

    if (!content) {
        return NextResponse.json({ error: "Missing content" }, { status: 400 });
    }

    const card = await appendAgentLog(result.apiKey, params.cardId, {
        source,
        content,
        exitCode,
    });

    if (!card) {
        return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    return NextResponse.json({ card });
}
