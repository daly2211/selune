"use client";

import { Sidebar } from "@/components/sidebar";
import { BoardView } from "@/components/board-view";
import { CardDetail } from "@/components/card-detail";
import { CommandPalette } from "@/components/command-palette";
import { BoardCreateModal } from "@/components/board-create-modal";
import { WorkspaceGate } from "@/components/workspace-gate";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useWorkspaceSync } from "@/hooks/use-workspace-sync";

export function AppShell() {
    useKeyboardShortcuts();
    useWorkspaceSync();

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-bg-primary">
            <WorkspaceGate />
            <BoardCreateModal />
            <Sidebar />
            <BoardView />
            <CardDetail />
            <CommandPalette />
        </div>
    );
}
