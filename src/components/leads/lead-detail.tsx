"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, Mail, Phone, User, Play, Pause, X, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { LeadStatus, LeadSource, SequenceStatus } from "@prisma/client";

const STATUSES: { value: LeadStatus; label: string }[] = [
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "QUALIFIED", label: "Qualified" },
  { value: "NURTURING", label: "Nurturing" },
  { value: "CLOSED_WON", label: "Closed Won" },
  { value: "CLOSED_LOST", label: "Closed Lost" },
];

const STATUS_COLORS: Record<LeadStatus, string> = {
  NEW: "bg-blue-100 text-blue-700",
  CONTACTED: "bg-yellow-100 text-yellow-700",
  QUALIFIED: "bg-purple-100 text-purple-700",
  NURTURING: "bg-orange-100 text-orange-700",
  CLOSED_WON: "bg-green-100 text-green-700",
  CLOSED_LOST: "bg-slate-100 text-slate-600",
};

const SEQ_STATUS_COLORS: Record<SequenceStatus, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  PAUSED: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-slate-100 text-slate-600",
  CANCELLED: "bg-red-100 text-red-600",
};

// ─── Notes section ────────────────────────────────────────────────────────────

function NotesSection({ leadId, initialNotes }: { leadId: string; initialNotes: string | null }) {
  const utils = trpc.useUtils();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialNotes ?? "");

  const update = trpc.leads.update.useMutation({
    onSuccess: () => {
      utils.leads.getById.invalidate({ id: leadId });
      setEditing(false);
    },
  });

  return (
    <div className="space-y-2">
      {editing ? (
        <div className="space-y-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="resize-none min-h-[120px] text-sm"
            placeholder="Add notes about this lead…"
            autoFocus
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={update.isPending}
              onClick={() => update.mutate({ id: leadId, notes: draft || undefined })}
            >
              {update.isPending ? "Saving…" : "Save"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setDraft(initialNotes ?? ""); setEditing(false); }}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => setEditing(true)}
          className={cn(
            "min-h-[80px] rounded-md border border-slate-200 p-3 text-sm cursor-text hover:border-slate-300 transition-colors",
            !initialNotes && "text-slate-400 italic"
          )}
        >
          {initialNotes || "Click to add notes…"}
        </div>
      )}
    </div>
  );
}

// ─── Sequences section ────────────────────────────────────────────────────────

function SequencesSection({ leadId }: { leadId: string }) {
  const utils = trpc.useUtils();
  const { data: lead } = trpc.leads.getById.useQuery({ id: leadId });

  const start = trpc.leads.startSequence.useMutation({
    onSuccess: () => utils.leads.getById.invalidate({ id: leadId }),
  });
  const pause = trpc.leads.pauseSequence.useMutation({
    onSuccess: () => utils.leads.getById.invalidate({ id: leadId }),
  });
  const cancel = trpc.leads.cancelSequence.useMutation({
    onSuccess: () => utils.leads.getById.invalidate({ id: leadId }),
  });

  const sequences = lead?.sequences ?? [];
  const hasActive = sequences.some((s) => s.status === "ACTIVE");

  return (
    <div className="space-y-3">
      {sequences.length === 0 && (
        <p className="text-sm text-slate-400 italic">No nurture sequences yet.</p>
      )}

      {sequences.map((seq) => (
        <div
          key={seq.id}
          className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5"
        >
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", SEQ_STATUS_COLORS[seq.status])}>
                {seq.status}
              </span>
              <span className="text-xs text-slate-500">Step {seq.currentStep}</span>
            </div>
            {seq.nextSendAt && seq.status === "ACTIVE" && (
              <p className="text-xs text-slate-400">
                Next send: {format(new Date(seq.nextSendAt), "MMM d, yyyy 'at' h:mm a")}
              </p>
            )}
            <p className="text-xs text-slate-400">
              Started {format(new Date(seq.createdAt), "MMM d, yyyy")}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {seq.status === "ACTIVE" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-500"
                title="Pause sequence"
                disabled={pause.isPending}
                onClick={() => pause.mutate({ id: seq.id })}
              >
                <Pause className="h-3.5 w-3.5" />
              </Button>
            )}
            {seq.status === "PAUSED" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-500"
                title="Resume sequence"
                onClick={() => start.mutate({ leadId })}
              >
                <Play className="h-3.5 w-3.5" />
              </Button>
            )}
            {(seq.status === "ACTIVE" || seq.status === "PAUSED") && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                title="Cancel sequence"
                disabled={cancel.isPending}
                onClick={() => cancel.mutate({ id: seq.id })}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      ))}

      {!hasActive && (
        <Button
          variant="outline"
          size="sm"
          disabled={start.isPending}
          onClick={() => start.mutate({ leadId })}
        >
          {start.isPending ? (
            <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />Starting…</>
          ) : (
            <><Play className="h-3.5 w-3.5 mr-1.5" />Start nurture sequence</>
          )}
        </Button>
      )}
    </div>
  );
}

// ─── Main detail component ────────────────────────────────────────────────────

export function LeadDetail({ leadId }: { leadId: string }) {
  const utils = trpc.useUtils();
  const { data: lead, isLoading } = trpc.leads.getById.useQuery({ id: leadId });

  const updateStatus = trpc.leads.update.useMutation({
    onSuccess: () => utils.leads.getById.invalidate({ id: leadId }),
  });

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded" />
        <div className="h-32 bg-slate-100 rounded-lg" />
        <div className="h-48 bg-slate-100 rounded-lg" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="py-16 text-center text-slate-400">
        Lead not found.{" "}
        <Link href="/dashboard/leads" className="text-blue-600 hover:underline">
          Back to leads
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/leads"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        All leads
      </Link>

      {/* Header card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-slate-900">{lead.name}</h1>
            <div className="flex items-center gap-3 text-sm text-slate-500 flex-wrap">
              {lead.email && (
                <a href={`mailto:${lead.email}`} className="flex items-center gap-1 hover:text-slate-900 transition-colors">
                  <Mail className="h-3.5 w-3.5" />
                  {lead.email}
                </a>
              )}
              {lead.phone && (
                <a href={`tel:${lead.phone}`} className="flex items-center gap-1 hover:text-slate-900 transition-colors">
                  <Phone className="h-3.5 w-3.5" />
                  {lead.phone}
                </a>
              )}
              {lead.assignee && (
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  {lead.assignee.name ?? lead.assignee.email}
                </span>
              )}
            </div>
          </div>

          {/* Status selector */}
          <Select
            value={lead.status}
            onValueChange={(v) =>
              updateStatus.mutate({ id: leadId, status: v as LeadStatus })
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

        <div className="flex items-center gap-3 text-xs text-slate-400 pt-1 flex-wrap">
          <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS_COLORS[lead.status])}>
            {lead.status.replace("_", " ")}
          </span>
          <span>Source: <span className="text-slate-600 font-medium">{lead.source}</span></span>
          <span>Added {format(new Date(lead.createdAt), "MMM d, yyyy")}</span>
          {lead.updatedAt && (
            <span>Updated {format(new Date(lead.updatedAt), "MMM d, yyyy")}</span>
          )}
        </div>
      </div>

      {/* Notes + Sequences */}
      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">Notes</h2>
          <Separator />
          <NotesSection leadId={leadId} initialNotes={lead.notes} />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">Nurture Sequences</h2>
          <Separator />
          <SequencesSection leadId={leadId} />
        </div>
      </div>
    </div>
  );
}
