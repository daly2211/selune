import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import type { ChecklistItem } from "@/lib/types";
import { replaceChecklist } from "@/lib/server/orchestrator-store";
import { requireWorkspace } from "@/lib/server/request";

function normalizeChecklist(items: unknown): ChecklistItem[] {
    if (!Array.isArray(items)) return [];
    return items
        .map((item) => {
            if (!item || typeof item !== "object") return null;
            const maybe = item as { id?: string; text?: string; completed?: boolean };
            const text = typeof maybe.text === "string" ? maybe.text.trim() : "";
            if (!text) return null;
            return {
                id: typeof maybe.id === "string" && maybe.id ? maybe.id : uuidv4(),
                text,
                completed: Boolean(maybe.completed),
            };
        })
        .filter((item): item is ChecklistItem => Boolean(item));
}

export async function POST(
    request: Request,
    { params }: { params: { cardId: string } }
) {
    const result = await requireWorkspace(request);
    if ("error" in result) return result.error;

    const body = await request.json().catch(() => ({}));
    const items = normalizeChecklist(body.items);

    const card = await replaceChecklist(result.apiKey, params.cardId, items);
    if (!card) {
        return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    return NextResponse.json({ card });
}

export async function PUT(
    request: Request,
    { params }: { params: { cardId: string } }
) {
    return POST(request, { params });
}
