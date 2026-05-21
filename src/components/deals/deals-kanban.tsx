"use client";

import { trpc } from "@/lib/trpc/client";
import { DealCard } from "./deal-card";
import { TransactionStatus } from "@prisma/client";

const COLUMNS: { status: TransactionStatus; label: string }[] = [
  { status: "ACTIVE", label: "Active" },
  { status: "UNDER_CONTRACT", label: "Under Contract" },
  { status: "PENDING_CLOSE", label: "Pending Close" },
  { status: "CLOSED", label: "Closed" },
];

export function DealsKanban() {
  const { data: deals, isLoading } = trpc.transactions.list.useQuery({
    limit: 100,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {COLUMNS.map((col) => (
          <div
            key={col.status}
            className="rounded-lg bg-slate-100 p-3 space-y-3 min-h-64"
          >
            <div className="h-5 bg-slate-200 rounded animate-pulse" />
            {[1, 2].map((i) => (
              <div key={i} className="h-28 bg-white rounded-lg animate-pulse" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-4 h-full">
      {COLUMNS.map((col) => {
        const columnDeals = (deals ?? []).filter(
          (d) => d.status === col.status
        );
        return (
          <div
            key={col.status}
            className="flex flex-col rounded-lg bg-slate-100 p-3 gap-3 min-h-64"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">
                {col.label}
              </h3>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-slate-600">
                {columnDeals.length}
              </span>
            </div>

            <div className="flex flex-col gap-2 flex-1">
              {columnDeals.length === 0 && (
                <div className="flex items-center justify-center py-8 text-xs text-slate-400">
                  No deals
                </div>
              )}
              {columnDeals.map((deal) => (
                <DealCard
                  key={deal.id}
                  id={deal.id}
                  address={deal.property.address}
                  price={deal.property.price.toString()}
                  closeDate={deal.closeDate}
                  riskScore={deal.riskScore}
                  parties={
                    "parties" in deal
                      ? (deal.parties as Array<{ role: string; name: string }>)
                      : []
                  }
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
