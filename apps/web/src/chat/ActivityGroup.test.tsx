import { describe, expect, it } from "bun:test";
import { currentTranslator } from "@thinkrail/locales/react";
import { renderToStaticMarkup } from "react-dom/server";
import { summarizeSteps } from "./ActivityGroup";
import type { ChatRow, RoutineToolStep } from "./rows";
import { ChatTurnView } from "./turns";

const tool = (id: string, toolName: string): RoutineToolStep => ({
	kind: "tool",
	id,
	toolCallId: id,
	toolName,
	args: {},
	tool: undefined,
	dead: false,
	streaming: false,
});

describe("activity disclosure summaries", () => {
	it("counts steps and tallies per tool name in first-seen order", () => {
		expect(
			summarizeSteps(currentTranslator(), [
				tool("a", "bash"),
				tool("b", "read"),
				tool("c", "bash"),
			]),
		).toBe("3 steps · bash ×2, read");
	});

	it("uses the singular 'step' for one step", () => {
		expect(summarizeSteps(currentTranslator(), [tool("a", "read")])).toBe("1 step · read");
	});

	it("caps the name list at 4 with a '+k more' overflow", () => {
		const steps = [
			tool("a", "bash"),
			tool("b", "read"),
			tool("c", "edit"),
			tool("d", "write"),
			tool("e", "grep"),
			tool("f", "glob"),
		];
		expect(summarizeSteps(currentTranslator(), steps)).toBe(
			"6 steps · bash, read, edit, write, +2 more",
		);
	});

	it("counts nested thinking and tools in one outer N-step disclosure", () => {
		const row: ChatRow = {
			kind: "activity",
			id: "activity:a",
			steps: [
				tool("a", "read"),
				{
					kind: "thinking",
					id: "thinking-1",
					text: "inspect first",
					streaming: false,
					tools: [tool("b", "read"), tool("c", "read")],
				},
			],
			live: false,
		};

		const markup = renderToStaticMarkup(
			<ChatTurnView row={row} agentResponded={false} isFinalAnswer={false} />,
		);

		expect(markup).toContain('data-testid="activity-group"');
		expect(markup).toContain('data-activity-node-id="activity:a"');
		expect(markup).toContain('data-activity-node-kind="activity"');
		expect(markup).toContain("data-activity-node-toggle");
		expect(markup).toContain("4 steps · read ×3, thinking");
		expect(markup).not.toContain(">Activity<");
		expect(markup).not.toContain("inspect first");

		const liveMarkup = renderToStaticMarkup(
			<ChatTurnView row={{ ...row, live: true }} agentResponded={false} isFinalAnswer={false} />,
		);
		expect(liveMarkup).toContain('data-activity-node-label="4 steps"');
	});

	it("expands a lone thinking group when the preference is on and stays collapsed otherwise", () => {
		const row: ChatRow = {
			kind: "activity",
			id: "activity:b",
			steps: [
				{
					kind: "thinking",
					id: "thinking-b",
					text: "inspect first",
					streaming: false,
					tools: [],
				},
			],
			live: false,
		};

		const collapsed = renderToStaticMarkup(
			<ChatTurnView row={row} agentResponded={false} isFinalAnswer={false} />,
		);
		expect(collapsed).toContain('data-testid="thinking-group"');
		expect(collapsed).not.toContain("inspect first");

		const expanded = renderToStaticMarkup(
			<ChatTurnView
				row={row}
				agentResponded={false}
				isFinalAnswer={false}
				thinkingExpandedByDefault={true}
			/>,
		);
		expect(expanded).toContain('data-expanded="true"');
		expect(expanded).toContain("inspect first");
	});

	it("opens an activity group that contains thinking when the preference is on, leaving tool-only groups closed", () => {
		const nested: ChatRow = {
			kind: "activity",
			id: "activity:n",
			steps: [
				tool("n1", "read"),
				{
					kind: "thinking",
					id: "thinking-n",
					text: "inspect the formatter first",
					streaming: false,
					tools: [tool("n2", "read")],
				},
			],
			live: false,
		};

		const closed = renderToStaticMarkup(
			<ChatTurnView row={nested} agentResponded={false} isFinalAnswer={false} />,
		);
		expect(closed).toContain('data-testid="activity-group"');
		expect(closed).not.toContain("inspect the formatter first");

		const open = renderToStaticMarkup(
			<ChatTurnView
				row={nested}
				agentResponded={false}
				isFinalAnswer={false}
				thinkingExpandedByDefault={true}
			/>,
		);
		expect(open).toContain('data-activity-node-id="activity:n"');
		expect(open).toContain('data-testid="thinking-group-text"');
		expect(open).toContain("inspect the formatter first");

		const toolOnly: ChatRow = {
			kind: "activity",
			id: "activity:to",
			steps: [tool("t1", "read"), tool("t2", "bash")],
			live: false,
		};
		const toolOnlyMarkup = renderToStaticMarkup(
			<ChatTurnView
				row={toolOnly}
				agentResponded={false}
				isFinalAnswer={false}
				thinkingExpandedByDefault={true}
			/>,
		);
		expect(toolOnlyMarkup).toContain('data-testid="activity-group"');
		expect(toolOnlyMarkup).not.toContain('data-testid="activity-step"');
	});
});
