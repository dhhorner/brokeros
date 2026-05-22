import { TaskQueue } from "@/components/flowdesk/task-queue";
import { AiChat } from "@/components/flowdesk/ai-chat";
import { DraftEmailSheet } from "@/components/flowdesk/draft-email-sheet";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";

export const metadata = { title: "FlowDesk — BrokerOS" };

export default async function FlowDeskPage() {
  const session = await auth();
  const userId = session?.user?.id;

  let brokerageId: string | undefined;
  if (userId) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { brokerageId: true },
    });
    brokerageId = user?.brokerageId ?? undefined;
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">FlowDesk</h2>
          <p className="text-slate-500 mt-1">
            AI-powered admin assistant for your brokerage.
          </p>
        </div>
        <DraftEmailSheet />
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden rounded-lg border border-slate-200 bg-white min-h-[600px]">
        {/* Left: task queue */}
        <div className="w-[520px] shrink-0 border-r border-slate-200 flex flex-col">
          <div className="flex-1 overflow-hidden">
            <TaskQueue />
          </div>
        </div>

        {/* Right: AI chat */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-700">
              AI Assistant
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Powered by Claude — aware of your open deals
            </p>
          </div>
          <div className="flex-1 overflow-hidden">
            <AiChat brokerageId={brokerageId} />
          </div>
        </div>
      </div>
    </div>
  );
}
