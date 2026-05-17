"use client";

import { useState, useRef, useEffect } from "react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Priority, SortField, SortDirection } from "@/lib/types";
import {
    Search,
    Filter,
    SortAsc,
    X,
    ArrowUp,
    ArrowDown,
    Minus,
    AlertTriangle,
    ChevronDown,
} from "lucide-react";

const priorityOptions: { value: Priority; label: string; icon: typeof ArrowUp; class: string }[] = [
    { value: "urgent", label: "Urgent", icon: AlertTriangle, class: "text-priority-urgent" },
    { value: "high", label: "High", icon: ArrowUp, class: "text-priority-high" },
    { value: "medium", label: "Medium", icon: Minus, class: "text-priority-medium" },
    { value: "low", label: "Low", icon: ArrowDown, class: "text-priority-low" },
];

const dueDateOptions: { value: string; label: string }[] = [
    { value: "overdue", label: "Overdue" },
    { value: "today", label: "Today" },
    { value: "week", label: "This week" },
    { value: "month", label: "This month" },
];

const sortOptions: { value: SortField; label: string }[] = [
    { value: "manual", label: "Manual" },
    { value: "created", label: "Created" },
    { value: "updated", label: "Updated" },
    { value: "priority", label: "Priority" },
    { value: "dueDate", label: "Due date" },
    { value: "title", label: "Title" },
];

export function Toolbar() {
    const { filters, setFilters, resetFilters, sortField, sortDirection, setSort, getAllTags } =
        useStore();

    const [showFilters, setShowFilters] = useState(false);
    const [showSort, setShowSort] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);
    const sortRef = useRef<HTMLDivElement>(null);
    const allTags = getAllTags();

    const activeFilterCount =
        filters.priorities.length +
        filters.tags.length +
        (filters.dueDateRange ? 1 : 0) +
        (filters.showArchived ? 1 : 0);

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
                setShowFilters(false);
            }
            if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
                setShowSort(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    function togglePriority(p: Priority) {
        const current = filters.priorities;
        if (current.includes(p)) {
            setFilters({ priorities: current.filter((x) => x !== p) });
        } else {
            setFilters({ priorities: [...current, p] });
        }
    }

    function toggleTag(tag: string) {
        const current = filters.tags;
        if (current.includes(tag)) {
            setFilters({ tags: current.filter((x) => x !== tag) });
        } else {
            setFilters({ tags: [...current, tag] });
        }
    }

    return (
        <div className="flex flex-wrap items-center gap-2 px-3 py-2 sm:px-4 border-b border-border-default bg-bg-primary/80 backdrop-blur-md sticky top-0 z-20">
            {/* Search */}
            <div className="flex w-full flex-none items-center gap-1.5 bg-bg-secondary border border-border-subtle rounded-md px-2.5 py-1.5 focus-within:border-border-default transition-theme sm:flex-1 sm:max-w-[240px]">
                <Search size={13} className="text-text-muted flex-shrink-0" />
                <input
                    value={filters.search}
                    onChange={(e) => setFilters({ search: e.target.value })}
                    placeholder="Search cards…"
                    className="bg-transparent text-[13px] text-text-primary placeholder:text-text-muted outline-none flex-1 min-w-0"
                />
                {filters.search && (
                    <button
                        onClick={() => setFilters({ search: "" })}
                        className="text-text-muted hover:text-text-secondary transition-theme"
                    >
                        <X size={12} />
                    </button>
                )}
            </div>

            {/* Filter */}
            <div className="relative" ref={filterRef}>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1.5 text-[13px] rounded-md border transition-theme",
                        activeFilterCount > 0
                            ? "border-accent-blue/25 text-accent-blue bg-accent-blue-subtle"
                            : "border-border-subtle text-text-secondary hover:text-text-primary hover:bg-bg-hover"
                    )}
                >
                    <Filter size={13} />
                    <span>Filter</span>
                    {activeFilterCount > 0 && (
                        <span className="ml-0.5 min-w-[16px] h-4 rounded-full bg-accent-blue text-[10px] text-white flex items-center justify-center px-1">
                            {activeFilterCount}
                        </span>
                    )}
                </button>

                {showFilters && (
                    <div className="absolute left-0 top-full mt-1.5 w-[min(280px,calc(100vw-1.5rem))] max-h-[70dvh] overflow-y-auto bg-bg-elevated border border-border-default rounded-lg shadow-[var(--shadow-popup)] z-50 py-2">
                        {/* Priority */}
                        <div className="px-3 py-2">
                            <div className="text-[11px] font-medium text-text-muted uppercase tracking-[0.04em] mb-2">
                                Priority
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {priorityOptions.map((p) => {
                                    const Icon = p.icon;
                                    const active = filters.priorities.includes(p.value);
                                    return (
                                        <button
                                            key={p.value}
                                            onClick={() => togglePriority(p.value)}
                                            className={cn(
                                                "flex items-center gap-1.5 px-2 py-1 rounded-md text-[12px] border transition-theme",
                                                active
                                                    ? "border-accent-blue/25 bg-accent-blue-subtle text-accent-blue"
                                                    : "text-text-tertiary border-transparent hover:bg-bg-hover hover:text-text-secondary"
                                            )}
                                        >
                                            <Icon size={12} className={active ? p.class : ""} />
                                            {p.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Due Date */}
                        <div className="px-3 py-2">
                            <div className="text-[11px] font-medium text-text-muted uppercase tracking-[0.04em] mb-2">
                                Due Date
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {dueDateOptions.map((d) => (
                                    <button
                                        key={d.value}
                                        onClick={() =>
                                            setFilters({
                                                dueDateRange:
                                                    filters.dueDateRange === d.value
                                                        ? null
                                                        : (d.value as typeof filters.dueDateRange),
                                            })
                                        }
                                        className={cn(
                                            "px-2 py-1 rounded-md text-[12px] border transition-theme",
                                            filters.dueDateRange === d.value
                                                ? "border-accent-blue/25 bg-accent-blue-subtle text-accent-blue"
                                                : "text-text-tertiary border-transparent hover:bg-bg-hover hover:text-text-secondary"
                                        )}
                                    >
                                        {d.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tags */}
                        {allTags.length > 0 && (
                            <div className="px-3 py-2">
                                <div className="text-[11px] font-medium text-text-muted uppercase tracking-[0.04em] mb-2">
                                    Tags
                                </div>
                                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                                    {allTags.map((tag) => (
                                        <button
                                            key={tag}
                                            onClick={() => toggleTag(tag)}
                                            className={cn(
                                                "px-2 py-0.5 rounded text-[11px] border transition-theme",
                                                filters.tags.includes(tag)
                                                    ? "border-accent-blue/25 bg-accent-blue-subtle text-accent-blue"
                                                    : "text-text-tertiary border-transparent hover:bg-bg-hover"
                                            )}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Show Archived */}
                        <div className="px-3 py-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={filters.showArchived}
                                    onChange={(e) => setFilters({ showArchived: e.target.checked })}
                                    className="accent-accent-blue rounded"
                                />
                                <span className="text-[12px] text-text-secondary">Show archived</span>
                            </label>
                        </div>

                        {/* Reset */}
                        {activeFilterCount > 0 && (
                            <div className="px-3 pt-2 border-t border-border-subtle mx-1">
                                <button
                                    onClick={resetFilters}
                                    className="text-[12px] text-text-tertiary hover:text-text-secondary transition-theme"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Sort */}
            <div className="relative" ref={sortRef}>
                <button
                    onClick={() => setShowSort(!showSort)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-[13px] rounded-md border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-theme"
                >
                    <SortAsc size={13} />
                    <span>{sortOptions.find((s) => s.value === sortField)?.label}</span>
                    <ChevronDown size={11} className="opacity-50" />
                </button>

                {showSort && (
                    <div className="absolute right-0 top-full mt-1.5 w-[160px] max-w-[calc(100vw-1.5rem)] bg-bg-elevated border border-border-default rounded-lg shadow-[var(--shadow-popup)] z-50 py-1">
                        {sortOptions.map((s) => (
                            <button
                                key={s.value}
                                onClick={() => {
                                    if (sortField === s.value) {
                                        setSort(s.value, sortDirection === "asc" ? "desc" : "asc");
                                    } else {
                                        setSort(s.value, "asc");
                                    }
                                    setShowSort(false);
                                }}
                                className={cn(
                                    "w-full px-3 py-[6px] text-left text-[13px] flex items-center justify-between transition-theme",
                                    sortField === s.value
                                        ? "text-text-primary bg-bg-hover"
                                        : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                                )}
                            >
                                {s.label}
                                {sortField === s.value && (
                                    <span className="text-text-muted text-[10px]">
                                        {sortDirection === "asc" ? "↑" : "↓"}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Active pills */}
            {activeFilterCount > 0 && (
                <div className="flex w-full items-center gap-1 overflow-x-auto pb-0.5 sm:ml-1 sm:w-auto sm:overflow-visible sm:pb-0">
                    {filters.priorities.map((p) => (
                        <span
                            key={p}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] bg-bg-tertiary rounded text-text-secondary"
                        >
                            {p}
                            <button onClick={() => togglePriority(p)} className="hover:text-accent-red">
                                <X size={9} />
                            </button>
                        </span>
                    ))}
                    {filters.dueDateRange && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] bg-bg-tertiary rounded text-text-secondary">
                            {dueDateOptions.find((d) => d.value === filters.dueDateRange)?.label}
                            <button
                                onClick={() => setFilters({ dueDateRange: null })}
                                className="hover:text-accent-red"
                            >
                                <X size={9} />
                            </button>
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
