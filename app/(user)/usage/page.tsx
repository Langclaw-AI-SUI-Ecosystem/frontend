import { InfoIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { UsageDashboard } from "@/components/usage-dashboard";
import { UserUsageBar } from "@/components/user-usage-bar";

export default function UsagePage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-accent/40 px-3 py-1 font-medium text-accent-foreground text-xs">
            <span className="size-1.5 rounded-full bg-primary" />
            Usage &amp; Credits
          </span>
          <Badge variant="secondary">Sui v1</Badge>
        </div>
        <h1 className="max-w-3xl text-balance font-serif font-semibold text-3xl text-foreground tracking-tight md:text-4xl">
          Prepaid SUI credits, settled on-chain.
        </h1>
        <p className="max-w-2xl text-balance text-muted-foreground leading-7">
          Research runs are billed from prepaid native SUI credits held in an
          on-chain usage vault: each run reserves an estimated cost, then settles
          the actual amount. Connect your wallet to see your balance, per-run
          cost, and how to top up.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <UserUsageBar />
        </CardContent>
      </Card>

      <UsageDashboard />

      <p className="flex max-w-2xl items-start gap-2 rounded-xl border border-border/60 bg-secondary/30 px-3.5 py-3 text-muted-foreground text-xs leading-5">
        <InfoIcon
          aria-hidden="true"
          className="mt-0.5 size-3.5 shrink-0 text-primary"
        />
        <span>
          Developer Mode accounts run without charge — reservations are skipped
          and receipts are zero-cost. It is toggled per account in automation
          settings and is the zero-friction path for demos and reviewers.
        </span>
      </p>
    </div>
  );
}
