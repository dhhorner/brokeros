"use client";

import { useState } from "react";
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
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Plus } from "lucide-react";

const formSchema = z.object({
  address: z.string().min(1, "Address is required").max(300),
  listPrice: z.string().min(1, "List price is required"),
  beds: z.string(),
  baths: z.string(),
  sqft: z.string(),
  closeDate: z.string(),
  purchasePrice: z.string(),
  earnestMoney: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

function parseOptionalNumber(val: string): number | undefined {
  const n = parseFloat(val);
  return isNaN(n) ? undefined : n;
}

export function NewDealSheet() {
  const [open, setOpen] = useState(false);
  const utils = trpc.useUtils();

  const createDeal = trpc.transactions.createWithProperty.useMutation({
    onSuccess: () => {
      utils.transactions.list.invalidate();
      setOpen(false);
      form.reset();
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: "",
      listPrice: "",
      beds: "",
      baths: "",
      sqft: "",
      closeDate: "",
      purchasePrice: "",
      earnestMoney: "",
    },
  });

  function onSubmit(data: FormValues) {
    const listPrice = parseFloat(data.listPrice);
    if (isNaN(listPrice) || listPrice <= 0) {
      form.setError("listPrice", { message: "Must be a positive number" });
      return;
    }
    createDeal.mutate({
      address: data.address,
      listPrice,
      beds: parseOptionalNumber(data.beds),
      baths: parseOptionalNumber(data.baths),
      sqft: data.sqft ? parseInt(data.sqft) : undefined,
      closeDate: data.closeDate ? new Date(data.closeDate).toISOString() : undefined,
      purchasePrice: parseOptionalNumber(data.purchasePrice),
      earnestMoney: parseOptionalNumber(data.earnestMoney),
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New deal
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>New deal</SheetTitle>
          <SheetDescription>
            Add a property and open a new transaction.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-6">
            {/* Property */}
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Property</p>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address *</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St, Austin TX 78701" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="listPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>List price *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="500000" min="0" step="1000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-3">
                <FormField
                  control={form.control}
                  name="beds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Beds</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="3" min="0" step="1" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="baths"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Baths</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="2" min="0" step="0.5" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sqft"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sq ft</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="1800" min="0" step="1" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Transaction */}
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Transaction</p>

              <FormField
                control={form.control}
                name="closeDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target close date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="purchasePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchase price</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="485000" min="0" step="1000" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="earnestMoney"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Earnest money</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="10000" min="0" step="500" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={createDeal.isPending}>
                {createDeal.isPending ? "Creating..." : "Create deal"}
              </Button>
            </div>

            {createDeal.error && (
              <p className="text-sm text-red-600">{createDeal.error.message}</p>
            )}
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
