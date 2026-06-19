"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BrainCircuit,
  Database,
  ExternalLink,
  Loader2,
  LockKeyhole,
  NotebookText,
  RefreshCw,
  ShieldCheck,
  ToggleLeft,
} from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useWalletSession } from "@/hooks/use-wallet-session";
import {
  deleteManyMemoryRecords,
  deleteMemoryRecord,
  getMemoryDashboard,
  readFriendlyError,
  setManyMemoryStatuses,
  setMemoryStatus,
  type MemoryItem,
  type MemoryStats,
  type MemoryStatus,
  type VerifiableMemoryItem,
} from "@/lib/langclaw-api";
import { MemoryDataTable } from "./data-table";

export default function Page() {
  const { getWalletAuth, isConnected, isSigning, openWalletModal } =
    useWalletSession();
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [verifiableMemories, setVerifiableMemories] = useState<
    VerifiableMemoryItem[]
  >([]);
  const [backendStats, setBackendStats] = useState<MemoryStats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState("");

  const stats = useMemo(
    () =>
      backendStats ?? buildMemoryStats(memories, verifiableMemories.length),
    [backendStats, memories, verifiableMemories.length],
  );

  const statCards = useMemo(
    () => [
      {
        label: "Walrus records",
        value: stats.verifiable,
        description: "Encrypted research proofs",
        icon: Database,
      },
      {
        label: "Recall notes",
        value: stats.total,
        description: "Reusable across chats",
        icon: NotebookText,
      },
      {
        label: "Active",
        value: stats.active,
        description: "Available for recall",
        icon: BrainCircuit,
      },
      {
        label: "Project scoped",
        value: stats.projectScoped,
        description: "Attached to workspaces",
        icon: ShieldCheck,
      },
      {
        label: "Disabled",
        value: stats.disabled,
        description: "Kept but not reused",
        icon: ToggleLeft,
      },
    ],
    [stats],
  );

  const loadMemories = useCallback(async () => {
    if (!isConnected) {
      setMemories([]);
      setVerifiableMemories([]);
      setBackendStats(null);
      setError("");
      return;
    }

    setLoading("load");
    setError("");

    try {
      const wallet = await getWalletAuth();
      const dashboard = await getMemoryDashboard(wallet);
      setMemories(dashboard.memories);
      setVerifiableMemories(dashboard.verifiableMemories);
      setBackendStats(dashboard.stats);
    } catch (err) {
      const message = readFriendlyError(err, "Unable to load memories.");
      setError(message);
      toast.error(message);
    } finally {
      setLoading("");
    }
  }, [getWalletAuth, isConnected]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadMemories();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadMemories]);

  const requireWallet = useCallback(async () => {
    if (!isConnected) {
      openWalletModal();
      throw new Error("Choose a wallet to manage memories.");
    }

    return getWalletAuth();
  }, [getWalletAuth, isConnected, openWalletModal]);

  const handleStatusChange = useCallback(
    async (memory: MemoryItem, status: MemoryStatus) => {
      setLoading(`status:${memory.id}`);
      setError("");

      try {
        const wallet = await requireWallet();
        const updated = await setMemoryStatus(wallet, memory.id, status);
        setMemories((current) =>
          current.map((item) => (item.id === updated.id ? updated : item)),
        );
        setBackendStats(null);
        toast.success(status === "active" ? "Memory enabled" : "Memory disabled");
      } catch (err) {
        const message = readFriendlyError(err, "Unable to update memory.");
        setError(message);
        toast.error(message);
      } finally {
        setLoading("");
      }
    },
    [requireWallet],
  );

  const handleStatusChangeMany = useCallback(
    async (memoryIds: string[], status: MemoryStatus) => {
      if (!memoryIds.length) {
        return;
      }

      setLoading("bulk-status");
      setError("");

      try {
        const wallet = await requireWallet();
        const updated = await setManyMemoryStatuses(wallet, memoryIds, status);
        const updatedById = new Map(updated.map((memory) => [memory.id, memory]));

        setMemories((current) =>
          current.map((memory) => updatedById.get(memory.id) ?? memory),
        );
        setBackendStats(null);
        toast.success("Selected memories updated");
      } catch (err) {
        const message = readFriendlyError(err, "Unable to update memories.");
        setError(message);
        toast.error(message);
      } finally {
        setLoading("");
      }
    },
    [requireWallet],
  );

  const handleDelete = useCallback(
    async (memory: MemoryItem) => {
      setLoading(`delete:${memory.id}`);
      setError("");

      try {
        const wallet = await requireWallet();
        const deletedIds = await deleteMemoryRecord(wallet, memory.id);
        const deletedSet = new Set(deletedIds);
        setMemories((current) =>
          current.filter((item) => !deletedSet.has(item.id)),
        );
        setBackendStats(null);
        toast.success("Memory deleted");
      } catch (err) {
        const message = readFriendlyError(err, "Unable to delete memory.");
        setError(message);
        toast.error(message);
      } finally {
        setLoading("");
      }
    },
    [requireWallet],
  );

  const handleDeleteMany = useCallback(
    async (memoryIds: string[]) => {
      if (!memoryIds.length) {
        return;
      }

      setLoading("bulk-delete");
      setError("");

      try {
        const wallet = await requireWallet();
        const deletedIds = await deleteManyMemoryRecords(wallet, memoryIds);
        const deletedSet = new Set(deletedIds);
        setMemories((current) =>
          current.filter((item) => !deletedSet.has(item.id)),
        );
        setBackendStats(null);
        toast.success("Selected memories deleted");
      } catch (err) {
        const message = readFriendlyError(err, "Unable to delete memories.");
        setError(message);
        toast.error(message);
      } finally {
        setLoading("");
      }
    },
    [requireWallet],
  );

  const busy = Boolean(loading) || isSigning;

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-3">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-accent/40 px-3 py-1 font-medium text-accent-foreground text-xs">
            <span className="size-1.5 rounded-full bg-primary" />
            Memory
          </span>
          <p className="max-w-2xl text-balance font-serif text-foreground text-xl leading-8 tracking-tight">
            Inspect private research memories stored on Walrus, protected by
            Seal, and anchored on Sui. Recall preferences remain manageable below.
          </p>
        </div>

        <Button
          disabled={loading === "load"}
          onClick={() => void loadMemories()}
          variant="outline"
        >
          {loading === "load" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          Refresh
        </Button>
      </section>

      {!isConnected && (
        <Alert>
          <AlertCircle className="size-4" />
          <AlertTitle>Wallet required</AlertTitle>
          <AlertDescription>
            Choose a wallet to load and manage saved memories.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Something needs attention</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card key={stat.label} size="sm">
              <CardHeader className="flex flex-row items-center justify-between gap-3">
                <div>
                  <CardTitle>{stat.label}</CardTitle>
                  <CardDescription>{stat.description}</CardDescription>
                </div>
                <Icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="font-serif font-semibold text-3xl tracking-tight">
                  {stat.value}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="font-serif font-semibold text-foreground text-lg tracking-tight">
            Verifiable Walrus memory
          </h2>
          <p className="text-sm text-muted-foreground">
            Each record links encrypted storage to its content hash and Sui proof.
          </p>
        </div>

        {verifiableMemories.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {verifiableMemories.map((memory) => (
              <Card
                className={
                  memory.suiTxUrl
                    ? "border-success-foreground/25 bg-success/6"
                    : ""
                }
                key={memory.id}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="truncate font-serif tracking-tight">
                        {memory.topic}
                      </CardTitle>
                      <CardDescription>
                        {new Date(memory.createdAt).toLocaleString()}
                      </CardDescription>
                    </div>
                    <LockKeyhole
                      className={`size-4 shrink-0 ${
                        memory.suiTxUrl
                          ? "text-success-foreground"
                          : "text-muted-foreground"
                      }`}
                    />
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 text-sm">
                  <ProofValue label="Walrus blob" value={memory.walrusBlobId} />
                  <ProofValue label="Content hash" value={memory.contentHash} />
                  <ProofValue label="Seal policy" value={memory.sealPolicyId} />
                  <div className="flex flex-wrap gap-2">
                    {memory.walrusBlobUrl && (
                      <Button asChild size="sm" variant="outline">
                        <a href={memory.walrusBlobUrl} rel="noreferrer" target="_blank">
                          Open Walrus <ExternalLink className="size-3" />
                        </a>
                      </Button>
                    )}
                    {memory.suiTxUrl && (
                      <Button
                        asChild
                        className="border-success-foreground/25 bg-success/20 text-success-foreground hover:bg-success/40"
                        size="sm"
                        variant="outline"
                      >
                        <a href={memory.suiTxUrl} rel="noreferrer" target="_blank">
                          Verify on Sui <ExternalLink className="size-3" />
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground">
              No private research memory exists for this wallet yet. Run a research
              task to create the first encrypted Walrus record.
            </CardContent>
          </Card>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="font-serif font-semibold text-foreground text-lg tracking-tight">
            Recall preferences
          </h2>
          <p className="text-sm text-muted-foreground">
            Control the account-level notes that guide future conversations.
          </p>
        </div>

        <MemoryDataTable
          data={memories}
          disabled={!isConnected || busy}
          onDelete={handleDelete}
          onDeleteMany={handleDeleteMany}
          onStatusChange={handleStatusChange}
          onStatusChangeMany={handleStatusChangeMany}
        />
      </section>
    </div>
  );
}

function ProofValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
        {label}
      </span>
      <code className="overflow-hidden text-ellipsis rounded-md border border-border/60 bg-secondary/40 px-2 py-1 font-mono text-xs">
        {value}
      </code>
    </div>
  );
}

function buildMemoryStats(
  memories: MemoryItem[],
  verifiable = 0,
): MemoryStats {
  return {
    active: memories.filter((memory) => memory.status === "active").length,
    disabled: memories.filter((memory) => memory.status === "disabled").length,
    projectScoped: memories.filter((memory) => memory.scope !== "Global").length,
    total: memories.length,
    verifiable,
  };
}
