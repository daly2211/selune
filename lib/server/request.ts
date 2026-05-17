import { NextResponse } from "next/server";
import { getWorkspace } from "./orchestrator-store";

export function getApiKey(request: Request): string | null {
    const header = request.headers.get("x-api-key");
    if (header) return header.trim();
    const auth = request.headers.get("authorization");
    if (auth?.toLowerCase().startsWith("bearer ")) {
        return auth.slice(7).trim();
    }
    const url = new URL(request.url);
    const apiKey = url.searchParams.get("apiKey");
    return apiKey?.trim() || null;
}

export async function requireWorkspace(request: Request) {
    const apiKey = getApiKey(request);
    if (!apiKey) {
        return { error: NextResponse.json({ error: "Missing API key" }, { status: 401 }) };
    }
    const workspace = await getWorkspace(apiKey);
    if (!workspace) {
        return { error: NextResponse.json({ error: "Invalid API key" }, { status: 403 }) };
    }
    return { workspace, apiKey };
}
