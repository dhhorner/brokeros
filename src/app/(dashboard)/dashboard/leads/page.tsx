import { LeadsTable } from "@/components/leads/leads-table";

export const metadata = { title: "LeadOwn — BrokerOS" };

export default function LeadsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">LeadOwn</h2>
        <p className="text-slate-500 mt-1">Manage and track your buyer and seller leads.</p>
      </div>
      <LeadsTable />
    </div>
  );
}
