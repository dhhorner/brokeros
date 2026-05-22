"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { RiskBadge } from "./risk-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  ChevronLeft,
  AlertTriangle,
  Plus,
  Users,
  CalendarCheck,
  CheckSquare,
  FileText,
} from "lucide-react";
import { format, isPast } from "date-fns";
import { cn } from "@/lib/utils";
import type { TransactionStatus, PartyRole, ContingencyType } from "@prisma/client";

const STATUSES: { value: TransactionStatus; label: string }[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "UNDER_CONTRACT", label: "Under Contract" },
  { value: "PENDING_CLOSE", label: "Pending Close" },
  { value: "CLOSED", label: "Closed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const PARTY_ROLES: PartyRole[] = ["AGENT", "LENDER", "TITLE", "ATTORNEY"];
const CONTINGENCY_TYPES: ContingencyType[] = [
  "INSPECTION", "FINANCING", "APPRAISAL", "TITLE", "SALE_OF_HOME", "OTHER",
];

function formatMoney(val: { toString(): string } | null | undefined): string {
  if (val == null) return "—";
  const n = Number(val.toString());
  return isNaN(n) ? "—" : `$${n.toLocaleString()}`;
}

// ─── Parties section ──────────────────────────────────────────────────────────

function PartiesSection({ transactionId }: { transactionId: string }) {
  const utils = trpc.useUtils();
  const { data } = trpc.transactions.getById.useQuery({ id: transactionId });
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", role: "AGENT" as PartyRole, email: "", phone: "" });

  const addParty = trpc.transactions.addParty.useMutation({
    onSuccess: () => {
      utils.transactions.getById.invalidate({ id: transactionId });
      setAdding(false);
      setForm({ name: "", role: "AGENT", email: "", phone: "" });
    },
  });

  const parties = data?.parties ?? [];

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-slate-400" />
        <h3 className="font-semibold text-slate-800 text-sm">Parties</h3>
      </div>

      {parties.length === 0 && !adding && (
        <p className="text-xs text-slate-400 py-2">No parties added yet.</p>
      )}

      <div className="space-y-2">
        {parties.map((p) => (
          <div key={p.id} className="flex items-start gap-3">
            <span className="mt-0.5 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-500 shrink-0">
              {p.role}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800">{p.name}</p>
              {p.email && <p className="text-xs text-slate-400">{p.email}</p>}
              {p.phone && <p className="text-xs text-slate-400">{p.phone}</p>}
            </div>
          </div>
        ))}
      </div>

      {adding ? (
        <div className="space-y-2 pt-1">
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Name *"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <Select
              value={form.role}
              onValueChange={(v) => setForm((f) => ({ ...f, role: v as PartyRole }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PARTY_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
            <Input
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={!form.name || addParty.isPending}
              onClick={() =>
                addParty.mutate({
                  transactionId,
                  role: form.role,
                  name: form.name,
                  email: form.email || undefined,
                  phone: form.phone || undefined,
                })
              }
            >
              {addParty.isPending ? "Saving..." : "Add"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          size="sm"
          variant="ghost"
          className="text-slate-500 hover:text-slate-700 -ml-1 h-7 text-xs"
          onClick={() => setAdding(true)}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add party
        </Button>
      )}
    </div>
  );
}

// ─── Deadlines section ────────────────────────────────────────────────────────

function DeadlinesSection({ transactionId }: { transactionId: string }) {
  const utils = trpc.useUtils();
  const { data } = trpc.transactions.getById.useQuery({ id: transactionId });
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ type: "INSPECTION" as ContingencyType, dueDate: "", notes: "" });

  const completeDeadline = trpc.transactions.completeDeadline.useMutation({
    onSuccess: () => utils.transactions.getById.invalidate({ id: transactionId }),
  });

  const createDeadline = trpc.transactions.createDeadline.useMutation({
    onSuccess: () => {
      utils.transactions.getById.invalidate({ id: transactionId });
      setAdding(false);
      setForm({ type: "INSPECTION", dueDate: "", notes: "" });
    },
  });

  const deadlines = data?.deadlines ?? [];

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
      <div className="flex items-center gap-2">
        <CalendarCheck className="h-4 w-4 text-slate-400" />
        <h3 className="font-semibold text-slate-800 text-sm">Contingency Deadlines</h3>
      </div>

      {deadlines.length === 0 && !adding && (
        <p className="text-xs text-slate-400 py-2">No deadlines added yet.</p>
      )}

      <div className="space-y-2">
        {deadlines.map((d) => {
          const done = !!d.completedAt;
          const overdue = !done && isPast(new Date(d.dueDate));
          return (
            <div key={d.id} className="flex items-center gap-3">
              <Checkbox
                checked={done}
                disabled={done || completeDeadline.isPending}
                onCheckedChange={done ? undefined : () => completeDeadline.mutate({ id: d.id })}
              />
              <div className="flex-1 min-w-0">
                <span
                  className={cn(
                    "text-sm font-medium",
                    done ? "line-through text-slate-400" : "text-slate-800"
                  )}
                >
                  {d.type}
                </span>
                {d.notes && (
                  <p className="text-xs text-slate-400 truncate">{d.notes}</p>
                )}
              </div>
              <span
                className={cn(
                  "shrink-0 text-xs font-medium",
                  done ? "text-slate-400" : overdue ? "text-red-600" : "text-slate-500"
                )}
              >
                {format(new Date(d.dueDate), "MMM d, yyyy")}
              </span>
            </div>
          );
        })}
      </div>

      {adding ? (
        <div className="space-y-2 pt-1">
          <div className="grid grid-cols-2 gap-2">
            <Select
              value={form.type}
              onValueChange={(v) => setForm((f) => ({ ...f, type: v as ContingencyType }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTINGENCY_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
            />
          </div>
          <Input
            placeholder="Notes (optional)"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={!form.dueDate || createDeadline.isPending}
              onClick={() =>
                createDeadline.mutate({
                  transactionId,
                  type: form.type,
                  dueDate: new Date(form.dueDate).toISOString(),
                  notes: form.notes || undefined,
                })
              }
            >
              {createDeadline.isPending ? "Saving..." : "Add"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          size="sm"
          variant="ghost"
          className="text-slate-500 hover:text-slate-700 -ml-1 h-7 text-xs"
          onClick={() => setAdding(true)}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add deadline
        </Button>
      )}
    </div>
  );
}

// ─── Tasks section ────────────────────────────────────────────────────────────

function TasksSection({ transactionId }: { transactionId: string }) {
  const utils = trpc.useUtils();
  const { data } = trpc.transactions.getById.useQuery({ id: transactionId });
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", dueDate: "" });

  const completeTask = trpc.transactions.completeTask.useMutation({
    onSuccess: () => {
      utils.transactions.getById.invalidate({ id: transactionId });
      utils.transactions.listTasks.invalidate();
    },
  });

  const createTask = trpc.transactions.createTask.useMutation({
    onSuccess: () => {
      utils.transactions.getById.invalidate({ id: transactionId });
      utils.transactions.listTasks.invalidate();
      setAdding(false);
      setForm({ title: "", dueDate: "" });
    },
  });

  const tasks = data?.tasks ?? [];

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
      <div className="flex items-center gap-2">
        <CheckSquare className="h-4 w-4 text-slate-400" />
        <h3 className="font-semibold text-slate-800 text-sm">Tasks</h3>
      </div>

      {tasks.length === 0 && !adding && (
        <p className="text-xs text-slate-400 py-2">No tasks yet.</p>
      )}

      <div className="space-y-2">
        {tasks.map((t) => {
          const done = t.status === "COMPLETED";
          const overdue = !done && t.dueDate && isPast(new Date(t.dueDate));
          return (
            <div key={t.id} className="flex items-center gap-3">
              <Checkbox
                checked={done}
                disabled={done || completeTask.isPending}
                onCheckedChange={done ? undefined : () => completeTask.mutate({ id: t.id })}
              />
              <p
                className={cn(
                  "flex-1 text-sm font-medium truncate",
                  done ? "line-through text-slate-400" : "text-slate-800"
                )}
              >
                {t.title}
              </p>
              {t.dueDate && (
                <span
                  className={cn(
                    "shrink-0 text-xs font-medium",
                    done ? "text-slate-400" : overdue ? "text-red-600" : "text-slate-500"
                  )}
                >
                  {format(new Date(t.dueDate), "MMM d")}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {adding ? (
        <div className="space-y-2 pt-1">
          <Input
            placeholder="Task title *"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <Input
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={!form.title || createTask.isPending}
              onClick={() =>
                createTask.mutate({
                  transactionId,
                  title: form.title,
                  dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
                })
              }
            >
              {createTask.isPending ? "Saving..." : "Add"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          size="sm"
          variant="ghost"
          className="text-slate-500 hover:text-slate-700 -ml-1 h-7 text-xs"
          onClick={() => setAdding(true)}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add task
        </Button>
      )}
    </div>
  );
}

// ─── Main detail component ────────────────────────────────────────────────────

export function DealDetail({ transactionId }: { transactionId: string }) {
  const utils = trpc.useUtils();
  const { data, isLoading, isError } = trpc.transactions.getById.useQuery({
    id: transactionId,
  });

  const updateStatus = trpc.transactions.updateStatus.useMutation({
    onSuccess: () => utils.transactions.getById.invalidate({ id: transactionId }),
  });

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded" />
        <div className="h-24 bg-slate-200 rounded-lg" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-40 bg-slate-200 rounded-lg" />
          <div className="h-40 bg-slate-200 rounded-lg" />
        </div>
        <div className="h-40 bg-slate-200 rounded-lg" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-slate-500">Deal not found.</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/deals">← Back to DealPulse</Link>
        </Button>
      </div>
    );
  }

  const { property, riskScore, riskFlags } = data;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/deals"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ChevronLeft className="h-4 w-4" />
        DealPulse
      </Link>

      {/* Header card */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900">{property.address}</h2>
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <span>List: {formatMoney(property.price)}</span>
              {data.purchasePrice != null && (
                <>
                  <span className="text-slate-300">·</span>
                  <span>Purchase: {formatMoney(data.purchasePrice)}</span>
                </>
              )}
              {data.earnestMoney != null && (
                <>
                  <span className="text-slate-300">·</span>
                  <span>Earnest: {formatMoney(data.earnestMoney)}</span>
                </>
              )}
              {data.closeDate && (
                <>
                  <span className="text-slate-300">·</span>
                  <span>Close: {format(new Date(data.closeDate), "MMM d, yyyy")}</span>
                </>
              )}
            </div>
            {(property.beds != null || property.baths != null || property.sqft != null) && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                {property.beds != null && <span>{property.beds} bed</span>}
                {property.baths != null && <span>{Number(property.baths.toString())} bath</span>}
                {property.sqft != null && <span>{property.sqft.toLocaleString()} sq ft</span>}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <RiskBadge score={riskScore} />
            <Select
              value={data.status}
              onValueChange={(v) =>
                updateStatus.mutate({ id: transactionId, status: v as TransactionStatus })
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Risk flags */}
        {riskFlags.length > 0 && (
          <>
            <Separator />
            <div className="space-y-1">
              {riskFlags.map((flag, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-amber-700">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
                  {flag}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Parties + Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PartiesSection transactionId={transactionId} />
        <DeadlinesSection transactionId={transactionId} />
      </div>

      {/* Tasks */}
      <TasksSection transactionId={transactionId} />

      {/* Documents */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-slate-400" />
          <h3 className="font-semibold text-slate-800 text-sm">Documents</h3>
        </div>
        {data.documents.length === 0 ? (
          <p className="text-xs text-slate-400 py-2">No documents uploaded yet.</p>
        ) : (
          <div className="space-y-1">
            {data.documents.map((doc) => (
              <a
                key={doc.id}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-slate-700 hover:text-slate-900"
              >
                <FileText className="h-3.5 w-3.5 text-slate-400" />
                {doc.name}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
