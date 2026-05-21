"use client";

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
import { LeadStatus, LeadSource } from "@prisma/client";
import { useState } from "react";
import { NewLeadSheet } from "./new-lead-sheet";
import { format } from "date-fns";

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

  const { data, isLoading, isError } = trpc.leads.list.useQuery({
    status: statusFilter !== "ALL" ? statusFilter : undefined,
    source: sourceFilter !== "ALL" ? sourceFilter : undefined,
    limit: 50,
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
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

          {(statusFilter !== "ALL" || sourceFilter !== "ALL") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter("ALL");
                setSourceFilter("ALL");
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-slate-400">
                  Loading leads...
                </TableCell>
              </TableRow>
            )}
            {isError && (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-red-500">
                  Failed to load leads.
                </TableCell>
              </TableRow>
            )}
            {data?.leads.length === 0 && !isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-slate-400">
                  No leads found. Add your first lead to get started.
                </TableCell>
              </TableRow>
            )}
            {data?.leads.map((lead) => (
              <TableRow key={lead.id} className="hover:bg-slate-50">
                <TableCell>
                  <div className="font-medium text-slate-900">{lead.name}</div>
                  {lead.email && (
                    <div className="text-xs text-slate-500">{lead.email}</div>
                  )}
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

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
