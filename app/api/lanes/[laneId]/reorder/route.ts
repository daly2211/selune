import { NextResponse } from "next/server";
import { reorderLaneCards } from "@/lib/server/orchestrator-store";
import { requireWorkspace } from "@/lib/server/request";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ laneId: string }> }
) {
    const result = await requireWorkspace(request);
    if ("error" in result) return result.error;

    const { laneId } = await params;
    const body = await request.json().catch(() => ({}));
    const cardIds = Array.isArray(body.cardIds)
        ? body.cardIds.filter((id: unknown) => typeof id === "string")
        : [];

    if (cardIds.length === 0) {
        return NextResponse.json({ error: "Missing cardIds" }, { status: 400 });
    }

    await reorderLaneCards(result.apiKey, laneId, cardIds);
    return NextResponse.json({ ok: true });
}
