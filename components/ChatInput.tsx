"use client";

import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import {
  PromptInput,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputController,
} from "@/components/ai-elements/prompt-input";
import { ButtonGroup } from "@/components/ui/button-group";
import { Suggestion } from "@/components/ai-elements/suggestion";
import { SpeechInput } from "@/components/ai-elements/speech-input";
import {
  Transcription,
  TranscriptionSegment,
} from "@/components/ai-elements/transcription";
import {
  ArrowUpRightIcon,
  BadgeCheckIcon,
  BotIcon,
  DatabaseIcon,
  KeyRoundIcon,
  MessageSquareIcon,
  RadioTowerIcon,
  SearchIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
} from "lucide-react";
import type { Experimental_TranscriptionResult } from "ai";
import { type ComponentType, useCallback, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { createChatSession, savePendingPrompt } from "@/lib/chat-utils";
import {
  dispatchChatSessionsUpdated,
  isWalletSignatureRequiredError,
  readFriendlyError,
  type ChatMode,
  upsertChatSession,
} from "@/lib/langclaw-api";
import { useWalletSession } from "@/hooks/use-wallet-session";
import {
  FIXED_CHAT_MODEL_LABEL,
  resolveChatModel,
} from "@/lib/chat-model";
import {
  isTelegramLinkRequiredError,
  useTelegramConnectGate,
} from "@/components/TelegramConnectDialog";
import { Badge } from "@/components/ui/badge";

const SUBMITTING_TIMEOUT = 200;
const STREAMING_TIMEOUT = 2000;
const CHAT_INPUT_SUGGESTIONS = [
  {
    description: "Holder flow, accumulation, and source-backed confidence.",
    label: "Smart-money flow",
    prompt: "Find smart-money accumulation on Sui",
  },
  {
    description: "Pair-level liquidity movement and source gaps.",
    label: "Liquidity anomaly",
    prompt: "Detect liquidity anomalies on Sui DEX pairs",
  },
  {
    description: "TVL, yield, and protocol momentum comparison.",
    label: "Protocol momentum",
    prompt: "Rank Sui protocols by TVL and yield momentum",
  },
];

const statusItems = [
  { icon: RadioTowerIcon, label: "Sui mainnet" },
  { icon: BotIcon, label: FIXED_CHAT_MODEL_LABEL },
  { icon: KeyRoundIcon, label: "Wallet + Telegram required" },
];

const researchContext = [
  {
    icon: DatabaseIcon,
    label: "Evidence",
    text: "Usable rows, provider traces, and source-backed findings.",
  },
  {
    icon: TriangleAlertIcon,
    label: "Source gaps",
    text: "Missing or unavailable providers stay visible to the user.",
  },
  {
    icon: BadgeCheckIcon,
    label: "Watchlist",
    text: "Promising alpha candidates can be saved for follow-up.",
  },
  {
    icon: ShieldCheckIcon,
    label: "Proof status",
    text: "Decision records appear when proof anchoring is configured.",
  },
];

type TranscriptionSegments = Experimental_TranscriptionResult["segments"];

const ChatInputSuggestions = ({ onSelect }: { onSelect: () => void }) => {
  const { textInput } = usePromptInputController();

  return (
    <div className="grid w-full gap-3 md:grid-cols-3">
      {CHAT_INPUT_SUGGESTIONS.map((suggestion) => (
        <Suggestion
          className="group/card h-full items-start justify-start rounded-xl border-border/70 px-4 py-3.5 shadow-xs hover:-translate-y-0.5 hover:shadow-sm"
          key={suggestion.label}
          onClick={(prompt) => {
            textInput.setInput(prompt);
            onSelect();
          }}
          suggestion={suggestion.prompt}
        >
          <span className="flex w-full flex-col gap-1.5">
            <span className="flex items-center justify-between gap-2">
              <span className="font-medium text-foreground text-sm">
                {suggestion.label}
              </span>
              <ArrowUpRightIcon
                aria-hidden="true"
                className="size-3.5 text-muted-foreground/60 transition-colors group-hover/card:text-primary"
              />
            </span>
            <span className="text-muted-foreground text-xs leading-5">
              {suggestion.description}
            </span>
          </span>
        </Suggestion>
      ))}
    </div>
  );
};

function ChatInputSpeechButton({
  onTranscript,
}: {
  onTranscript: (text: string) => void;
}) {
  const { textInput } = usePromptInputController();

  const handleTranscriptionChange = useCallback(
    (text: string) => {
      textInput.setInput(appendSpeechText(textInput.value, text));
      onTranscript(text);
    },
    [onTranscript, textInput],
  );

  return (
    <SpeechInput
      aria-label="Dictate prompt"
      lang="en-US"
      onTranscriptionChange={handleTranscriptionChange}
      size="icon-sm"
      variant="ghost"
    />
  );
}

function SpeechTranscriptionPreview({
  segments,
}: {
  segments: TranscriptionSegments;
}) {
  if (!segments.length) {
    return null;
  }

  return (
    <div className="border-b px-3 py-2">
      <Transcription segments={segments}>
        {(segment, index) => (
          <TranscriptionSegment
            index={index}
            key={`${segment.startSecond}-${segment.text}`}
            segment={segment}
          />
        )}
      </Transcription>
    </div>
  );
}

const ChatInput = () => {
  const router = useRouter();
  const { clearWalletAuth, isConnected, isSigning, openWalletModal } =
    useWalletSession();
  const { dialog: telegramDialog, requireTelegramLinkedWallet } =
    useTelegramConnectGate();
  const [toolMode, setToolMode] = useState<ChatMode>("chat");
  const [error, setError] = useState("");
  const [speechSegments, setSpeechSegments] = useState<TranscriptionSegments>(
    [],
  );
  const [status, setStatus] = useState<
    "submitted" | "streaming" | "ready" | "error"
  >("ready");

  const handleSpeechTranscript = useCallback((text: string) => {
    setSpeechSegments((segments) => appendTranscriptionSegment(segments, text));
  }, []);

  const handleSubmit = useCallback(
    async (message: PromptInputMessage) => {
      const text = message.text.trim();
      const hasText = Boolean(text);
      const hasAttachments = Boolean(message.files?.length);

      if (!(hasText || hasAttachments)) {
        return;
      }

      if (hasAttachments) {
        showError(
          setError,
          "File attachments are not supported by the current chat backend.",
        );
        setStatus("error");
        return;
      }

      if (!isConnected) {
        openWalletModal();
        showError(
          setError,
          "Choose a wallet to start chatting.",
        );
        setStatus("error");
        return;
      }

      setStatus("submitted");
      setError("");
      setSpeechSegments([]);

      const startSession = async (forceWalletSignature = false) => {
        const wallet = await requireTelegramLinkedWallet({
          force: forceWalletSignature,
        });
        const session = createChatSession(text);

        savePendingPrompt(session.id, {
          model: resolveChatModel(),
          researchTrend: toolMode === "research",
          text,
          toolMode,
        });

        await upsertChatSession(wallet, session);
        dispatchChatSessionsUpdated();

        return session;
      };

      try {
        const session = await startSession();
        setStatus("streaming");
        toast.success("Chat session created", {
          description:
            toolMode === "research"
              ? "Research mode is ready."
                : FIXED_CHAT_MODEL_LABEL,
        });

        setTimeout(() => {
          router.push(`/chat/${session.id}`);
        }, SUBMITTING_TIMEOUT);
      } catch (err) {
        if (isWalletSignatureRequiredError(err)) {
          try {
            clearWalletAuth();
            const session = await startSession(true);
            setStatus("streaming");
            toast.success("Wallet signature refreshed", {
              description: "Starting the chat session now.",
            });
            setTimeout(() => {
              router.push(`/chat/${session.id}`);
            }, SUBMITTING_TIMEOUT);
            return;
          } catch (retryErr) {
            showError(
              setError,
              readFriendlyError(retryErr, "Unable to start the chat session."),
            );
            setStatus("error");

            setTimeout(() => {
              setStatus("ready");
            }, STREAMING_TIMEOUT);
            return;
          }
        }

        if (isTelegramLinkRequiredError(err)) {
          setStatus("ready");
          return;
        }

        showError(
          setError,
          readFriendlyError(err, "Unable to start the chat session."),
        );
        setStatus("error");

        setTimeout(() => {
          setStatus("ready");
        }, STREAMING_TIMEOUT);
      }
    },
    [
      clearWalletAuth,
      isConnected,
      openWalletModal,
      requireTelegramLinkedWallet,
      router,
      toolMode,
    ],
  );

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-8rem)] w-full max-w-6xl flex-col justify-center gap-8 px-1 py-4">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <section className="flex min-w-0 flex-col gap-7">
          <StatusStrip />

          <div className="flex flex-col gap-4">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-accent/40 px-3 py-1 font-medium text-accent-foreground text-xs">
              <span className="size-1.5 rounded-full bg-primary" />
              Sui Intelligence
            </span>
            <h1 className="max-w-3xl text-balance font-serif font-semibold text-4xl text-foreground leading-[1.05] tracking-tight md:text-6xl">
              Ask Langclaw for{" "}
              <span className="text-primary">Sui intelligence</span>.
            </h1>
            <p className="max-w-2xl text-balance text-lg text-muted-foreground leading-8">
              Use Chat for direct answers, or switch to Research for
              source-backed evidence, source gaps, and on-chain checks.
            </p>
          </div>

          <PromptInputProvider>
            <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-background p-4 shadow-sm transition-shadow focus-within:border-primary/40 focus-within:shadow-md focus-within:ring-4 focus-within:ring-primary/10">
              <PromptInput
                className="w-full overflow-hidden"
                onSubmit={handleSubmit}
              >
                <SpeechTranscriptionPreview segments={speechSegments} />
                <PromptInputBody>
                  <PromptInputTextarea
                    className="min-h-28 text-base leading-7"
                    placeholder="Ask about smart-money flow, liquidity anomalies, or protocol momentum..."
                  />
                </PromptInputBody>
                <PromptInputFooter className="flex-wrap items-end gap-2">
                  <PromptInputTools className="flex-1 flex-wrap gap-1.5">
                    <ChatInputSpeechButton
                      onTranscript={handleSpeechTranscript}
                    />
                    <ChatModeControl onChange={setToolMode} value={toolMode} />
                  </PromptInputTools>
                  <PromptInputSubmit
                    disabled={isSigning || !isConnected}
                    status={status}
                  />
                </PromptInputFooter>
              </PromptInput>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
                  Try a Sui prompt
                </p>
                <Badge
                  className="border-primary/30 bg-accent/40 text-accent-foreground"
                  variant="outline"
                >
                  Research-ready
                </Badge>
              </div>
              <ChatInputSuggestions
                onSelect={() => setToolMode("research")}
              />
            </div>
          </PromptInputProvider>

          {error && (
            <p className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-destructive text-sm">
              <TriangleAlertIcon
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0"
              />
              <span>{error}</span>
            </p>
          )}
        </section>

        <ResearchContextPanel />
      </div>
      {telegramDialog}
    </div>
  );
};

function StatusStrip() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {statusItems.map((item) => {
        const Icon = item.icon;

        return (
          <span
            className="inline-flex items-center gap-2 font-medium text-muted-foreground text-xs"
            key={item.label}
          >
            <Icon aria-hidden="true" className="size-3.5 text-primary" />
            {item.label}
          </span>
        );
      })}
    </div>
  );
}

function ResearchContextPanel() {
  return (
    <aside className="rounded-2xl border border-border/70 bg-secondary/30 p-5 shadow-xs lg:sticky lg:top-8">
      <div className="flex flex-col gap-2">
        <p className="font-serif font-semibold text-foreground text-lg tracking-tight">
          Research returns more than a reply.
        </p>
        <p className="text-muted-foreground text-sm leading-6">
          Switch to Research when the question needs evidence, source quality,
          and a follow-up path.
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-2.5">
        {researchContext.map((item) => {
          const Icon = item.icon;

          return (
            <div
              className="flex gap-3 rounded-xl border border-border/60 bg-background p-3 transition-colors hover:border-primary/30"
              key={item.label}
            >
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent/60 text-primary">
                <Icon aria-hidden="true" className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="font-medium text-foreground text-sm">
                  {item.label}
                </p>
                <p className="mt-1 text-muted-foreground text-xs leading-5">
                  {item.text}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

function showError(setError: (message: string) => void, message: string) {
  setError(message);
  toast.error(message);
}

function ChatModeControl({
  onChange,
  value,
}: {
  onChange: (value: ChatMode) => void;
  value: ChatMode;
}) {
  const modes: Array<{
    icon: ComponentType<{ className?: string; size?: number }>;
    label: string;
    tooltip: string;
    value: ChatMode;
  }> = [
      {
        icon: MessageSquareIcon,
        label: "Chat",
        tooltip: "Chat directly with Langclaw.",
        value: "chat",
      },
      {
        icon: SearchIcon,
        label: "Research",
        tooltip:
          "Evidence-backed research that can enrich itself with on-chain checks when needed.",
        value: "research",
      },
    ];

  return (
    <ButtonGroup className="max-w-full shrink-0">
      {modes.map((mode) => {
        const Icon = mode.icon;

        return (
          <PromptInputButton
            aria-pressed={value === mode.value}
            key={mode.value}
            onClick={() => onChange(mode.value)}
            tooltip={mode.tooltip}
            type="button"
            variant={value === mode.value ? "default" : "ghost"}
          >
            <Icon className="size-4" />
            <span>{mode.label}</span>
          </PromptInputButton>
        );
      })}
    </ButtonGroup>
  );
}

function appendSpeechText(currentText: string, transcript: string) {
  const next = transcript.trim();

  if (!next) {
    return currentText;
  }

  return currentText.trim() ? `${currentText.trim()} ${next}` : next;
}

function appendTranscriptionSegment(
  segments: TranscriptionSegments,
  text: string,
): TranscriptionSegments {
  const transcript = text.trim();

  if (!transcript) {
    return segments;
  }

  const startSecond = segments.at(-1)?.endSecond ?? 0;
  const duration = Math.max(1, Math.ceil(transcript.split(/\s+/).length / 2));

  return [
    ...segments,
    {
      endSecond: startSecond + duration,
      startSecond,
      text: transcript,
    },
  ];
}

export default ChatInput;
