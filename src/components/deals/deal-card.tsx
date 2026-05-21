import { RiskBadge } from "./risk-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Home, Calendar, Users } from "lucide-react";
import { format } from "date-fns";
import type { RiskScore } from "@prisma/client";

type DealCardProps = {
  id: string;
  address: string;
  price: string;
  closeDate: Date | null;
  riskScore: RiskScore | null;
  parties: Array<{ role: string; name: string }>;
};

export function DealCard({
  address,
  price,
  closeDate,
  riskScore,
  parties,
}: DealCardProps) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Home className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="text-sm font-medium text-slate-900 truncate">
              {address}
            </span>
          </div>
          <RiskBadge score={riskScore} />
        </div>

        <div className="text-base font-semibold text-slate-700">
          ${Number(price).toLocaleString()}
        </div>

        {closeDate && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Calendar className="h-3 w-3" />
            Close: {format(new Date(closeDate), "MMM d, yyyy")}
          </div>
        )}

        {parties.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Users className="h-3 w-3" />
            {parties
              .slice(0, 2)
              .map((p) => p.name)
              .join(", ")}
            {parties.length > 2 && ` +${parties.length - 2}`}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
