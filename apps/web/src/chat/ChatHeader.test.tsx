import { expect, test } from "bun:test";
import type { SessionStats } from "@thinkrail/contracts";
import { TooltipProvider } from "@thinkrail/ui/tooltip";
import { renderToStaticMarkup } from "react-dom/server";
import { ChatHeader } from "./ChatHeader";

const STATS: SessionStats = {
	sessionId: "session-1",
	totalMessages: 1,
	tokens: { input: 12_300, output: 4_500, cacheRead: 0, cacheWrite: 0, total: 16_800 },
	cost: 0.123,
};

function renderHeader(): string {
	return renderToStaticMarkup(
		<TooltipProvider>
			<ChatHeader
				stats={STATS}
				statusEntries={[["tps", "142 t/s"]]}
				resources={
					<button type="button" data-testid="resources-trigger">
						r
					</button>
				}
				onOpenSkills={() => {}}
			/>
		</TooltipProvider>,
	);
}

test("the fine-pointer chat header is one row with status, stats, and actions in desktop order", () => {
	const markup = renderHeader();
	expect(markup).toContain('data-testid="chat-toolbar"');
	// One panel-header row: the two-row projection is coarse-pointer only.
	expect(markup.split("h-panel-header-row").length - 1).toBe(1);
	const status = markup.indexOf("142 t/s");
	const stats = markup.indexOf('data-testid="session-stats"');
	const resources = markup.indexOf('data-testid="resources-trigger"');
	const skills = markup.indexOf('data-testid="open-skills"');
	for (const index of [status, stats, resources, skills]) expect(index).toBeGreaterThan(-1);
	expect(status).toBeLessThan(stats);
	expect(stats).toBeLessThan(resources);
	expect(resources).toBeLessThan(skills);
});

test("the fine-pointer header omits the skills action when there is no project", () => {
	const markup = renderToStaticMarkup(
		<TooltipProvider>
			<ChatHeader stats={null} statusEntries={[]} resources={undefined} />
		</TooltipProvider>,
	);
	expect(markup).toContain('data-testid="chat-toolbar"');
	expect(markup).not.toContain('data-testid="open-skills"');
	expect(markup).not.toContain('data-testid="session-stats"');
	expect(markup.split("h-panel-header-row").length - 1).toBe(1);
});
