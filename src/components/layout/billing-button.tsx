"use client";

import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function UpgradeButton() {
  const [loading, setLoading] = useState(false);
  const createSession = trpc.billing.createCheckoutSession.useMutation({
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
    onError: (err) => {
      setLoading(false);
      alert(err.message);
    },
  });

  return (
    <Button
      onClick={() => {
        setLoading(true);
        createSession.mutate();
      }}
      disabled={loading || createSession.isPending}
    >
      {loading || createSession.isPending ? "Redirecting..." : "Upgrade to Pro"}
    </Button>
  );
}
