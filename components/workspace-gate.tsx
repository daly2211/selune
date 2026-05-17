"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";

export function WorkspaceGate() {
    const apiKey = useStore((s) => s.apiKey);
    const workspaceReady = useStore((s) => s.workspaceReady);
    const bootstrapWorkspace = useStore((s) => s.bootstrapWorkspace);
    const attachWorkspace = useStore((s) => s.attachWorkspace);

    const [existingKey, setExistingKey] = useState("");
    const [error, setError] = useState("");
    const [generatedKey, setGeneratedKey] = useState<string | null>(null);
    const [acknowledged, setAcknowledged] = useState(false);

    const needsGate = !apiKey || !workspaceReady || (generatedKey && !acknowledged);

    if (!needsGate) return null;

    async function handleGenerate() {
        setError("");
        const key = await bootstrapWorkspace();
        if (!key) {
            setError("Failed to generate API key.");
            return;
        }
        setGeneratedKey(key);
        setAcknowledged(false);
    }

    async function handleAttach() {
        setError("");
        const trimmed = existingKey.trim();
        if (!trimmed) {
            setError("Enter your API key to continue.");
            return;
        }
        const ok = await attachWorkspace(trimmed);
        if (!ok) {
            setError("API key not found.");
            return;
        }
    }

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-[520px] bg-bg-primary border border-border-default rounded-xl shadow-[var(--shadow-popup)] p-6">
                <div className="text-[18px] font-semibold text-text-primary mb-1">
                    Workspace access
                </div>
                <p className="text-[13px] text-text-tertiary mb-5">
                    Use your API key to connect this browser to a workspace.
                </p>

                {generatedKey && !acknowledged ? (
                    <div className="mb-5">
                        <div className="text-[12px] text-text-muted mb-2">
                            Your new API key (save it somewhere safe):
                        </div>
                        <div className="px-3 py-2 rounded-md bg-bg-secondary border border-border-default text-[12px] font-mono text-text-primary break-all">
                            {generatedKey}
                        </div>
                        <button
                            onClick={() => setAcknowledged(true)}
                            className="mt-4 px-3 py-2 text-[13px] rounded-md bg-accent-blue text-white hover:bg-accent-blue-muted transition-theme"
                        >
                            I have saved this key
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-2 mb-4">
                            <button
                                onClick={handleGenerate}
                                className="px-3 py-2 text-[13px] rounded-md bg-accent-blue text-white hover:bg-accent-blue-muted transition-theme"
                            >
                                Generate new API key
                            </button>
                            <span className="text-[12px] text-text-muted">
                                First time here? Create a new workspace.
                            </span>
                        </div>

                        <div className="border-t border-border-subtle pt-4">
                            <div className="text-[12px] text-text-muted mb-2">
                                Already have a key?
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    value={existingKey}
                                    onChange={(e) => setExistingKey(e.target.value)}
                                    placeholder="Paste API key"
                                    className="flex-1 px-3 py-2 rounded-md bg-bg-secondary border border-border-default text-[13px] text-text-primary outline-none"
                                />
                                <button
                                    onClick={handleAttach}
                                    className="px-3 py-2 text-[13px] rounded-md border border-border-default text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-theme"
                                >
                                    Connect
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {error && (
                    <div className="mt-4 text-[12px] text-accent-red">{error}</div>
                )}
            </div>
        </div>
    );
}
