"use client";

import { useEffect, useMemo, useState } from "react";
import { BookmarkCheckIcon, BookmarkPlusIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  LANGCLAW_ALPHA_WATCHLIST_UPDATED_EVENT,
  buildAlphaWatchlistItem,
  dispatchAlphaWatchlistUpdated,
  rememberAlphaWatchlistSession,
} from "@/lib/alpha-watchlist";
import { useWalletSession } from "@/hooks/use-wallet-session";
import {
  isWalletSignatureRequiredError,
  listAlphaWatchlist,
  readFriendlyError,
  type OnChainToolFinalPayload,
  upsertAlphaWatchlistItem,
} from "@/lib/langclaw-api";
import { cn } from "@/lib/utils";

type AlphaWatchlistButtonProps = {
  className?: string;
  payload: OnChainToolFinalPayload;
  sessionId?: string;
  sourcePrompt?: string;
};

export function AlphaWatchlistButton({
  className,
  payload,
  sessionId,
  sourcePrompt,
}: AlphaWatchlistButtonProps) {
  const {
    clearWalletAuth,
    getWalletAuth,
    hasCachedWalletAuth,
    isConnected,
    isSigning,
    openWalletModal,
  } = useWalletSession();
  const watchlistItem = useMemo(
    () => buildAlphaWatchlistItem(payload, { sessionId, sourcePrompt }),
    [payload, sessionId, sourcePrompt],
  );
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [isSavingWatchlist, setIsSavingWatchlist] = useState(false);

  useEffect(() => {
    let active = true;

    const syncWatchlistState = async () => {
      if (!isConnected || !hasCachedWalletAuth) {
        setIsWatchlisted(false);
        return;
      }

      try {
        const wallet = await getWalletAuth();
        const items = await listAlphaWatchlist(wallet);

        if (active) {
          setIsWatchlisted(items.some((item) => item.id === watchlistItem.id));
        }
      } catch {
        if (active) {
          setIsWatchlisted(false);
        }
      }
    };

    void syncWatchlistState();
    window.addEventListener(
      LANGCLAW_ALPHA_WATCHLIST_UPDATED_EVENT,
      syncWatchlistState,
    );

    return () => {
      active = false;
      window.removeEventListener(
        LANGCLAW_ALPHA_WATCHLIST_UPDATED_EVENT,
        syncWatchlistState,
      );
    };
  }, [getWalletAuth, hasCachedWalletAuth, isConnected, watchlistItem.id]);

  const handleAddToWatchlist = async () => {
    if (isWatchlisted) {
      return;
    }

    if (!isConnected) {
      openWalletModal();
      toast.error("Connect your wallet to save the watchlist.");
      return;
    }

    setIsSavingWatchlist(true);

    try {
      const wallet = await getWalletAuth();
      await upsertAlphaWatchlistItem(wallet, watchlistItem);
      rememberAlphaWatchlistSession(watchlistItem.id, sessionId);
      setIsWatchlisted(true);
      dispatchAlphaWatchlistUpdated();
      toast.success("Watchlist added", {
        description: payload.title,
      });
    } catch (error) {
      if (isWalletSignatureRequiredError(error)) {
        clearWalletAuth();
      }

      toast.error(readFriendlyError(error, "Unable to save watchlist item."));
    } finally {
      setIsSavingWatchlist(false);
    }
  };

  return (
    <Button
      className={cn("self-start", className)}
      disabled={isWatchlisted || isSavingWatchlist || isSigning}
      onClick={() => void handleAddToWatchlist()}
      size="sm"
      type="button"
      variant={isWatchlisted ? "secondary" : "outline"}
    >
      {isWatchlisted ? (
        <BookmarkCheckIcon className="size-4" />
      ) : (
        <BookmarkPlusIcon className="size-4" />
      )}
      {isWatchlisted
        ? "Watchlist added"
        : isSavingWatchlist
          ? "Saving..."
          : "Add to watchlist"}
    </Button>
  );
}
