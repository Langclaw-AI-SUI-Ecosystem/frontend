import type { Metadata } from "next";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import {
  BuiltOn,
  FinalCta,
  Footer,
  HowItWorks,
  Pricing,
  StrategySpotlight,
  UseCases,
  VerifiableMoat,
  WatchlistAutomation,
} from "@/components/landing";

export const metadata: Metadata = {
  other: {
    "talentapp:project_verification":
      "8fc3c22853db717c0ac3567bce73e75fca5576dce2aa34a209c2a810435bdbd5fbda8c4e7a07dc5cfd91ab0eb16b2fb7e9aa2f0eb5307cdecae8a69e9cf49c58",
  },
};

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <Header />
      <Hero />
      <BuiltOn />
      <HowItWorks />
      <UseCases />
      <StrategySpotlight />
      <VerifiableMoat />
      <WatchlistAutomation />
      <Pricing />
      <FinalCta />
      <Footer />
    </main>
  );
}
