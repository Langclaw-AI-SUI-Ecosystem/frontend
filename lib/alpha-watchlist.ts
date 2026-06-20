import type {
  AlphaWatchlistItem,
  OnChainToolFinalPayload,
} from "@/lib/langclaw-api";

export type { AlphaWatchlistItem };

export const LANGCLAW_ALPHA_WATCHLIST_UPDATED_EVENT =
  "langclaw-alpha-watchlist-updated";
const ALPHA_WATCHLIST_SESSION_STORAGE_KEY =
  "langclaw.alphaWatchlist.sessions.v1";

export function buildAlphaWatchlistItem(
  payload: OnChainToolFinalPayload,
  options: { sessionId?: string; sourcePrompt?: string } = {},
): AlphaWatchlistItem {
  const chainProof = payload.proof?.chain;
  const successfulTools = payload.tools.filter(
    (tool) => tool.status === "success",
  );
  const failedTools = payload.tools.filter((tool) => tool.status === "failed");
  const subject =
    payload.plan.tokenAddress ||
    payload.plan.walletAddress ||
    payload.plan.query ||
    payload.plan.intent;
  const proofAnchor =
    chainProof?.txHash || chainProof?.decisionId || chainProof?.decisionHash;
  const id = proofAnchor
    ? `proof:${proofAnchor}`
    : `signal:${stableHash([payload.generatedAt, payload.title, subject].join("|"))}`;

  return {
    addedAt: new Date().toISOString(),
    agentId: chainProof?.agentId,
    caveat: payload.caveat,
    chain: payload.plan.chain,
    decisionHash: chainProof?.decisionHash,
    decisionId: chainProof?.decisionId,
    evidenceUri: payload.proof?.storage.evidenceUri,
    explorerUrl: chainProof?.explorerUrl,
    gapCount: failedTools.length,
    id,
    intent: payload.plan.intent,
    priority: "medium",
    proofTx: chainProof?.txHash,
    recommendation: payload.recommendation,
    sessionId: options.sessionId,
    signalType: chainProof?.signalType || inferSignalType(payload),
    sourcePrompt: options.sourcePrompt,
    sourceCount: successfulTools.length,
    status: "watching",
    subject,
    summary: payload.answer || payload.bullets[0] || payload.title,
    title: payload.title,
  };
}

export function dispatchAlphaWatchlistUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(LANGCLAW_ALPHA_WATCHLIST_UPDATED_EVENT));
}

export function hydrateAlphaWatchlistSession(
  item: AlphaWatchlistItem,
): AlphaWatchlistItem {
  if (item.sessionId) {
    rememberAlphaWatchlistSession(item.id, item.sessionId);
    return item;
  }

  const sessionId = readAlphaWatchlistSession(item.id);

  return sessionId ? { ...item, sessionId } : item;
}

export function rememberAlphaWatchlistSession(
  itemId: string,
  sessionId?: string,
) {
  if (!sessionId || typeof window === "undefined") {
    return;
  }

  const sessions = readAlphaWatchlistSessionMap();
  sessions[itemId] = sessionId;
  writeAlphaWatchlistSessionMap(sessions);
}

export function forgetAlphaWatchlistSession(itemId: string) {
  if (typeof window === "undefined") {
    return;
  }

  const sessions = readAlphaWatchlistSessionMap();
  delete sessions[itemId];
  writeAlphaWatchlistSessionMap(sessions);
}

export function clearAlphaWatchlistSessions() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(ALPHA_WATCHLIST_SESSION_STORAGE_KEY);
}

function inferSignalType(payload: OnChainToolFinalPayload) {
  if (payload.plan.commands.some((command) => command.domain === "smart_money")) {
    return "smart-money";
  }

  if (
    payload.plan.commands.some((command) => command.domain === "pair_liquidity")
  ) {
    return "liquidity";
  }

  if (
    payload.plan.commands.some(
      (command) => command.domain === "trading_signal_analysis",
    )
  ) {
    return "trading-signal";
  }

  return "analysis";
}

function readAlphaWatchlistSession(itemId: string) {
  return readAlphaWatchlistSessionMap()[itemId];
}

function readAlphaWatchlistSessionMap() {
  if (typeof window === "undefined") {
    return {} as Record<string, string>;
  }

  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(ALPHA_WATCHLIST_SESSION_STORAGE_KEY) || "{}",
    );

    return typeof parsed === "object" && parsed
      ? (parsed as Record<string, string>)
      : {};
  } catch {
    return {};
  }
}

function writeAlphaWatchlistSessionMap(sessions: Record<string, string>) {
  window.localStorage.setItem(
    ALPHA_WATCHLIST_SESSION_STORAGE_KEY,
    JSON.stringify(sessions),
  );
}

function stableHash(value: string) {
  let hash = 5381;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }

  return (hash >>> 0).toString(16);
}
