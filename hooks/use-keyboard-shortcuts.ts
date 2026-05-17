"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";

export function useKeyboardShortcuts() {
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            const target = e.target as HTMLElement;
            const isInput =
                target.tagName === "INPUT" ||
                target.tagName === "TEXTAREA" ||
                target.isContentEditable;

            // Cmd/Ctrl + K -> Command palette (always)
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                useStore.getState().toggleCommandPalette();
                return;
            }

            // Cmd/Ctrl + Z -> Undo (always)
            if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
                e.preventDefault();
                useStore.getState().undo();
                return;
            }

            // Cmd/Ctrl + B -> Toggle sidebar
            if ((e.metaKey || e.ctrlKey) && e.key === "b") {
                e.preventDefault();
                useStore.getState().toggleSidebar();
                return;
            }

            // Don't trigger shortcuts when typing in inputs
            if (isInput) return;

            // / -> Focus search
            if (e.key === "/") {
                e.preventDefault();
                const searchInput = document.querySelector<HTMLInputElement>(
                    'input[placeholder="Search cards…"]'
                );
                searchInput?.focus();
                return;
            }

            // Escape -> close active card
            if (e.key === "Escape") {
                const state = useStore.getState();
                if (state.activeCardId) {
                    state.setActiveCard(null);
                }
            }
        }

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);
}
