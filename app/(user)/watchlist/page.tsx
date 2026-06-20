"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlarmClockIcon,
  AlertCircleIcon,
  BookmarkIcon,
  BotIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  FlaskConicalIcon,
  ExternalLinkIcon,
  Loader2Icon,
  MessageCircleIcon,
  NotebookPenIcon,
  RefreshCcwIcon,
  ShieldCheckIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  isTelegramLinkRequiredError,
  useTelegramConnectGate,
} from "@/components/TelegramConnectDialog";
import {
  LANGCLAW_ALPHA_WATCHLIST_UPDATED_EVENT,
  buildAlphaWatchlistItem,
  clearAlphaWatchlistSessions,
  forgetAlphaWatchlistSession,
  hydrateAlphaWatchlistSession,
  rememberAlphaWatchlistSession,
  type AlphaWatchlistItem,
} from "@/lib/alpha-watchlist";
import { createChatSession, savePendingPrompt } from "@/lib/chat-utils";
import { defaultProductChain, isProductChainId } from "@/lib/chains";
import { resolveChatModel } from "@/lib/chat-model";
import { useWalletSession } from "@/hooks/use-wallet-session";
import {
  clearAlphaWatchlist,
  createAutomationTask,
  deleteAlphaWatchlistItem,
  dispatchChatSessionsUpdated,
  getChatSession,
  listAlphaWatchlist,
  listChatSessions,
  readFriendlyError,
  updateAlphaWatchlistItem,
  upsertChatSession,
  type AlphaWatchlistMetadataInput,
  type AlphaWatchlistPriority,
  type AlphaWatchlistStatus,
  type AutomationFrequency,
  type OnChainToolFinalPayload,
  type WalletAuth,
} from "@/lib/langclaw-api";

export default function WatchlistPage() {
  const router = useRouter();
  const { getWalletAuth, isConnected, isSigning } = useWalletSession();
  const { dialog: telegramDialog, requireTelegramLinkedWallet } =
    useTelegramConnectGate();
  const [items, setItems] = useState<AlphaWatchlistItem[]>([]);
  const [automationItem, setAutomationItem] =
    useState<AlphaWatchlistItem | null>(null);
  const [noteItem, setNoteItem] = useState<AlphaWatchlistItem | null>(null);
  const [clearOpen, setClearOpen] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState("");

  const refreshItems = useCallback(async () => {
    if (!isConnected) {
      setItems([]);
      setLoaded(true);
      setError("");
      return;
    }

    setLoading("list");
    setError("");

    try {
      const wallet = await getWalletAuth();
      const watchlistItems = await listAlphaWatchlist(wallet);
      setItems(await hydrateWatchlistItemsWithChatSessions(wallet, watchlistItems));
    } catch (err) {
      const message = readFriendlyError(err, "Unable to load alpha watchlist.");
      setError(message);
      toast.error(message);
    } finally {
      setLoaded(true);
      setLoading("");
    }
  }, [getWalletAuth, isConnected]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refreshItems();
    }, 0);

    const handleWatchlistUpdated = () => {
      void refreshItems();
    };

    window.addEventListener(
      LANGCLAW_ALPHA_WATCHLIST_UPDATED_EVENT,
      handleWatchlistUpdated,
    );

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener(
        LANGCLAW_ALPHA_WATCHLIST_UPDATED_EVENT,
        handleWatchlistUpdated,
      );
    };
  }, [refreshItems]);

  const stats = useMemo(() => {
    const anchored = items.filter(
      (item) => item.proofTx || item.decisionId,
    ).length;
    const sourceCount = items.reduce((total, item) => total + item.sourceCount, 0);
    const gapCount = items.reduce((total, item) => total + item.gapCount, 0);

    return { anchored, gapCount, sourceCount, total: items.length };
  }, [items]);

  const handleRemove = useCallback(
    async (item: AlphaWatchlistItem) => {
      setLoading(item.id);
      setError("");

      try {
        const wallet = await getWalletAuth();
        await deleteAlphaWatchlistItem(wallet, item.id);
        forgetAlphaWatchlistSession(item.id);
        setItems((current) => current.filter((entry) => entry.id !== item.id));
        toast.success("Removed from watchlist", {
          description: item.title,
        });
      } catch (err) {
        const message = readFriendlyError(err, "Unable to remove watchlist item.");
        setError(message);
        toast.error(message);
      } finally {
        setLoading("");
      }
    },
    [getWalletAuth],
  );

  const handleRerunResearch = useCallback(
    async (item: AlphaWatchlistItem) => {
      const loadingKey = `rerun-${item.id}`;
      const prompt = getWatchlistPrompt(item);
      setLoading(loadingKey);
      setError("");

      try {
        const wallet = await requireTelegramLinkedWallet();
        const session = createChatSession(prompt);
        savePendingPrompt(session.id, {
          model: resolveChatModel(),
          researchTrend: true,
          text: prompt,
          toolMode: "research",
        });
        await upsertChatSession(wallet, session);
        dispatchChatSessionsUpdated();
        toast.success("Research session created", {
          description: "Running the saved signal with current evidence.",
        });
        router.push(`/chat/${session.id}`);
      } catch (err) {
        if (isTelegramLinkRequiredError(err)) {
          return;
        }

        const message = readFriendlyError(err, "Unable to re-run research.");
        setError(message);
        toast.error(message);
      } finally {
        setLoading("");
      }
    },
    [requireTelegramLinkedWallet, router],
  );

  const handleUpdateMetadata = useCallback(
    async (
      item: AlphaWatchlistItem,
      updates: AlphaWatchlistMetadataInput,
      successMessage: string,
    ) => {
      const loadingKey = `update-${item.id}`;
      setLoading(loadingKey);
      setError("");

      try {
        const wallet = await getWalletAuth();
        const updatedItem = await updateAlphaWatchlistItem(
          wallet,
          item.id,
          updates,
        );
        setItems((current) =>
          current.map((entry) =>
            entry.id === updatedItem.id ? updatedItem : entry,
          ),
        );
        toast.success(successMessage);
        return true;
      } catch (err) {
        const message = readFriendlyError(err, "Unable to update watchlist item.");
        setError(message);
        toast.error(message);
        return false;
      } finally {
        setLoading("");
      }
    },
    [getWalletAuth],
  );

  const handleCreateAutomation = useCallback(
    async (item: AlphaWatchlistItem, draft: AutomationDraft) => {
      setLoading(`automation-${item.id}`);
      setError("");

      try {
        const wallet = await requireTelegramLinkedWallet();
        await createAutomationTask(wallet, {
          name: draft.name,
          project: "Alpha Watchlist",
          prompt: draft.prompt,
          scheduleFrequency: draft.scheduleFrequency,
          scheduleTime: draft.scheduleTime,
          status: draft.status,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
          triggerType: "schedule",
        });
        setAutomationItem(null);
        toast.success("Automation task created", {
          description: draft.name,
        });
      } catch (err) {
        if (isTelegramLinkRequiredError(err)) {
          return;
        }

        const message = readFriendlyError(err, "Unable to create automation task.");
        setError(message);
        toast.error(message);
      } finally {
        setLoading("");
      }
    },
    [requireTelegramLinkedWallet],
  );

  const handleSaveNote = useCallback(
    async (
      item: AlphaWatchlistItem,
      note: string,
      priority: AlphaWatchlistPriority,
    ) => {
      const saved = await handleUpdateMetadata(
        item,
        { note: note.trim() || null, priority },
        "Watchlist thesis saved",
      );

      if (saved) {
        setNoteItem(null);
      }
    },
    [handleUpdateMetadata],
  );

  const handleClear = useCallback(async () => {
    setLoading("clear");
    setError("");

    try {
      const wallet = await getWalletAuth();
      await clearAlphaWatchlist(wallet);
      clearAlphaWatchlistSessions();
      setItems([]);
      setClearOpen(false);
      toast.success("Watchlist cleared");
    } catch (err) {
      const message = readFriendlyError(err, "Unable to clear watchlist.");
      setError(message);
      toast.error(message);
    } finally {
      setLoading("");
    }
  }, [getWalletAuth]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-3">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-accent/40 px-3 py-1 font-medium text-accent-foreground text-xs">
            <span className="size-1.5 rounded-full bg-primary" />
            Alpha Watchlist
          </span>
          <p className="max-w-2xl text-balance font-serif text-foreground text-xl leading-8 tracking-tight">
            Saved Sui intelligence signals for follow-up review, manual
            trading decisions, and hackathon demo evidence.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={loading === "list" || isSigning}
            onClick={() => void refreshItems()}
            size="sm"
            type="button"
            variant="outline"
          >
            <RefreshCcwIcon className="size-4" />
            Refresh
          </Button>
          <Button
            disabled={!items.length || loading === "clear" || isSigning}
            onClick={() => setClearOpen(true)}
            size="sm"
            type="button"
            variant="destructive"
          >
            <Trash2Icon className="size-4" />
            Clear
          </Button>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Signals" value={String(stats.total)} />
        <MetricCard label="On-chain proofs" value={String(stats.anchored)} />
        <MetricCard label="Tool evidence" value={String(stats.sourceCount)} />
        <MetricCard label="Source gaps" value={String(stats.gapCount)} />
      </section>

      {!isConnected && (
        <Alert>
          <AlertCircleIcon className="size-4" />
          <AlertTitle>Connect wallet</AlertTitle>
          <AlertDescription>
            Alpha Watchlist is saved to Supabase per wallet. Connect a wallet
            to load saved signals.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon className="size-4" />
          <AlertTitle>Watchlist unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loaded && isConnected && !items.length && (
        <Alert>
          <AlertCircleIcon className="size-4" />
          <AlertTitle>No alpha signals saved yet</AlertTitle>
          <AlertDescription>
            Run Sui Intelligence in chat, then add the strongest result to
            this watchlist.
          </AlertDescription>
        </Alert>
      )}

      <section className="grid gap-4">
        {items.map((item) => (
          <Card className="rounded-lg" key={item.id} size="sm">
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2">
                <BookmarkIcon className="size-4 text-muted-foreground" />
                {item.sessionId ? (
                  <Link
                    className="break-words transition-colors hover:text-primary"
                    href={chatSessionHref(item.sessionId)}
                  >
                    {item.title}
                  </Link>
                ) : (
                  <span className="break-words">{item.title}</span>
                )}
              </CardTitle>
              <CardDescription className="break-words">
                {item.sessionId ? (
                  <Link
                    className="transition-colors hover:text-foreground"
                    href={chatSessionHref(item.sessionId)}
                  >
                    {item.subject}
                  </Link>
                ) : (
                  item.subject
                )}
              </CardDescription>
              <CardAction>
                <Button
                  aria-label={`Remove ${item.title}`}
                  disabled={loading === item.id || isSigning}
                  onClick={() => void handleRemove(item)}
                  size="icon-sm"
                  type="button"
                  variant="ghost"
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{item.chain}</Badge>
                <Badge variant="outline">{item.signalType}</Badge>
                <Badge variant={item.status === "watching" ? "secondary" : "outline"}>
                  {formatWatchlistStatus(item.status)}
                </Badge>
                <Badge variant={item.priority === "high" ? "destructive" : "outline"}>
                  {item.priority} priority
                </Badge>
                <Badge variant={item.gapCount ? "outline" : "secondary"}>
                  {item.sourceCount} source{item.sourceCount === 1 ? "" : "s"}
                </Badge>
                <Badge
                  className={
                    item.proofTx || item.decisionId
                      ? "border-success-foreground/25 bg-success/40 text-success-foreground"
                      : ""
                  }
                  variant={item.proofTx || item.decisionId ? "secondary" : "outline"}
                >
                  {item.proofTx || item.decisionId ? "proof anchored" : "local signal"}
                </Badge>
              </div>

              <div className="grid gap-3 lg:grid-cols-[1fr_0.8fr]">
                <div className="space-y-2">
                  <p className="break-words text-sm">{item.summary}</p>
                  <p className="break-words text-muted-foreground text-sm">
                    {item.recommendation}
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 bg-secondary/20 p-3 text-sm">
                  <Detail label="Added" value={formatDate(item.addedAt)} />
                  <Detail label="Intent" value={item.intent} />
                  <Detail label="Decision ID" value={item.decisionId} />
                  <Detail label="Tx" value={shortHash(item.proofTx)} />
                  <Detail label="Agent" value={item.agentId} />
                  <Detail label="Chat" value={shortHash(item.sessionId)} />
                  <Detail
                    label="Reviewed"
                    value={item.reviewedAt ? formatDate(item.reviewedAt) : undefined}
                  />
                  <Detail
                    label="Snoozed until"
                    value={
                      item.snoozedUntil
                        ? formatDate(item.snoozedUntil)
                        : undefined
                    }
                  />
                </div>
              </div>

              {item.note && (
                <div className="border-l-2 border-primary/40 pl-3">
                  <p className="font-medium text-xs uppercase text-muted-foreground">
                    Note / thesis
                  </p>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm">
                    {item.note}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={loading === `rerun-${item.id}` || isSigning}
                  onClick={() => void handleRerunResearch(item)}
                  size="sm"
                  type="button"
                  variant="default"
                >
                  {loading === `rerun-${item.id}` ? (
                    <Loader2Icon className="size-4 animate-spin" />
                  ) : (
                    <RefreshCcwIcon className="size-4" />
                  )}
                  Re-run research
                </Button>
                <Button
                  disabled={loading === `automation-${item.id}` || isSigning}
                  onClick={() => setAutomationItem(item)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <BotIcon className="size-4" />
                  Create task
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href={strategyHref(item)}>
                    <FlaskConicalIcon className="size-4" />
                    Strategy Lab
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      disabled={loading === `update-${item.id}` || isSigning}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      {item.status === "snoozed" ? (
                        <AlarmClockIcon className="size-4" />
                      ) : (
                        <CheckCircle2Icon className="size-4" />
                      )}
                      {formatWatchlistStatus(item.status)}
                      <ChevronDownIcon className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-52">
                    <DropdownMenuLabel>Review status</DropdownMenuLabel>
                    <DropdownMenuItem
                      onSelect={() =>
                        void handleUpdateMetadata(
                          item,
                          { status: "watching" },
                          "Signal restored to watching",
                        )
                      }
                    >
                      <BookmarkIcon />
                      Watching
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() =>
                        void handleUpdateMetadata(
                          item,
                          { status: "reviewed" },
                          "Signal marked reviewed",
                        )
                      }
                    >
                      <CheckCircle2Icon />
                      Mark reviewed
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={() =>
                        void handleUpdateMetadata(
                          item,
                          {
                            snoozedUntil: addDaysIso(1),
                            status: "snoozed",
                          },
                          "Signal snoozed for 1 day",
                        )
                      }
                    >
                      <AlarmClockIcon />
                      Snooze 1 day
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() =>
                        void handleUpdateMetadata(
                          item,
                          {
                            snoozedUntil: addDaysIso(7),
                            status: "snoozed",
                          },
                          "Signal snoozed for 7 days",
                        )
                      }
                    >
                      <AlarmClockIcon />
                      Snooze 7 days
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() =>
                        void handleUpdateMetadata(
                          item,
                          { status: "stale" },
                          "Signal marked stale",
                        )
                      }
                    >
                      <AlertCircleIcon />
                      Mark stale
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  disabled={loading === `update-${item.id}` || isSigning}
                  onClick={() => setNoteItem(item)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <NotebookPenIcon className="size-4" />
                  Note / thesis
                </Button>
                {item.sessionId && (
                  <Button asChild size="sm" variant="default">
                    <Link href={chatSessionHref(item.sessionId)}>
                      <MessageCircleIcon className="size-4" />
                      Open chat
                    </Link>
                  </Button>
                )}
                {item.explorerUrl && (
                  <Button asChild size="sm" variant="outline">
                    <a href={item.explorerUrl} rel="noreferrer" target="_blank">
                      <ExternalLinkIcon className="size-4" />
                      Open proof
                    </a>
                  </Button>
                )}
                <Button asChild size="sm" variant="ghost">
                  <Link href="/proofs">
                    <ShieldCheckIcon className="size-4" />
                    Proof Center
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
      <AutomationTaskDialog
        item={automationItem}
        key={automationItem?.id ?? "automation-dialog"}
        loading={
          automationItem
            ? loading === `automation-${automationItem.id}`
            : false
        }
        onClose={() => setAutomationItem(null)}
        onSubmit={handleCreateAutomation}
      />
      <WatchlistNoteDialog
        item={noteItem}
        key={noteItem?.id ?? "note-dialog"}
        loading={noteItem ? loading === `update-${noteItem.id}` : false}
        onClose={() => setNoteItem(null)}
        onSubmit={handleSaveNote}
      />
      <ClearWatchlistDialog
        loading={loading === "clear"}
        onConfirm={() => void handleClear()}
        onOpenChange={setClearOpen}
        open={clearOpen}
      />
      {telegramDialog}
    </div>
  );
}

type AutomationDraft = {
  name: string;
  prompt: string;
  scheduleFrequency: AutomationFrequency;
  scheduleTime: string;
  status: "active" | "draft";
};

function AutomationTaskDialog({
  item,
  loading,
  onClose,
  onSubmit,
}: {
  item: AlphaWatchlistItem | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (item: AlphaWatchlistItem, draft: AutomationDraft) => Promise<void>;
}) {
  const [draft, setDraft] = useState<AutomationDraft>(() =>
    buildAutomationDraft(item),
  );

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open && !loading) {
          onClose();
        }
      }}
      open={Boolean(item)}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create automation task</DialogTitle>
          <DialogDescription>
            Turn this saved signal into a recurring Sui monitor.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();

            if (item) {
              void onSubmit(item, draft);
            }
          }}
        >
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">Task name</span>
            <Input
              autoFocus
              maxLength={120}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  name: event.currentTarget.value,
                }))
              }
              required
              value={draft.name}
            />
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">Monitor prompt</span>
            <Textarea
              className="min-h-28"
              maxLength={2_000}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  prompt: event.currentTarget.value,
                }))
              }
              required
              value={draft.prompt}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">Frequency</span>
              <Select
                onValueChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    scheduleFrequency: value as AutomationFrequency,
                  }))
                }
                value={draft.scheduleFrequency}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">Run time</span>
              <Input
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    scheduleTime: event.currentTarget.value,
                  }))
                }
                type="time"
                value={draft.scheduleTime}
              />
            </label>
          </div>
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">Initial status</span>
            <Select
              onValueChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  status: value as AutomationDraft["status"],
                }))
              }
              value={draft.status}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </label>
          <DialogFooter>
            <DialogClose asChild>
              <Button disabled={loading} type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button disabled={loading || !draft.name.trim()} type="submit">
              {loading ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <BotIcon className="size-4" />
              )}
              Create task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function WatchlistNoteDialog({
  item,
  loading,
  onClose,
  onSubmit,
}: {
  item: AlphaWatchlistItem | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (
    item: AlphaWatchlistItem,
    note: string,
    priority: AlphaWatchlistPriority,
  ) => Promise<void>;
}) {
  const [note, setNote] = useState(item?.note ?? "");
  const [priority, setPriority] =
    useState<AlphaWatchlistPriority>(item?.priority ?? "medium");

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open && !loading) {
          onClose();
        }
      }}
      open={Boolean(item)}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Note / thesis</DialogTitle>
          <DialogDescription>
            Record why this signal matters and how urgently it needs follow-up.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();

            if (item) {
              void onSubmit(item, note, priority);
            }
          }}
        >
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">Priority</span>
            <Select
              onValueChange={(value) =>
                setPriority(value as AlphaWatchlistPriority)
              }
              value={priority}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">Thesis</span>
            <Textarea
              autoFocus
              className="min-h-36"
              maxLength={8_000}
              onChange={(event) => setNote(event.currentTarget.value)}
              placeholder="Why this signal deserves follow-up..."
              value={note}
            />
          </label>
          <DialogFooter>
            <DialogClose asChild>
              <Button disabled={loading} type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button disabled={loading} type="submit">
              {loading ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <NotebookPenIcon className="size-4" />
              )}
              Save thesis
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ClearWatchlistDialog({
  loading,
  onConfirm,
  onOpenChange,
  open,
}: {
  loading: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Clear Alpha Watchlist?</DialogTitle>
          <DialogDescription>
            This permanently removes every saved signal, status, and thesis for
            the connected wallet.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button disabled={loading} type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            disabled={loading}
            onClick={onConfirm}
            type="button"
            variant="destructive"
          >
            {loading ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <Trash2Icon className="size-4" />
            )}
            Clear all signals
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function buildAutomationDraft(
  item: AlphaWatchlistItem | null,
): AutomationDraft {
  return {
    name: item ? `Monitor: ${item.title}`.slice(0, 120) : "",
    prompt: item ? getWatchlistPrompt(item) : "",
    scheduleFrequency: "daily",
    scheduleTime: "09:00",
    status: "active",
  };
}

function getWatchlistPrompt(item: AlphaWatchlistItem) {
  return (
    item.sourcePrompt?.trim() ||
    [
      `Re-run Sui research for: ${item.title}.`,
      `Subject: ${item.subject}.`,
      `Intent: ${item.intent}.`,
      "Validate current evidence, source gaps, and whether this watchlist signal still holds.",
    ].join(" ")
  );
}

function formatWatchlistStatus(status: AlphaWatchlistStatus) {
  const labels: Record<AlphaWatchlistStatus, string> = {
    reviewed: "Reviewed",
    snoozed: "Snoozed",
    stale: "Stale",
    watching: "Watching",
  };

  return labels[status];
}

function addDaysIso(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1_000).toISOString();
}

function strategyHref(item: AlphaWatchlistItem) {
  const params = new URLSearchParams({
    chain: isProductChainId(item.chain) ? item.chain : defaultProductChain,
    source: "watchlist",
  });
  const pairAddress = item.subject.match(/0x[0-9a-f]{2,64}/i)?.[0];

  if (pairAddress) {
    params.set("pair", pairAddress);
  }

  return `/strategy?${params.toString()}`;
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="rounded-lg" size="sm">
      <CardHeader>
        <CardDescription className="text-xs uppercase tracking-wide">
          {label}
        </CardDescription>
        <CardTitle className="font-serif text-2xl tracking-tight">
          {value}
        </CardTitle>
      </CardHeader>
    </Card>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 py-0.5">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate font-medium font-mono text-xs">
        {value || "Not available"}
      </span>
    </div>
  );
}

function shortHash(value?: string) {
  return value && value.length > 16
    ? `${value.slice(0, 10)}...${value.slice(-6)}`
    : value;
}

function formatDate(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function chatSessionHref(sessionId: string) {
  return `/chat/${encodeURIComponent(sessionId)}`;
}

async function hydrateWatchlistItemsWithChatSessions(
  wallet: WalletAuth,
  items: AlphaWatchlistItem[],
) {
  const hydratedItems = items.map(hydrateAlphaWatchlistSession);
  const missingIds = new Set(
    hydratedItems.filter((item) => !item.sessionId).map((item) => item.id),
  );

  if (!missingIds.size) {
    return hydratedItems;
  }

  try {
    const sessions = await listChatSessions(wallet);
    const matchedSessions = new Map<string, string>();

    for (const sessionSummary of sessions) {
      const session = await getChatSession(wallet, sessionSummary.id);

      for (const message of session?.messages ?? []) {
        const onChainPayloads = [
          message.onChain,
          message.result?.onChain,
        ].filter(
          (payload): payload is OnChainToolFinalPayload => Boolean(payload),
        );

        for (const payload of onChainPayloads) {
          const candidate = buildAlphaWatchlistItem(payload, {
            sessionId: sessionSummary.id,
          });

          if (!missingIds.has(candidate.id)) {
            continue;
          }

          rememberAlphaWatchlistSession(candidate.id, sessionSummary.id);
          matchedSessions.set(candidate.id, sessionSummary.id);
          missingIds.delete(candidate.id);
        }
      }

      if (!missingIds.size) {
        break;
      }
    }

    return hydratedItems.map((item) => {
      const sessionId = matchedSessions.get(item.id);
      return sessionId ? { ...item, sessionId } : item;
    });
  } catch {
    return hydratedItems;
  }
}
