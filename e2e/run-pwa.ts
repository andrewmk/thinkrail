import { REAL_CENTRAL_E2E_ENV } from "./fixtures/centralAgent";
import { holdE2eIdleSleep } from "./idleSleep";
import {
	PARENT_SIGNAL_OWNER_ENV,
	processRunnerInterruption,
	runE2eProcess,
	signalExitCode,
} from "./processRunner";
import { parseRunnerArgs } from "./shardPlan";

const PWA_PLAYWRIGHT_CONFIG = "e2e/playwright.pwa.config.ts";
const bun = process.execPath;

function elapsed(startedAt: number): string {
	return `${((performance.now() - startedAt) / 1000).toFixed(1)}s`;
}

async function run(command: string[], env: NodeJS.ProcessEnv = process.env): Promise<number> {
	return (await runE2eProcess(command, { env })).exitCode;
}

async function main(): Promise<number> {
	await holdE2eIdleSleep();
	const { playwrightArgs } = parseRunnerArgs(process.argv.slice(2));
	if (!playwrightArgs.includes("--list") && process.env.THINKRAIL_E2E_SKIP_BUILD !== "1") {
		const buildStartedAt = performance.now();
		console.log("E2E (PWA): building web once before host startup");
		const buildCode = await run([bun, "run", "build:web"]);
		if (buildCode !== 0) return buildCode;
		console.log(`E2E (PWA): web build ready in ${elapsed(buildStartedAt)}`);
	}
	const env: NodeJS.ProcessEnv = { ...process.env, THINKRAIL_E2E_SKIP_BUILD: "1" };
	delete env.THINKRAIL_E2E_LANE;
	delete env.PLAYWRIGHT_BLOB_OUTPUT_FILE;
	delete env[REAL_CENTRAL_E2E_ENV];
	delete env[PARENT_SIGNAL_OWNER_ENV];
	const startedAt = performance.now();
	const code = await run(
		[bun, "x", "playwright", "test", "-c", PWA_PLAYWRIGHT_CONFIG, ...playwrightArgs],
		env,
	);
	const interruption = processRunnerInterruption();
	if (interruption) return signalExitCode(interruption);
	console.log(
		code === 0
			? `E2E (PWA): passed in ${elapsed(startedAt)}`
			: `E2E (PWA): failed (${code}) after ${elapsed(startedAt)}`,
	);
	return code;
}

try {
	process.exitCode = await main();
} catch (error) {
	console.error(error instanceof Error ? error.message : error);
	process.exitCode = 1;
}
