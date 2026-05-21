import type { ContingencyDeadline, Transaction } from "@prisma/client";

type RiskInput = Transaction & {
  deadlines: ContingencyDeadline[];
};

type RiskResult = {
  score: "LOW" | "MEDIUM" | "HIGH";
  flags: string[];
};

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

export function computeRiskScore(transaction: RiskInput): RiskResult {
  const now = Date.now();
  const flags: string[] = [];

  for (const deadline of transaction.deadlines) {
    if (deadline.completedAt) continue;

    const due = new Date(deadline.dueDate).getTime();

    if (due < now) {
      flags.push(`${deadline.type} deadline is overdue (was due ${new Date(deadline.dueDate).toLocaleDateString()})`);
    } else if (due - now <= THREE_DAYS_MS) {
      flags.push(`${deadline.type} deadline due in less than 3 days (${new Date(deadline.dueDate).toLocaleDateString()})`);
    }
  }

  const hasOverdue = transaction.deadlines.some(
    (d) => !d.completedAt && new Date(d.dueDate).getTime() < now
  );

  const incompleteContingencies = transaction.deadlines.filter(
    (d) => !d.completedAt
  );

  const closeDate = transaction.closeDate
    ? new Date(transaction.closeDate).getTime()
    : null;

  if (closeDate && closeDate - now <= FOURTEEN_DAYS_MS && incompleteContingencies.length > 0) {
    flags.push(
      `Close date is within 14 days with ${incompleteContingencies.length} incomplete contingency/contingencies`
    );
  }

  let score: "LOW" | "MEDIUM" | "HIGH" = "LOW";

  if (
    hasOverdue ||
    (closeDate && closeDate - now <= FOURTEEN_DAYS_MS && incompleteContingencies.length > 0)
  ) {
    score = "HIGH";
  } else if (
    transaction.deadlines.some(
      (d) => !d.completedAt && new Date(d.dueDate).getTime() - now <= THREE_DAYS_MS
    )
  ) {
    score = "MEDIUM";
  }

  return { score, flags };
}
