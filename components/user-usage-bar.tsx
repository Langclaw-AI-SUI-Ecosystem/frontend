"use client";

import { useMemo } from "react";
import { useSuiClientQuery } from "@mysten/dapp-kit";
import { ShieldCheck, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWalletSession } from "@/hooks/use-wallet-session";
import { resolveProductChain } from "@/lib/chains";

// Earlier builds showed prepaid usage credits sourced from an on-chain vault.
// The Sui v1 build runs the private-memory agent without prepaid credits, so
// this is a lightweight wallet + SUI balance summary instead.
export function UserUsageBar() {
  const { address, isConnected, openWalletModal } = useWalletSession();
  const chain = resolveProductChain();
  const { data: balance } = useSuiClientQuery(
    "getBalance",
    { owner: address ?? "" },
    { enabled: Boolean(address) },
  );

  const balanceLabel = useMemo(() => {
    if (!balance) return null;

    const value = Number(balance.totalBalance) / 1e9;

    return `${Number.isFinite(value) ? value.toLocaleString(undefined, { maximumFractionDigits: 4 }) : "0"} ${chain.nativeSymbol}`;
  }, [balance, chain.nativeSymbol]);

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-3 text-sm">
      <div className="flex items-center gap-2.5 text-muted-foreground">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent/60 text-primary">
          <ShieldCheck className="size-4" />
        </span>
        <span className="font-medium text-foreground">Private memory agent</span>
        <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
          {chain.name}
        </Badge>
      </div>
      {isConnected ? (
        <div className="flex items-center gap-2 rounded-full border border-border/70 bg-secondary/40 px-3 py-1.5 text-muted-foreground">
          <Wallet className="size-4 text-primary" />
          <span className="font-medium font-mono text-foreground text-xs">
            {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Wallet"}
          </span>
          <span className="font-mono text-xs">
            {balanceLabel ?? "Balance loading"}
          </span>
        </div>
      ) : (
        <Button size="sm" variant="outline" onClick={openWalletModal}>
          <Wallet className="size-4" />
          Connect wallet
        </Button>
      )}
    </div>
  );
}
