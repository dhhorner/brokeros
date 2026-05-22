"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc/client";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const editLeadFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(20).optional(),
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "NURTURING", "CLOSED_WON", "CLOSED_LOST"]),
  source: z.enum(["MANUAL", "MLS", "WEBSITE", "REFERRAL", "SOCIAL", "OTHER"]),
  notes: z.string().max(2000).optional(),
});

type EditLeadFormValues = z.infer<typeof editLeadFormSchema>;

const STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "NURTURING", "CLOSED_WON", "CLOSED_LOST"] as const;
const SOURCES = ["MANUAL", "MLS", "WEBSITE", "REFERRAL", "SOCIAL", "OTHER"] as const;

interface EditLeadSheetProps {
  leadId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditLeadSheet({ leadId, open, onOpenChange }: EditLeadSheetProps) {
  const utils = trpc.useUtils();

  const { data: lead, isLoading } = trpc.leads.getById.useQuery(
    { id: leadId! },
    { enabled: open && leadId !== null }
  );

  const updateLead = trpc.leads.update.useMutation({
    onSuccess: () => {
      utils.leads.list.invalidate();
      onOpenChange(false);
    },
  });

  const form = useForm<EditLeadFormValues>({
    resolver: zodResolver(editLeadFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      status: "NEW",
      source: "MANUAL",
      notes: "",
    },
  });

  useEffect(() => {
    if (lead) {
      form.reset({
        name: lead.name,
        email: lead.email ?? "",
        phone: lead.phone ?? "",
        status: lead.status,
        source: lead.source,
        notes: lead.notes ?? "",
      });
    }
  }, [lead, form]);

  function onSubmit(data: EditLeadFormValues) {
    if (!leadId) return;
    updateLead.mutate({
      id: leadId,
      name: data.name,
      email: data.email || undefined,
      phone: data.phone || undefined,
      status: data.status,
      source: data.source,
      notes: data.notes || undefined,
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Edit lead</SheetTitle>
          <SheetDescription>Update contact details and status.</SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="mt-6 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Jane Smith" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="jane@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 555 000 0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s.replace("_", " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SOURCES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Notes..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={updateLead.isPending}
                >
                  {updateLead.isPending ? "Saving..." : "Save changes"}
                </Button>
              </div>

              {updateLead.error && (
                <p className="text-sm text-red-600">{updateLead.error.message}</p>
              )}
            </form>
          </Form>
        )}
      </SheetContent>
    </Sheet>
  );
}
