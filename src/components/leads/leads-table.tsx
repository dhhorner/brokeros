"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LeadStatus, LeadSource } from "@prisma/client";
import { useState } from "react";
import { NewLeadSheet } from "./new-lead-sheet";
import { EditLeadSheet } from "./edit-lead-sheet";
import { format } from "date-fns";
import { Pencil, Trash2, Search, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDebounce } from "@/lib/use-debounce";

const statusColors: Record<LeadStatus, string> = {
  NEW: "bg-blue-100 text-blue-700",
  CONTACTED: "bg-yellow-100 text-yellow-700",
  QUALIFIED: "bg-purple-100 text-purple-700",
  NURTURING: "bg-orange-100 text-orange-700",
  CLOSED_WON: "bg-green-100 text-green-700",
  CLOSED_LOST: "bg-slate-100 text-slate-600",
};

export function LeadsTable() {
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "ALL">("ALL");
  const [sourceFilter, setSourceFilter] = useState<LeadSource | "ALL">("ALL");
  const [searchInput, setSearchInput] = useState("");
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [deletingLead, setDeletingLead] = useState<{ id: string; name: string } | null>(null);

  const search = useDebounce(searchInput, 300);

  const utils = trpc.useUtils();
  const deleteLead = trpc.leads.delete.useMutation({
    onSuccess: () => {
      utils.leads.list.invalidate();
      setDeletingLead(null);
    },
  });

  const { data, isLoading, isError } = trpc.leads.list.useQuery({
    status: statusFilter !== "ALL" ? statusFilter : undefined,
    source: sourceFilter !== "ALL" ? sourceFilter : undefined,
    search: search || undefined,
    limit: 50,
  });

  const hasFilters = statusFilter !== "ALL" || sourceFilter !== "ALL" || searchInput !== "";

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name or email…"
              className="pl-8 h-9 text-sm"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as LeadStatus | "ALL")}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              {Object.values(LeadStatus).map((s) => (
                <SelectItem key={s} value={s}>
                  {s.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={sourceFilter}
            onValueChange={(v) => setSourceFilter(v as LeadSource | "ALL")}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All sources</SelectItem>
              {Object.values(LeadSource).map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter("ALL");
                setSourceFilter("ALL");
                setSearchInput("");
              }}
            >
              Clear filters
            </Button>
          )}
        </div>

        <NewLeadSheet />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Assigned agent</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-slate-400">
                  Loading leads...
                </TableCell>
              </TableRow>
            )}
            {isError && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-red-500">
                  Failed to load leads.
                </TableCell>
              </TableRow>
            )}
            {data?.leads.length === 0 && !isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-slate-400">
                  {hasFilters ? "No leads match your filters." : "No leads found. Add your first lead to get started."}
                </TableCell>
              </TableRow>
            )}
            {data?.leads.map((lead) => (
              <TableRow key={lead.id} className="hover:bg-slate-50 group">
                <TableCell>
                  <Link href={`/dashboard/leads/${lead.id}`} className="block">
                    <div className="font-medium text-slate-900 hover:text-blue-600 transition-colors">
                      {lead.name}
                    </div>
                    {lead.email && (
                      <div className="text-xs text-slate-500">{lead.email}</div>
                    )}
                  </Link>
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      statusColors[lead.status]
                    }`}
                  >
                    {lead.status.replace("_", " ")}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {lead.source}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-slate-600">
                  {lead.assignee?.name ?? lead.assignee?.email ?? (
                    <span className="text-slate-400">Unassigned</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-slate-500">
                  {format(new Date(lead.createdAt), "MMM d, yyyy")}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setEditingLeadId(lead.id)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => setDeletingLead({ id: lead.id, name: lead.name })}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <EditLeadSheet
        leadId={editingLeadId}
        open={editingLeadId !== null}
        onOpenChange={(open) => { if (!open) setEditingLeadId(null); }}
      />

      <Dialog open={deletingLead !== null} onOpenChange={(open) => { if (!open) setDeletingLead(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete lead</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-medium text-slate-900">{deletingLead?.name}</span>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeletingLead(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteLead.isPending}
              onClick={() => deletingLead && deleteLead.mutate({ id: deletingLead.id })}
            >
              {deleteLead.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {data?.nextCursor && (
        <div className="text-center">
          <Button variant="outline" size="sm">
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
