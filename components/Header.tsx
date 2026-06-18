import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { Button } from "./ui/button";
import { LangclawLogo } from "./LangclawLogo";

const navItems = [
  { href: "/chat", label: "Intelligence" },
  { href: "/strategy", label: "Strategy Lab" },
  { href: "/proofs", label: "Proofs" },
  { href: "#pricing", label: "Pricing" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-border/60 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
        <Link
          aria-label="Langclaw home"
          className="flex min-w-0 items-center gap-2.5"
          href="/"
        >
          <LangclawLogo
            className="size-8 shrink-0 rounded-md ring-1 ring-border/70"
            imageClassName="left-[315%] h-[320px] w-[320px]"
          />
          <span className="min-w-0 leading-none">
            <span className="block font-semibold text-[15px] tracking-tight">
              Langclaw
            </span>
            <span className="mt-1 hidden font-mono text-[10px] text-muted-foreground uppercase tracking-[0.18em] sm:block">
              Sui Alpha
            </span>
          </span>
        </Link>

        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-8 md:flex"
        >
          {navItems.map((item) => (
            <Link
              className="text-muted-foreground text-sm transition-colors hover:text-foreground"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Button asChild size="sm">
          <Link href="/chat">
            Open app
            <ArrowRightIcon data-icon="inline-end" />
          </Link>
        </Button>
      </div>
    </header>
  );
}
