import { defineConfig, devices } from "@playwright/test";
import baseConfig from "./playwright.config";

// The PWA lane: the same host, build, and isolation contract as the default no-agent suite, but
// with service workers allowed (the default suite blocks them) and only pwa.spec.ts selected.
// `bun run e2e:pwa`.
const { serviceWorkers: _blocked, ...baseUse } = baseConfig.use ?? {};

export default defineConfig({
	...baseConfig,
	// The base config ignores pwa.spec.ts (it only runs with service workers allowed); this lane is
	// the exception, so its ignore list drops that entry.
	testIgnore: ["workflows/**"],
	testMatch: ["pwa.spec.ts"],
	use: { ...baseUse },
	projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
