import { DealsKanban } from "@/components/deals/deals-kanban";

export const metadata = { title: "DealPulse — BrokerOS" };

export default function DealsPage() {
  return (
    <div className="flex flex-col h-full space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">DealPulse</h2>
        <p className="text-slate-500 mt-1">
          Track every transaction from active to closed.
        </p>
      </div>
      <div className="flex-1 overflow-x-auto">
        <DealsKanban />
      </div>
    </div>
  );
}
