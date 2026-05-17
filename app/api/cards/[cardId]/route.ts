import { NextResponse } from "next/server";
import { deleteCard, updateCard } from "@/lib/server/orchestrator-store";
import { requireWorkspace } from "@/lib/server/request";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ cardId: string }> }
) {
    const result = await requireWorkspace(request);
    if ("error" in result) return result.error;

    const { cardId } = await params;
    const body = await request.json().catch(() => ({}));
    const card = await updateCard(result.apiKey, cardId, body);

    if (!card) {
        return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    return NextResponse.json({ card });
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ cardId: string }> }
) {
    const result = await requireWorkspace(request);
    if ("error" in result) return result.error;

    const { cardId } = await params;
    const ok = await deleteCard(result.apiKey, cardId);
    if (!ok) {
        return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
}
