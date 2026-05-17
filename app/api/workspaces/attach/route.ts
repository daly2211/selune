import { NextResponse } from "next/server";
import { getWorkspaceState } from "@/lib/server/orchestrator-store";

export async function POST(request: Request) {
    const body = await request.json().catch(() => ({}));
    const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";

    if (!apiKey) {
        return NextResponse.json({ error: "Missing apiKey" }, { status: 400 });
    }

    const workspace = await getWorkspaceState(apiKey);
    if (!workspace) {
        return NextResponse.json({ error: "Invalid API key" }, { status: 404 });
    }

    return NextResponse.json({ apiKey, workspace });
}
