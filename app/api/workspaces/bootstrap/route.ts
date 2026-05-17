import { NextResponse } from "next/server";
import { createWorkspace } from "@/lib/server/orchestrator-store";

export async function POST() {
    const workspace = await createWorkspace();
    if (!workspace) {
        return NextResponse.json({ error: "Failed to create workspace" }, { status: 500 });
    }
    return NextResponse.json({ apiKey: workspace.apiKey, workspace });
}
