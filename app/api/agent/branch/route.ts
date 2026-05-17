import { NextResponse } from "next/server";
import { updateCard } from "@/lib/server/orchestrator-store";
import { requireWorkspace } from "@/lib/server/request";

export async function POST(request: Request) {
    const result = await requireWorkspace(request);
    if ("error" in result) return result.error;

    const body = await request.json().catch(() => ({}));
    const cardId = typeof body.cardId === "string" ? body.cardId : "";
    const branchUrl = typeof body.branchUrl === "string" ? body.branchUrl.trim() : "";

    if (!cardId || !branchUrl) {
        return NextResponse.json(
            { error: "Missing cardId or branchUrl" },
            { status: 400 }
        );
    }

    const card = await updateCard(result.apiKey, cardId, { branchUrl });
    if (!card) {
        return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    return NextResponse.json({ card });
}
