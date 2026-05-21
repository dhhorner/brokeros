import { cn } from "@/lib/utils";
import type { RiskScore } from "@prisma/client";

const config: Record<
  RiskScore,
  { label: string; className: string }
> = {
  LOW: {
    label: "Low risk",
    className: "bg-green-100 text-green-700 border-green-200",
  },
  MEDIUM: {
    label: "Medium risk",
    className: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  HIGH: {
    label: "High risk",
    className: "bg-red-100 text-red-700 border-red-200",
  },
};

export function RiskBadge({ score }: { score: RiskScore | null }) {
  if (!score) return null;
  const { label, className } = config[score];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        className
      )}
    >
      {label}
    </span>
  );
}
