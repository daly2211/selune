"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";

export function useWorkspaceSync(intervalMs = 4000) {
    const apiKey = useStore((s) => s.apiKey);
    const syncWorkspace = useStore((s) => s.syncWorkspace);

    useEffect(() => {
        if (!apiKey) return;
        void syncWorkspace();
        const timer = setInterval(() => {
            void syncWorkspace();
        }, intervalMs);
        return () => clearInterval(timer);
    }, [apiKey, intervalMs, syncWorkspace]);
}
