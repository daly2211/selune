import { NextResponse } from "next/server";
import { getWorkspaceState } from "@/lib/server/orchestrator-store";
import { requireWorkspace } from "@/lib/server/request";

export async function GET(request: Request) {
    const result = await requireWorkspace(request);
    if ("error" in result) return result.error;
    const workspace = await getWorkspaceState(result.apiKey);
    if (!workspace) {
        return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }
    return NextResponse.json({ workspace });
}
