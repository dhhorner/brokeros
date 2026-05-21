import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UpgradeButton } from "@/components/layout/billing-button";
import { Check } from "lucide-react";

export const metadata = { title: "Billing — BrokerOS" };

const PRO_FEATURES = [
  "Unlimited leads and transactions",
  "MLS sync integration",
  "AI-powered email drafting and task suggestions",
  "Automated nurture sequences",
  "Priority support",
];

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; cancelled?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;

  const user = session?.user?.id
    ? await db.user.findUnique({
        where: { id: session.user.id },
        select: {
          brokerage: { select: { plan: true, name: true } },
        },
      })
    : null;

  const plan = user?.brokerage?.plan ?? "FREE";
  const isPro = plan === "PRO";

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Billing</h2>
        <p className="text-slate-500 mt-1">Manage your BrokerOS subscription.</p>
      </div>

      {params.success && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          Payment successful! Your plan has been upgraded to Pro.
        </div>
      )}
      {params.cancelled && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-700">
          Checkout was cancelled. Your plan hasn&apos;t changed.
        </div>
      )}

      {/* Current plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Current plan</CardTitle>
            <Badge
              variant={isPro ? "default" : "secondary"}
              className={isPro ? "bg-slate-900" : ""}
            >
              {isPro ? "Pro" : "Free"}
            </Badge>
          </div>
          <CardDescription>
            {isPro
              ? "You have full access to all BrokerOS features."
              : "You're on the free plan with limited features."}
          </CardDescription>
        </CardHeader>
        {!isPro && (
          <CardContent>
            <div className="rounded-lg border border-slate-200 p-4 space-y-4">
              <div>
                <h4 className="font-semibold text-slate-900">
                  BrokerOS Pro
                </h4>
                <p className="text-sm text-slate-500 mt-1">
                  Everything you need to run a modern brokerage.
                </p>
              </div>
              <ul className="space-y-2">
                {PRO_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <UpgradeButton />
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
