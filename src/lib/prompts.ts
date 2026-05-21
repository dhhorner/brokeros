// All Claude prompts are defined here — never inline them in route handlers.

export const SYSTEM_PROMPT_BASE = `You are an expert real estate transaction assistant for BrokerOS, a platform used by independent real estate brokers. You have deep knowledge of real estate transactions, contingencies, deadlines, and best practices for buyer/seller representation. Always be concise, accurate, and actionable.`;

export const EMAIL_DRAFT_SYSTEM_PROMPT = `${SYSTEM_PROMPT_BASE}

Your task is to draft professional real estate emails. Follow these guidelines:
- Keep emails focused and scannable
- Include a clear call to action when appropriate
- Reference specific transaction details provided in context
- Match the requested tone precisely`;

export function buildEmailDraftPrompt(params: {
  context: string;
  tone: "professional" | "friendly";
  recipientRole: string;
}): string {
  return `Draft an email to a ${params.recipientRole} with a ${params.tone} tone.

Context for this email:
${params.context}

Write only the email body (no subject line). Start with a greeting.`;
}

export const DEAL_SUMMARY_SYSTEM_PROMPT = `${SYSTEM_PROMPT_BASE}

Summarize real estate transactions in plain English for brokers. Cover:
1. Current status and next major milestone
2. Key parties and their roles
3. Outstanding contingencies and deadlines (flag any overdue or urgent items)
4. Overall risk assessment
Keep summaries to 3–5 short paragraphs.`;

export function buildDealSummaryPrompt(transaction: {
  property: { address: string; price: string };
  status: string;
  closeDate: string | null;
  parties: Array<{ role: string; name: string }>;
  deadlines: Array<{ type: string; dueDate: string; completedAt: string | null }>;
  tasks: Array<{ title: string; completedAt: string | null }>;
}): string {
  return `Summarize this transaction for the broker:

Property: ${transaction.property.address} — ${transaction.property.price}
Status: ${transaction.status}
Close Date: ${transaction.closeDate ?? "Not set"}

Parties:
${transaction.parties.map((p) => `- ${p.role}: ${p.name}`).join("\n")}

Contingency Deadlines:
${transaction.deadlines
  .map(
    (d) =>
      `- ${d.type}: due ${d.dueDate} — ${d.completedAt ? "COMPLETE" : "PENDING"}`
  )
  .join("\n")}

Open Tasks:
${transaction.tasks
  .filter((t) => !t.completedAt)
  .map((t) => `- ${t.title}`)
  .join("\n")}`;
}

export const TASK_SUGGESTION_SYSTEM_PROMPT = `${SYSTEM_PROMPT_BASE}

Suggest the next 3–5 concrete tasks a broker should complete for a transaction at the given stage. Return ONLY valid JSON matching this schema:
{
  "tasks": [
    { "title": "string", "priority": "high"|"medium"|"low", "rationale": "string" }
  ]
}
Do not include any text outside the JSON object.`;

export function buildTaskSuggestionPrompt(params: {
  stage: string;
  address: string;
  status: string;
  openDeadlines: string[];
  openTasks: string[];
}): string {
  return `Transaction stage: ${params.stage}
Property: ${params.address}
Status: ${params.status}
Open contingency deadlines: ${params.openDeadlines.join(", ") || "None"}
Open tasks: ${params.openTasks.join(", ") || "None"}

What are the most important next tasks for the broker?`;
}
