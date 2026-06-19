import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(testDir, "..");
const appSidebarSource = readFileSync(
  path.join(frontendRoot, "components/app-sidebar.tsx"),
  "utf8",
);
const memoryPageSource = readFileSync(
  path.join(frontendRoot, "app/(user)/memory/page.tsx"),
  "utf8",
);
const apiSource = readFileSync(
  path.join(frontendRoot, "lib/langclaw-api.ts"),
  "utf8",
);

test("mobile sidebar closes for route and saved-session navigation", () => {
  assert.ok(
    appSidebarSource.includes("const { setOpenMobile } = useSidebar()") &&
      appSidebarSource.includes("closeMobileSidebar();") &&
      appSidebarSource.includes("window.setTimeout(onNavigate, 0)") &&
      !appSidebarSource.includes("onClick={onNavigate}"),
    "Expected Next.js click handling to finish before the mobile sidebar closes.",
  );
});

test("chat dialogs render outside the responsive sidebar copies", () => {
  const sidebarClose = appSidebarSource.indexOf("</Sidebar>");
  const firstDialog = appSidebarSource.indexOf("<Dialog", sidebarClose);

  assert.ok(sidebarClose > 0, "Expected AppSidebar to close Sidebar.");
  assert.ok(
    firstDialog > sidebarClose,
    "Expected controlled dialogs outside the duplicated responsive sidebar tree.",
  );
});

test("memory summary distinguishes Walrus records from recall notes", () => {
  assert.ok(
    memoryPageSource.includes('label: "Walrus records"') &&
      memoryPageSource.includes("value: stats.verifiable") &&
      memoryPageSource.includes('label: "Recall notes"'),
    "Expected separate Walrus proof and recall-note summary cards.",
  );
  assert.ok(
    apiSource.includes("response.stats?.verifiable ?? verifiableMemories.length"),
    "Expected compatibility with backends that predate the verifiable stat.",
  );
});
