"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { cn } from "@/lib/utils";
import { Plus, X } from "lucide-react";

type TaskStatus = "OPEN" | "COMPLETED";

function formatDueDate(date: Date | null): string {
  if (!date) return "";
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "MMM d");
}

function TaskSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-14 bg-slate-100 rounded animate-pulse" />
      ))}
    </div>
  );
}

// ─── Add task inline form ──────────────────────────────────────────────────────

function AddTaskForm({ onAdded }: { onAdded: () => void }) {
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");

  const createTask = trpc.transactions.createTask.useMutation({
    onSuccess: () => {
      utils.transactions.listTasks.invalidate({ status: "OPEN" });
      setTitle("");
      setDueDate("");
      setOpen(false);
      onAdded();
    },
  });

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 w-full px-4 py-2 text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors text-left"
      >
        <Plus className="h-3.5 w-3.5" />
        Add task
      </button>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    createTask.mutate({
      title: title.trim(),
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="px-4 py-3 space-y-2 border-b border-slate-100 bg-slate-50">
      <Input
        autoFocus
        placeholder="Task title…"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="h-8 text-sm"
      />
      <div className="flex items-center gap-2">
        <Input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="h-8 text-sm flex-1"
        />
        <Button
          type="submit"
          size="sm"
          className="h-8"
          disabled={!title.trim() || createTask.isPending}
        >
          {createTask.isPending ? "Adding…" : "Add"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-400"
          onClick={() => { setOpen(false); setTitle(""); setDueDate(""); }}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      {createTask.error && (
        <p className="text-xs text-red-600">{createTask.error.message}</p>
      )}
    </form>
  );
}

// ─── Task list ─────────────────────────────────────────────────────────────────

function TaskList({ status }: { status: TaskStatus }) {
  const { data: tasks, isLoading } = trpc.transactions.listTasks.useQuery({ status });
  const utils = trpc.useUtils();

  const completeTask = trpc.transactions.completeTask.useMutation({
    onMutate: async ({ id }) => {
      await utils.transactions.listTasks.cancel({ status: "OPEN" });
      const prev = utils.transactions.listTasks.getData({ status: "OPEN" });
      utils.transactions.listTasks.setData({ status: "OPEN" }, (old) =>
        old?.map((t) => (t.id === id ? { ...t, status: "COMPLETED" as const } : t))
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) utils.transactions.listTasks.setData({ status: "OPEN" }, ctx.prev);
    },
    onSettled: () => {
      utils.transactions.listTasks.invalidate({ status: "OPEN" });
      utils.transactions.listTasks.invalidate({ status: "COMPLETED" });
    },
  });

  if (isLoading) return <TaskSkeleton />;

  const empty = !tasks || tasks.length === 0;

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-1">
        {empty && (
          <p className="py-8 text-center text-sm text-slate-400">
            {status === "OPEN"
              ? "No open tasks — you're all caught up!"
              : "No completed tasks yet."}
          </p>
        )}
        {tasks?.map((task) => {
          const isCompleted = task.status === "COMPLETED";
          const overdue = !isCompleted && task.dueDate && isPast(new Date(task.dueDate));

          return (
            <div
              key={task.id}
              className={cn(
                "flex items-start gap-3 rounded-lg p-3 hover:bg-slate-50 group transition-opacity",
              )}
            >
              <Checkbox
                className="mt-0.5"
                checked={isCompleted}
                disabled={isCompleted}
                onCheckedChange={
                  isCompleted
                    ? undefined
                    : () => completeTask.mutate({ id: task.id })
                }
              />
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm font-medium text-slate-800 truncate",
                    isCompleted && "line-through"
                  )}
                >
                  {task.title}
                </p>
                {task.transaction && (
                  <p className="text-xs text-slate-400 truncate">
                    {task.transaction.property.address}
                  </p>
                )}
              </div>
              <span
                className={cn(
                  "shrink-0 text-xs font-medium",
                  overdue ? "text-red-600" : "text-slate-400"
                )}
              >
                {isCompleted && task.completedAt
                  ? format(new Date(task.completedAt), "MMM d")
                  : task.dueDate
                  ? formatDueDate(new Date(task.dueDate))
                  : ""}
              </span>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}

// ─── Main task queue ───────────────────────────────────────────────────────────

export function TaskQueue() {
  const [activeTab, setActiveTab] = useState<TaskStatus>("OPEN");

  const openCount = trpc.transactions.listTasks.useQuery({ status: "OPEN" }, {
    select: (data) => data.length,
  });

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as TaskStatus)}
      className="flex flex-col h-full"
    >
      <TabsList className="mx-4 mt-3 mb-1 w-auto self-start">
        <TabsTrigger value="OPEN">
          Open{openCount.data !== undefined ? ` (${openCount.data})` : ""}
        </TabsTrigger>
        <TabsTrigger value="COMPLETED">Completed</TabsTrigger>
      </TabsList>

      <TabsContent value="OPEN" className="flex-1 overflow-hidden mt-0 flex flex-col">
        <AddTaskForm onAdded={() => {}} />
        <div className="flex-1 overflow-hidden">
          <TaskList status="OPEN" />
        </div>
      </TabsContent>
      <TabsContent value="COMPLETED" className="flex-1 overflow-hidden mt-0">
        <TaskList status="COMPLETED" />
      </TabsContent>
    </Tabs>
  );
}
