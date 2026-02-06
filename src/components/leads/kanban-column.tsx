"use client";

import { useDroppable } from "@dnd-kit/core";

type KanbanColumnProps = {
  id: string;
  title: string;
  count: number;
  children: React.ReactNode;
};

export function KanbanColumn({ id, title, count, children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex min-w-[300px] flex-col rounded-lg border bg-zinc-900 transition-colors ${
        isOver ? "border-amber-500 bg-zinc-800/50" : "border-zinc-800"
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 p-4">
        <h2 className="font-semibold text-zinc-100">{title}</h2>
        <span className="rounded-full bg-zinc-800 px-2 py-1 text-xs text-zinc-400">
          {count}
        </span>
      </div>

      {/* Column Content */}
      <div className="flex-1 overflow-y-auto p-4">{children}</div>
    </div>
  );
}
