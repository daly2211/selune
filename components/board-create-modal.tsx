"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";

export function BoardCreateModal() {
    const boardCreateOpen = useStore((s) => s.boardCreateOpen);
    const closeBoardCreate = useStore((s) => s.closeBoardCreate);
    const createBoard = useStore((s) => s.createBoard);

    const [title, setTitle] = useState("");
    const [projectPath, setProjectPath] = useState("");
    const [error, setError] = useState("");
    const titleRef = useRef<HTMLInputElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (boardCreateOpen) {
            setTitle("");
            setProjectPath("");
            setError("");
            setTimeout(() => titleRef.current?.focus(), 50);
        }
    }, [boardCreateOpen]);

    useEffect(() => {
        function handleKey(e: KeyboardEvent) {
            if (e.key === "Escape") closeBoardCreate();
        }
        if (boardCreateOpen) {
            document.addEventListener("keydown", handleKey);
            return () => document.removeEventListener("keydown", handleKey);
        }
    }, [boardCreateOpen, closeBoardCreate]);

    async function handleCreate() {
        const trimmedTitle = title.trim();
        const trimmedPath = projectPath.trim();
        if (!trimmedTitle) {
            setError("Title is required.");
            return;
        }
        if (!trimmedPath) {
            setError("Project path is required.");
            return;
        }
        setError("");
        const board = await createBoard(trimmedTitle, trimmedPath);
        if (!board) {
            setError("Failed to create board.");
            return;
        }
        closeBoardCreate();
    }

    if (!boardCreateOpen) return null;

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
            onClick={(e) => {
                if (e.target === overlayRef.current) closeBoardCreate();
            }}
        >
            <div className="w-full max-w-[520px] bg-bg-primary border border-border-default rounded-xl shadow-[var(--shadow-popup)] p-6">
                <div className="text-[18px] font-semibold text-text-primary mb-1">
                    Create board
                </div>
                <p className="text-[13px] text-text-tertiary mb-5">
                    Add a board title and the project path for the agent host.
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="text-[11px] uppercase tracking-wide text-text-tertiary">
                            Title
                        </label>
                        <input
                            ref={titleRef}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Board title"
                            className="mt-2 w-full px-3 py-2 rounded-md bg-bg-secondary border border-border-default text-[13px] text-text-primary outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-[11px] uppercase tracking-wide text-text-tertiary">
                            Project path
                        </label>
                        <input
                            value={projectPath}
                            onChange={(e) => setProjectPath(e.target.value)}
                            placeholder="C:\\projects\\my-app"
                            className="mt-2 w-full px-3 py-2 rounded-md bg-bg-secondary border border-border-default text-[13px] text-text-primary outline-none"
                        />
                        <div className="text-[11px] text-text-muted mt-1">
                            This is used by the agent client to set the working directory.
                        </div>
                    </div>
                </div>

                {error && <div className="mt-4 text-[12px] text-accent-red">{error}</div>}

                <div className="mt-6 flex items-center justify-end gap-2">
                    <button
                        onClick={closeBoardCreate}
                        className="px-3 py-2 text-[13px] rounded-md border border-border-default text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-theme"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        className="px-3 py-2 text-[13px] rounded-md bg-accent-blue text-white hover:bg-accent-blue-muted transition-theme"
                    >
                        Create board
                    </button>
                </div>
            </div>
        </div>
    );
}
