import CreateKey from "@/components/CreateKey";

export default function ApiConsolePage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-accent/40 px-3 py-1 font-medium text-accent-foreground text-xs">
          <span className="size-1.5 rounded-full bg-primary" />
          API Console
        </span>
        <p className="max-w-2xl text-balance font-serif text-foreground text-xl leading-8 tracking-tight">
          Create wallet-scoped server keys for apps that call Langclaw
          directly.
        </p>
      </div>
      <CreateKey />
    </div>
  );
}
