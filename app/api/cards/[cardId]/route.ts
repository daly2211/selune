import { NextResponse } from "next/server";
import { deleteCard, updateCard } from "@/lib/server/orchestrator-store";
import { requireWorkspace } from "@/lib/server/request";

export async function PATCH(
    request: Request,
    { params }: { params: { cardId: string } }
) {
    const result = await requireWorkspace(request);
    if ("error" in result) return result.error;

    const body = await request.json().catch(() => ({}));
    const card = await updateCard(result.apiKey, params.cardId, body);

    if (!card) {
        return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    return NextResponse.json({ card });
}

export async function DELETE(
    request: Request,
    { params }: { params: { cardId: string } }
) {
    const result = await requireWorkspace(request);
    if ("error" in result) return result.error;

    const ok = await deleteCard(result.apiKey, params.cardId);
    if (!ok) {
        return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
}
