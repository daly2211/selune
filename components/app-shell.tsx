"use client";

import { useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { BoardView } from "@/components/board-view";
import { CardDetail } from "@/components/card-detail";
import { CommandPalette } from "@/components/command-palette";
import { BoardCreateModal } from "@/components/board-create-modal";
import { WorkspaceGate } from "@/components/workspace-gate";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useWorkspaceSync } from "@/hooks/use-workspace-sync";
import { useStore } from "@/lib/store";

export function AppShell() {
    useKeyboardShortcuts();
    useWorkspaceSync();

    useEffect(() => {
        if (window.innerWidth < 768 && !useStore.getState().sidebarCollapsed) {
            useStore.getState().toggleSidebar();
        }

        const logo = new window.Image();
        logo.src = "/logo.png";
    }, []);

    return (
        <div className="flex h-dvh w-full overflow-hidden bg-bg-primary">
            <WorkspaceGate />
            <BoardCreateModal />
            <Sidebar />
            <BoardView />
            <CardDetail />
            <CommandPalette />
        </div>
    );
}
