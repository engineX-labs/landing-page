import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

const PORT = 4330;
export const E2E_CONTACTS_DIR = path.resolve("test-results/e2e-contacts");
export const E2E_WHATSAPP_NUMBER = "5491100000000";

// Corre contra el build de producción con el adapter Node, como en un deploy real.
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    channel: "chrome",
    trace: "retain-on-failure",
  },
  projects: [{ name: "desktop", use: { ...devices["Desktop Chrome"], channel: "chrome" } }],
  webServer: {
    command: "npx astro build && node ./dist/server/entry.mjs",
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      HOST: "127.0.0.1",
      PORT: String(PORT),
      CONTACTS_DIR: E2E_CONTACTS_DIR,
      WHATSAPP_NUMBER: E2E_WHATSAPP_NUMBER,
    },
  },
});
