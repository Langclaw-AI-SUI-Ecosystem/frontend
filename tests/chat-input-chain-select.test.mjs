import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const chatInputPath = path.resolve(testDir, "../components/ChatInput.tsx");
const chatPagePath = path.resolve(testDir, "../components/Chat.tsx");

test("ChatInput prompt input omits the chain selector", () => {
  const source = readFileSync(chatInputPath, "utf8");

  assert.ok(
    !source.includes("<ChainSelect"),
    "Expected ChatInput prompt input to omit the chain selector.",
  );
});

test("Chat session prompt input omits the chain selector", () => {
  const source = readFileSync(chatPagePath, "utf8");

  assert.ok(
    !source.includes("<ChainSelect"),
    "Expected the chat session prompt input to omit the chain selector.",
  );
});

test("ChatInput quick prompts automatically select Research mode", () => {
  const source = readFileSync(chatInputPath, "utf8");

  assert.ok(
    source.includes('onSelect={() => setToolMode("research")}') &&
      source.includes("onSelect();"),
    "Expected every quick prompt to fill the input and select Research mode.",
  );
});
