"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { useCurrentAccount, useSuiClientQuery } from "@mysten/dapp-kit";

import { SidebarTrigger } from "@/components/ui/sidebar";

type PageMeta = { title: string; subtitle?: string };

// Route → header copy. Titles mirror the sidebar labels so the shell reads
// consistently as the user navigates. Longest-prefix match handles nested
// routes (e.g. /strategy/abc inherits the /strategy header).
const PAGE_TITLES: Record<string, PageMeta> = {
  "/chat": {
    title: "Sui Intelligence",
    subtitle: "Research on-chain alpha, verified on Sui",
  },
  "/task": { title: "Automation", subtitle: "Scheduled monitors and runs" },
  "/usage": {
    title: "Usage & Credits",
    subtitle: "Deposit SUI and track research spend",
  },
  "/watchlist": {
    title: "Alpha Watchlist",
    subtitle: "Saved signals you are tracking",
  },
  "/strategy": {
    title: "Strategy Lab",
    subtitle: "Test a thesis, anchor the result",
  },
  "/proofs": {
    title: "Proof Center",
    subtitle: "Verifiable agent decisions on Sui",
  },
  "/key": { title: "API Console", subtitle: "Wallet-scoped API keys" },
  "/memory": { title: "Memory", subtitle: "Verifiable private memory" },
  "/settings": {
    title: "Settings",
    subtitle: "Automation and notifications",
  },
  "/admin": { title: "Admin", subtitle: "Operator controls" },
};

function resolvePage(pathname: string): PageMeta {
  if (PAGE_TITLES[pathname]) {
    return PAGE_TITLES[pathname];
  }

  const prefix = Object.keys(PAGE_TITLES)
    .filter((key) => pathname.startsWith(`${key}/`))
    .sort((a, b) => b.length - a.length)[0];

  return prefix ? PAGE_TITLES[prefix] : { title: "Langclaw" };
}

export function AppTopBar() {
  const pathname = usePathname() ?? "";
  const page = useMemo(() => resolvePage(pathname), [pathname]);

  const account = useCurrentAccount();
  const address = account?.address;
  const { data: balance } = useSuiClientQuery(
    "getBalance",
    { owner: address ?? "" },
    { enabled: Boolean(address) },
  );

  const balanceLabel = useMemo(() => {
    if (!balance) {
      return null;
    }

    const amount = Number(balance.totalBalance) / 1e9;
    return Number.isFinite(amount)
      ? `${amount.toLocaleString(undefined, { maximumFractionDigits: 4 })} SUI`
      : null;
  }, [balance]);

  return (
    <header className="sticky top-0 z-30 border-border/70 border-b bg-background/80 backdrop-blur-md">
      <div className="flex h-14 items-center gap-3 px-4 md:px-6">
        <SidebarTrigger className="md:hidden" />

        <div className="min-w-0 flex-1">
          <h1 className="truncate font-semibold text-foreground text-sm leading-5">
            {page.title}
          </h1>
          {page.subtitle ? (
            <p className="hidden truncate text-muted-foreground text-xs sm:block">
              {page.subtitle}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {balanceLabel ? (
            <span className="hidden items-center rounded-full border border-border/70 bg-secondary/60 px-2.5 py-1 font-medium font-mono text-foreground text-xs sm:inline-flex">
              {balanceLabel}
            </span>
          ) : null}

          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-accent/70 px-2.5 py-1 font-medium text-accent-foreground text-xs">
            <span className="size-1.5 rounded-full bg-primary" />
            Sui mainnet
          </span>
        </div>
      </div>
    </header>
  );
}
