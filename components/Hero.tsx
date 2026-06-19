import Link from "next/link";
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  SearchIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { Button } from "./ui/button";
import { MAINNET_ARTIFACTS, suiTxUrl } from "@/lib/mainnet-artifacts";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "./ui/input-group";

const trustChips = [
  { label: "Network", value: "Sui mainnet" },
  {
    label: "Package",
    value: `${MAINNET_ARTIFACTS.packageId.slice(0, 6)}…${MAINNET_ARTIFACTS.packageId.slice(-4)}`,
  },
  {
    label: "Proof tx",
    value: `${MAINNET_ARTIFACTS.memoryTx.slice(0, 6)}…${MAINNET_ARTIFACTS.memoryTx.slice(-4)}`,
  },
];

const evidenceChips = [
  { label: "Evidence", value: "DeepBook + Dune" },
  { label: "Sources", value: "On-chain + social" },
  { label: "Proof", value: "Sui anchor" },
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="-z-10 absolute inset-0 bg-[linear-gradient(to_right,color-mix(in_oklab,var(--border)_60%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklab,var(--border)_60%,transparent)_1px,transparent_1px)] bg-[size:64px_64px] opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_72%)]" />
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 md:px-6 md:py-28 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex flex-col gap-7">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-accent/70 px-3 py-1 font-mono text-[11px] text-accent-foreground uppercase tracking-[0.14em]">
            <span className="size-1.5 rounded-full bg-primary" />
            AI alpha intelligence · verified on Sui
          </span>

          <h1 className="font-serif font-medium text-5xl text-foreground leading-[1.04] tracking-tight md:text-6xl">
            Find the alpha on Sui,{" "}
            <span className="text-primary">proven on-chain.</span>
          </h1>

          <p className="max-w-xl text-lg text-muted-foreground leading-8">
            Langclaw researches smart-money flows, liquidity anomalies, and
            protocol momentum across on-chain and social sources — then anchors
            every answer on Sui so you can verify it, not just trust it.
          </p>

          <form action="/chat" className="max-w-xl" method="get">
            <InputGroup className="min-h-14 rounded-xl bg-background shadow-[0_8px_24px_rgba(22,32,58,0.06)]">
              <InputGroupAddon>
                <SearchIcon aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput
                aria-label="Research prompt"
                className="h-14 text-base"
                name="q"
                placeholder="Which Sui tokens are smart-money wallets accumulating?"
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton size="sm" type="submit" variant="default">
                  Research
                  <ArrowRightIcon data-icon="inline-end" />
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </form>

          <p className="text-muted-foreground text-sm">
            Browse{" "}
            <Link
              className="font-medium text-foreground underline-offset-4 hover:underline"
              href="/proofs"
            >
              public proofs
            </Link>{" "}
            free · connect a wallet to run live research.
          </p>

          <dl className="grid max-w-xl grid-cols-3 gap-2 pt-1">
            {trustChips.map((chip) => (
              <div
                className="rounded-lg border border-border/70 bg-secondary/60 px-3 py-2"
                key={chip.label}
              >
                <dt className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.12em]">
                  {chip.label}
                </dt>
                <dd className="mt-1 truncate font-medium font-mono text-foreground text-sm">
                  {chip.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <HeroSignalPeek />
      </div>
    </section>
  );
}

function HeroSignalPeek() {
  return (
    <div className="relative lg:pl-4">
      <div className="rounded-3xl border border-border/70 bg-card p-1.5 shadow-[0_16px_48px_rgba(22,32,58,0.08)]">
        <div className="rounded-[20px] border border-border/60 bg-background">
          <div className="flex items-center justify-between border-border/60 border-b px-5 py-3.5">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-primary" />
              <span className="font-medium text-sm">Verified answer</span>
            </div>
            <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.12em]">
              Example
            </span>
          </div>

          <div className="flex flex-col gap-4 p-5">
            <div>
              <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.12em]">
                Conclusion
              </p>
              <p className="mt-1.5 font-serif text-foreground text-xl leading-snug">
                Smart-money wallets are rotating into Sui DeFi blue-chips.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {evidenceChips.map((chip) => (
                <div
                  className="rounded-lg border border-border/60 bg-secondary/50 px-3 py-2.5"
                  key={chip.label}
                >
                  <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.1em]">
                    {chip.label}
                  </p>
                  <p className="mt-1 font-medium text-foreground text-xs">
                    {chip.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-[color-mix(in_oklab,var(--success-foreground)_22%,transparent)] bg-success px-4 py-3">
              <ShieldCheckIcon className="size-5 shrink-0 text-success-foreground" />
              <div className="min-w-0">
                <p className="font-medium text-sm text-success-foreground">
                  Verified on Sui mainnet
                </p>
                <a
                  className="inline-flex items-center gap-1 font-mono text-success-foreground/80 text-xs hover:underline"
                  href={suiTxUrl(MAINNET_ARTIFACTS.memoryTx)}
                  rel="noreferrer"
                  target="_blank"
                >
                  {`${MAINNET_ARTIFACTS.memoryTx.slice(0, 10)}…${MAINNET_ARTIFACTS.memoryTx.slice(-6)}`}
                  <ArrowUpRightIcon className="size-3" />
                </a>
              </div>
            </div>

            <Button asChild className="w-full" variant="outline">
              <Link href="/chat">
                Run this research
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
