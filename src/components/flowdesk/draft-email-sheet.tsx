"use client";

import { useState } from "react";
import { useCompletion } from "ai/react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Copy, Check, RefreshCw } from "lucide-react";

const TONE_OPTIONS = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
] as const;

const ROLE_PRESETS = [
  "Buyer",
  "Seller",
  "Buyer's Agent",
  "Seller's Agent",
  "Lender",
  "Title Officer",
  "Inspector",
  "Other",
];

export function DraftEmailSheet() {
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState("");
  const [tone, setTone] = useState<"professional" | "friendly">("professional");
  const [recipientRole, setRecipientRole] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [copied, setCopied] = useState(false);

  const effectiveRole = recipientRole === "Other" ? customRole : recipientRole;

  const { complete, completion, isLoading, error, setCompletion } = useCompletion({
    api: "/api/ai/draft-email",
  });

  async function handleGenerate() {
    if (!context.trim() || !effectiveRole.trim()) return;
    setCompletion("");
    await complete("", {
      body: {
        context: context.trim(),
        tone,
        recipientRole: effectiveRole.trim(),
      },
    });
  }

  async function handleCopy() {
    if (!completion) return;
    await navigator.clipboard.writeText(completion);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      // Reset state on close
      setContext("");
      setRecipientRole("");
      setCustomRole("");
      setCompletion("");
    }
  }

  const canGenerate = context.trim().length > 0 && effectiveRole.trim().length > 0;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Mail className="h-3.5 w-3.5 mr-1.5" />
          Draft email
        </Button>
      </SheetTrigger>

      <SheetContent className="sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-5 border-b border-slate-200">
          <SheetTitle>Draft email</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Context */}
          <div className="space-y-1.5">
            <Label htmlFor="email-context">Context</Label>
            <Textarea
              id="email-context"
              placeholder="Describe what this email is about — e.g. 'Following up on inspection at 123 Main St, buyer wants a $5k credit for roof repair. Close date is June 15.'"
              className="resize-none min-h-[120px] text-sm"
              value={context}
              onChange={(e) => setContext(e.target.value)}
            />
          </div>

          {/* Recipient role */}
          <div className="space-y-1.5">
            <Label htmlFor="recipient-role">Recipient role</Label>
            <Select value={recipientRole} onValueChange={setRecipientRole}>
              <SelectTrigger id="recipient-role">
                <SelectValue placeholder="Select a role…" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_PRESETS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {recipientRole === "Other" && (
              <Input
                autoFocus
                placeholder="Enter role…"
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                className="text-sm"
              />
            )}
          </div>

          {/* Tone */}
          <div className="space-y-1.5">
            <Label>Tone</Label>
            <div className="flex gap-2">
              {TONE_OPTIONS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTone(t.value)}
                  className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                    tone === t.value
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <Button
            className="w-full"
            disabled={!canGenerate || isLoading}
            onClick={handleGenerate}
          >
            {isLoading ? (
              <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Drafting…</>
            ) : completion ? (
              <><RefreshCw className="h-4 w-4 mr-2" />Regenerate</>
            ) : (
              <><Mail className="h-4 w-4 mr-2" />Generate draft</>
            )}
          </Button>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 rounded-md border border-red-200 bg-red-50 px-3 py-2">
              {error.message}
            </p>
          )}

          {/* Output */}
          {(completion || isLoading) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-slate-500">Draft</Label>
                {completion && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <><Check className="h-3 w-3 mr-1 text-green-600" />Copied</>
                    ) : (
                      <><Copy className="h-3 w-3 mr-1" />Copy</>
                    )}
                  </Button>
                )}
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed min-h-[120px]">
                {completion}
                {isLoading && (
                  <span className="inline-block w-2 h-4 bg-slate-400 animate-pulse ml-0.5 align-text-bottom" />
                )}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
