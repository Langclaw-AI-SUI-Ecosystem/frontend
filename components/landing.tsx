import type { ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ActivityIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  BellIcon,
  BookmarkIcon,
  CalendarClockIcon,
  CheckIcon,
  DatabaseIcon,
  DropletsIcon,
  LockIcon,
  SearchIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "./ui/input-group";
import {
  MAINNET_ARTIFACTS,
  suiObjectUrl,
  suiTxUrl,
  walrusBlobUrl,
} from "@/lib/mainnet-artifacts";

const REPOS = [
  {
    label: "Backend",
    href: "https://github.com/Langclaw-AI-SUI-Ecosystem/backend",
  },
  {
    label: "Move package",
    href: "https://github.com/Langclaw-AI-SUI-Ecosystem/move",
  },
  {
    label: "Walrus index",
    href: "https://github.com/Langclaw-AI-SUI-Ecosystem/langclaw-sui-walrus",
  },
];

function short(value: string) {
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2.5 font-mono text-[11px] text-primary uppercase tracking-[0.18em]">
      <span className="h-px w-6 bg-primary/40" />
      {children}
    </span>
  );
}

/* 2 — Built-on strip */
export function BuiltOn() {
  const stack = ["Sui", "Walrus", "Seal"];
  const providers = ["DeepBook", "Dune", "Nansen", "GeckoTerminal", "DefiLlama"];
  return (
    <section className="border-border/60 border-y bg-secondary/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-9 md:flex-row md:items-center md:justify-between md:px-6">
        <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
          Built on · powered by
        </p>
        <div className="flex flex-wrap items-center gap-x-7 gap-y-3">
          {stack.map((name) => (
            <span className="font-serif text-foreground text-lg" key={name}>
              {name}
            </span>
          ))}
          <span className="hidden h-4 w-px bg-border md:block" />
          {providers.map((name) => (
            <span
              className="font-medium text-muted-foreground text-sm"
              key={name}
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* 3 — How it works */
export function HowItWorks() {
  const steps: Array<{
    n: string;
    icon: LucideIcon;
    title: string;
    body: string;
  }> = [
    {
      n: "01",
      icon: SearchIcon,
      title: "Ask anything about Sui",
      body: "Pose a research question in plain language — smart-money moves, liquidity shifts, protocol momentum.",
    },
    {
      n: "02",
      icon: SparklesIcon,
      title: "Langclaw researches",
      body: "The agent pulls on-chain and social sources, cross-checks providers, and shows its work — gaps included.",
    },
    {
      n: "03",
      icon: ShieldCheckIcon,
      title: "Get a verifiable answer",
      body: "Every decision is Seal-encrypted, stored on Walrus, and anchored on Sui. Verify the chain, not the interface.",
    },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
      <div className="flex flex-col gap-4">
        <Eyebrow>How it works</Eyebrow>
        <h2 className="max-w-2xl font-serif font-medium text-4xl text-foreground leading-tight tracking-tight md:text-5xl">
          From question to proof in three steps.
        </h2>
      </div>
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div
              className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card p-7"
              key={step.n}
            >
              <div className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <Icon className="size-5" />
                </span>
                <span className="font-mono text-muted-foreground/50 text-sm">
                  {step.n}
                </span>
              </div>
              <h3 className="font-semibold text-foreground text-lg">
                {step.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-6">
                {step.body}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* 4 — Intelligence use-cases */
export function UseCases() {
  const useCases: Array<{
    icon: LucideIcon;
    title: string;
    body: string;
    prompt: string;
  }> = [
    {
      icon: TrendingUpIcon,
      title: "Smart-money accumulation",
      body: "Surface wallets and cohorts quietly building positions before the crowd notices.",
      prompt: "Which Sui tokens are smart-money wallets accumulating this week?",
    },
    {
      icon: DropletsIcon,
      title: "Liquidity anomalies",
      body: "Catch unusual DeepBook depth, pool drains, and liquidity migrations as they happen.",
      prompt:
        "Show unusual liquidity moves in Sui DeFi pools over the last 24 hours.",
    },
    {
      icon: ActivityIcon,
      title: "Protocol & TVL momentum",
      body: "Track which Sui protocols are gaining real usage, deposits, and fees.",
      prompt: "Which Sui protocols have the strongest TVL momentum right now?",
    },
    {
      icon: UsersIcon,
      title: "Holder-flow shifts",
      body: "Read holder concentration, inflows, and distribution changes over time.",
      prompt: "Analyze holder-flow and concentration changes for top Sui tokens.",
    },
  ];
  return (
    <section className="border-border/60 border-y bg-secondary/40">
      <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
        <div className="flex flex-col gap-4">
          <Eyebrow>Intelligence</Eyebrow>
          <h2 className="max-w-2xl font-serif font-medium text-4xl text-foreground leading-tight tracking-tight md:text-5xl">
            The alpha you actually came for.
          </h2>
          <p className="max-w-2xl text-base text-muted-foreground leading-7">
            Four core questions Langclaw answers with cited, on-chain-verifiable
            research. Tap one to run it.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {useCases.map((useCase) => {
            const Icon = useCase.icon;
            return (
              <Link
                className="group flex flex-col gap-4 rounded-2xl border border-border/70 bg-card p-7 transition-all hover:border-primary/40 hover:shadow-[0_12px_32px_rgba(22,32,58,0.07)]"
                href={`/chat?q=${encodeURIComponent(useCase.prompt)}`}
                key={useCase.title}
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <Icon className="size-5" />
                </span>
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-semibold text-foreground text-lg">
                    {useCase.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-6">
                    {useCase.body}
                  </p>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3 border-border/60 border-t pt-4">
                  <span className="truncate font-mono text-muted-foreground text-xs">
                    {useCase.prompt}
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1 font-medium text-primary text-sm">
                    Run
                    <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* 5 — Strategy Lab spotlight */
export function StrategySpotlight() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div className="flex flex-col gap-5">
          <Eyebrow>Strategy Lab</Eyebrow>
          <h2 className="font-serif font-medium text-4xl text-foreground leading-tight tracking-tight md:text-5xl">
            Test a thesis. Anchor the result.
          </h2>
          <p className="max-w-xl text-base text-muted-foreground leading-7">
            Turn a signal into a backtest — equity curve, trade log, and metrics
            — then record the paper-trade outcome as an on-chain proof.
            Analysis-first: Langclaw never executes live-funds trades.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              <CheckIcon data-icon="inline-start" />
              Paper trades only
            </Badge>
            <Badge variant="outline">On-chain trading journal</Badge>
          </div>
          <Button asChild className="w-fit" size="lg" variant="outline">
            <Link href="/strategy">
              Open Strategy Lab
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
          </Button>
        </div>
        <StrategyCard />
      </div>
    </section>
  );
}

function StrategyCard() {
  const trades = [
    { pair: "SUI / USDC", side: "Long", outcome: "Win" },
    { pair: "DEEP / USDC", side: "Long", outcome: "Win" },
    { pair: "CETUS / USDC", side: "Short", outcome: "Loss" },
  ];
  const metrics = [
    { label: "Return", value: "Positive" },
    { label: "Win rate", value: "2 / 3" },
    { label: "Trades", value: "3 paper" },
  ];
  return (
    <div className="rounded-3xl border border-border/70 bg-card p-1.5 shadow-[0_16px_48px_rgba(22,32,58,0.08)]">
      <div className="rounded-[20px] border border-border/60 bg-background p-5">
        <div className="flex items-center justify-between">
          <p className="font-medium text-sm">Backtest</p>
          <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.12em]">
            Illustrative
          </span>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-border/60 bg-secondary/40 p-4">
          <svg
            aria-hidden="true"
            className="h-28 w-full"
            preserveAspectRatio="none"
            viewBox="0 0 320 110"
          >
            <defs>
              <linearGradient id="lc-equity" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.18" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0,96 L28,88 L56,92 L84,70 L112,76 L140,54 L168,60 L196,40 L224,46 L252,28 L280,22 L320,14 L320,110 L0,110 Z"
              fill="url(#lc-equity)"
            />
            <path
              d="M0,96 L28,88 L56,92 L84,70 L112,76 L140,54 L168,60 L196,40 L224,46 L252,28 L280,22 L320,14"
              fill="none"
              stroke="var(--primary)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {metrics.map((metric) => (
            <div
              className="rounded-lg border border-border/60 bg-secondary/40 px-3 py-2"
              key={metric.label}
            >
              <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.1em]">
                {metric.label}
              </p>
              <p className="mt-1 font-medium text-foreground text-sm">
                {metric.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-1.5">
          {trades.map((trade) => (
            <div
              className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2"
              key={trade.pair}
            >
              <span className="font-mono text-foreground text-xs">
                {trade.pair}
              </span>
              <span className="text-muted-foreground text-xs">{trade.side}</span>
              <span
                className={
                  trade.outcome === "Win"
                    ? "font-medium text-success-foreground text-xs"
                    : "font-medium text-muted-foreground text-xs"
                }
              >
                {trade.outcome}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* 6 — Verifiable by design (the moat) */
export function VerifiableMoat() {
  const chain: Array<{ icon: LucideIcon; title: string; body: string }> = [
    {
      icon: LockIcon,
      title: "Seal-encrypted",
      body: "Owner-gated encryption is applied before anything leaves the agent.",
    },
    {
      icon: DatabaseIcon,
      title: "Stored on Walrus",
      body: "The encrypted memory blob is publicly retrievable by anyone.",
    },
    {
      icon: ShieldCheckIcon,
      title: "Anchored on Sui",
      body: "The content hash is committed in a Sui mainnet transaction.",
    },
  ];
  const artifacts = [
    {
      label: "Package",
      value: short(MAINNET_ARTIFACTS.packageId),
      href: suiObjectUrl(MAINNET_ARTIFACTS.packageId),
    },
    {
      label: "Proof transaction",
      value: short(MAINNET_ARTIFACTS.memoryTx),
      href: suiTxUrl(MAINNET_ARTIFACTS.memoryTx),
    },
    {
      label: "Public blob",
      value: short(MAINNET_ARTIFACTS.publicBlobId),
      href: walrusBlobUrl(MAINNET_ARTIFACTS.publicBlobId),
    },
  ];
  return (
    <section className="border-border/60 border-y bg-[color-mix(in_oklab,var(--primary)_5%,var(--background))]">
      <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
        <div className="flex max-w-2xl flex-col gap-4">
          <Eyebrow>The moat</Eyebrow>
          <h2 className="font-serif font-medium text-4xl text-foreground leading-tight tracking-tight md:text-5xl">
            Verifiable by design.
          </h2>
          <p className="text-base text-muted-foreground leading-7">
            Anyone can claim an answer. Langclaw proves it. Every agent decision
            travels the same chain of custody — so you can audit it end to end.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {chain.map((node, index) => {
            const Icon = node.icon;
            return (
              <div className="relative" key={node.title}>
                <div className="flex h-full flex-col gap-4 rounded-2xl border border-border/70 bg-card p-7">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                      <Icon className="size-5" />
                    </span>
                    <span className="font-mono text-muted-foreground/60 text-xs">
                      {`0${index + 1}`}
                    </span>
                  </div>
                  <h3 className="font-semibold text-foreground text-lg">
                    {node.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-6">
                    {node.body}
                  </p>
                </div>
                {index < chain.length - 1 ? (
                  <ArrowRightIcon className="-right-3.5 -translate-y-1/2 absolute top-1/2 z-10 hidden size-6 rounded-full border border-border/70 bg-background p-1 text-muted-foreground md:block" />
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col gap-5 rounded-2xl border border-border/70 bg-card p-7 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheckIcon className="size-5 shrink-0 text-success-foreground" />
            <p className="font-serif text-foreground text-lg">
              Don&apos;t trust the interface — verify the chain.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3 md:gap-3">
            {artifacts.map((artifact) => (
              <a
                className="rounded-lg border border-border/70 bg-secondary/50 px-3 py-2 transition-colors hover:bg-secondary"
                href={artifact.href}
                key={artifact.label}
                rel="noreferrer"
                target="_blank"
              >
                <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.1em]">
                  {artifact.label}
                </p>
                <p className="mt-1 flex items-center gap-1 font-medium font-mono text-foreground text-xs">
                  {artifact.value}
                  <ArrowUpRightIcon className="size-3 text-muted-foreground" />
                </p>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* 7 — Watchlist & automation */
export function WatchlistAutomation() {
  const features: Array<{ icon: LucideIcon; title: string; body: string }> = [
    {
      icon: BookmarkIcon,
      title: "Alpha Watchlist",
      body: "Save signals and revisit them as the chain moves.",
    },
    {
      icon: CalendarClockIcon,
      title: "Scheduled monitors",
      body: "Re-run research on a cadence — hourly, daily, your call.",
    },
    {
      icon: BellIcon,
      title: "Telegram & email alerts",
      body: "Get pinged the moment a thesis triggers.",
    },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
      <div className="flex flex-col gap-4">
        <Eyebrow>Stay ahead</Eyebrow>
        <h2 className="max-w-2xl font-serif font-medium text-4xl text-foreground leading-tight tracking-tight md:text-5xl">
          Set it once. Let the alpha come to you.
        </h2>
      </div>
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card p-7"
              key={feature.title}
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <Icon className="size-5" />
              </span>
              <h3 className="font-semibold text-foreground text-lg">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-6">
                {feature.body}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* 8 — Pricing (SUI credits) */
export function Pricing() {
  const points = [
    "Pay-as-you-go, billed in SUI",
    "Deposit into the on-chain usage vault",
    "Reserve and settle per research request",
    "Withdraw your balance anytime",
  ];
  return (
    <section className="border-border/60 border-y bg-secondary/40" id="pricing">
      <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="flex flex-col gap-5">
            <Eyebrow>Pricing</Eyebrow>
            <h2 className="font-serif font-medium text-4xl text-foreground leading-tight tracking-tight md:text-5xl">
              Pay only for the research you run.
            </h2>
            <p className="max-w-xl text-base text-muted-foreground leading-7">
              Deposit SUI into the on-chain usage vault. Each research request
              reserves credits and settles on completion — no subscriptions, no
              lock-in. Analysis-first: no live-funds trades, ever.
            </p>
          </div>

          <div className="rounded-3xl border border-border/70 bg-card p-8 shadow-[0_16px_48px_rgba(22,32,58,0.08)]">
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.14em]">
                  Usage credits
                </p>
                <p className="mt-1 font-serif text-3xl text-foreground">
                  Pay in SUI
                </p>
              </div>
              <Badge variant="secondary">
                <CheckIcon data-icon="inline-start" />
                On-chain vault
              </Badge>
            </div>
            <ul className="mt-6 flex flex-col gap-3">
              {points.map((point) => (
                <li className="flex items-start gap-3 text-sm" key={point}>
                  <CheckIcon className="mt-0.5 size-4 shrink-0 text-success-foreground" />
                  <span className="text-foreground">{point}</span>
                </li>
              ))}
            </ul>
            <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
              <Button asChild className="flex-1">
                <Link href="/chat">
                  Open the app
                  <ArrowRightIcon data-icon="inline-end" />
                </Link>
              </Button>
              <Button asChild className="flex-1" variant="outline">
                <Link href="/usage">View usage</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* 9 — Final CTA */
export function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-24 md:px-6 md:py-32">
      <div className="relative overflow-hidden rounded-[28px] border border-border/70 bg-card px-6 py-16 text-center shadow-[0_16px_48px_rgba(22,32,58,0.06)] md:px-16">
        <div className="-z-10 absolute inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--primary)_10%,transparent),transparent_60%)]" />
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-5">
          <Eyebrow>Start now</Eyebrow>
          <h2 className="font-serif font-medium text-4xl text-foreground leading-tight tracking-tight md:text-6xl">
            Start researching Sui.
          </h2>
          <p className="max-w-xl text-base text-muted-foreground leading-7">
            Ask a question, get a cited answer, verify it on-chain. Public proofs
            are free to browse — connect a wallet when you&apos;re ready to run
            live research.
          </p>
          <form action="/chat" className="mt-3 w-full max-w-xl" method="get">
            <InputGroup className="min-h-14 rounded-xl bg-background shadow-[0_8px_24px_rgba(22,32,58,0.06)]">
              <InputGroupAddon>
                <SearchIcon aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput
                aria-label="Research prompt"
                className="h-14 text-base"
                name="q"
                placeholder="What's the smart money doing on Sui today?"
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton size="sm" type="submit" variant="default">
                  Research
                  <ArrowRightIcon data-icon="inline-end" />
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </form>
        </div>
      </div>
    </section>
  );
}

/* Footer */
export function Footer() {
  const productLinks = [
    { label: "Intelligence", href: "/chat" },
    { label: "Strategy Lab", href: "/strategy" },
    { label: "Proof Center", href: "/proofs" },
    { label: "Watchlist", href: "/watchlist" },
    { label: "Usage", href: "/usage" },
  ];
  const verifyLinks = [
    { label: "Package", href: suiObjectUrl(MAINNET_ARTIFACTS.packageId) },
    { label: "Proof transaction", href: suiTxUrl(MAINNET_ARTIFACTS.memoryTx) },
    {
      label: "Public blob",
      href: walrusBlobUrl(MAINNET_ARTIFACTS.publicBlobId),
    },
  ];
  return (
    <footer className="border-border/60 border-t bg-secondary/30">
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-3">
            <span className="font-serif text-foreground text-xl">Langclaw</span>
            <p className="max-w-xs text-muted-foreground text-sm leading-6">
              AI alpha intelligence for Sui — researched across on-chain and
              social sources, proven on-chain.
            </p>
            <span className="mt-1 inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.12em]">
              <span className="size-1.5 rounded-full bg-primary" />
              Sui mainnet
            </span>
          </div>

          <FooterColumn title="Product">
            {productLinks.map((link) => (
              <Link
                className="text-muted-foreground text-sm transition-colors hover:text-foreground"
                href={link.href}
                key={link.label}
              >
                {link.label}
              </Link>
            ))}
          </FooterColumn>

          <FooterColumn title="Verify">
            {verifyLinks.map((link) => (
              <a
                className="inline-flex items-center gap-1 text-muted-foreground text-sm transition-colors hover:text-foreground"
                href={link.href}
                key={link.label}
                rel="noreferrer"
                target="_blank"
              >
                {link.label}
                <ArrowUpRightIcon className="size-3" />
              </a>
            ))}
          </FooterColumn>

          <FooterColumn title="Repos">
            {REPOS.map((repo) => (
              <a
                className="inline-flex items-center gap-1 text-muted-foreground text-sm transition-colors hover:text-foreground"
                href={repo.href}
                key={repo.label}
                rel="noreferrer"
                target="_blank"
              >
                {repo.label}
                <ArrowUpRightIcon className="size-3" />
              </a>
            ))}
          </FooterColumn>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-border/60 border-t pt-6 text-muted-foreground text-xs sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Langclaw · Sui Alpha</span>
          <span>Analysis-first · no live-funds trades</span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="font-mono text-[11px] text-muted-foreground/70 uppercase tracking-[0.14em]">
        {title}
      </p>
      <nav className="flex flex-col gap-2.5">{children}</nav>
    </div>
  );
}
