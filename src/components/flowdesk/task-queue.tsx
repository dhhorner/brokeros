"use client";

import { trpc } from "@/lib/trpc/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { cn } from "@/lib/utils";

export function TaskQueue() {
  const { data: tasks, isLoading } = trpc.transactions.listOpenTasks.useQuery();
  const utils = trpc.useUtils();

  const completeTask = trpc.transactions.completeTask.useMutation({
    onSuccess: () => utils.transactions.listOpenTasks.invalidate(),
  });

  function formatDueDate(date: Date | null): string {
    if (!date) return "";
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "MMM d");
  }

  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-14 bg-slate-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-1">
        {(!tasks || tasks.length === 0) && (
          <p className="py-8 text-center text-sm text-slate-400">
            No open tasks — you&apos;re all caught up!
          </p>
        )}
        {tasks?.map((task) => {
          const overdue =
            task.dueDate && isPast(new Date(task.dueDate));
          return (
            <div
              key={task.id}
              className="flex items-start gap-3 rounded-lg p-3 hover:bg-slate-50 group"
            >
              <Checkbox
                className="mt-0.5"
                onCheckedChange={() => completeTask.mutate({ id: task.id })}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">
                  {task.title}
                </p>
                {task.transaction && (
                  <p className="text-xs text-slate-400 truncate">
                    {task.transaction.property.address}
                  </p>
                )}
              </div>
              {task.dueDate && (
                <span
                  className={cn(
                    "shrink-0 text-xs font-medium",
                    overdue ? "text-red-600" : "text-slate-400"
                  )}
                >
                  {formatDueDate(new Date(task.dueDate))}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
