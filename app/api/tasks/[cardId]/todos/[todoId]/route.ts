import { NextResponse } from "next/server";
import { toggleChecklistItem } from "@/lib/server/orchestrator-store";
import { requireWorkspace } from "@/lib/server/request";

export async function PATCH(
    request: Request,
    { params }: { params: { cardId: string; todoId: string } }
) {
    const result = await requireWorkspace(request);
    if ("error" in result) return result.error;

    const body = await request.json().catch(() => ({}));
    const completed = Boolean(body.completed);

    const card = await toggleChecklistItem(
        result.apiKey,
        params.cardId,
        params.todoId,
        completed
    );

    if (!card) {
        return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    return NextResponse.json({ card });
}
