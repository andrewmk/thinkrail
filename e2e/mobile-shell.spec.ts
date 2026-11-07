import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { expect, type Page, test } from "@playwright/test";
import {
	deviceContext,
	MOBILE_DEVICE,
	openAppFresh,
	TABLET_DEVICE,
	worktreeRows,
} from "./fixtures/app";
import { E2E_DATA_DIR } from "./fixtures/paths";
import { pierreLines } from "./fixtures/pierre";

const worktree = () => join(E2E_DATA_DIR, "worktrees", "sample-project", "workspace-1");

// The mobile home is the project tree only (no desktop WelcomePanel), so the desktop
// openFixtureProject's `welcome` assertion does not apply here.
async function openFixtureProjectMobile(page: Page): Promise<void> {
	await openAppFresh(page);
	await page.getByTestId("add-project-menu").click();
	await page.getByTestId("menu-open-project").click();
	await expect(page.getByTestId("project-item").first()).toBeVisible();
}

// The shared createWorkspaceViaDialog asserts the desktop editor tab strip; the mobile
// shell has no tab strip, so this drives the same shared dialog instead. Creating a
// workspace auto-activates it once the host finishes; if the home tree is still showing,
// tap the row to enter.
async function openMobileWorkspace(page: Page): Promise<void> {
	await openFixtureProjectMobile(page);
	await page.getByTestId("add-workspace").first().click();
	const dialog = page.getByTestId("new-workspace-dialog");
	await expect(dialog).toBeVisible();
	await page.getByTestId("create-workspace").click();
	await expect(dialog).toBeHidden();
	await expect
		.poll(
			async () => {
				if ((await page.getByTestId("mobile-tabbar").count()) > 0) return true;
				const row = worktreeRows(page).first();
				if ((await row.count()) > 0) await row.getByRole("button").first().click();
				return false;
			},
			{ timeout: 30_000 },
		)
		.toBe(true);
	// The created workspace's chat opens automatically; the composer appears once it exists.
	await expect(page.getByTestId("chat-input")).toBeVisible({ timeout: 30_000 });
}

async function noHorizontalOverflow(page: Page): Promise<void> {
	await expect
		.poll(() =>
			page.evaluate(
				() => document.documentElement.scrollWidth - document.documentElement.clientWidth,
			),
		)
		.toBeLessThanOrEqual(0);
}

test("a coarse-pointer phone lands in the mobile shell with chat, tabs, and no desktop rails", async ({
	browser,
}) => {
	const context = await deviceContext(browser, MOBILE_DEVICE);
	const page = await context.newPage();
	try {
		await openMobileWorkspace(page);
		await expect(page.getByTestId("shell")).toHaveAttribute("data-mobile", "true");
		await expect(page.getByTestId("mobile-project-chip")).toBeVisible();
		await expect(page.getByTestId("mobile-workspace-chip")).toBeVisible();
		await expect(page.getByTestId("mobile-branch")).toBeVisible();
		await expect(page.getByTestId("mobile-tab-chat")).toHaveAttribute("aria-pressed", "true");
		await expect(page.getByTestId("mobile-tab-files")).toBeVisible();
		await expect(page.getByTestId("mobile-tab-plan")).toBeVisible();
		await expect(page.getByTestId("chat-send")).toBeVisible();
		for (const id of ["left-stack", "right-stack", "bottom-panel", "center-tabs"]) {
			await expect(page.getByTestId(id)).toHaveCount(0);
		}
		await noHorizontalOverflow(page);
	} finally {
		await context.close();
	}
});

test("the mobile location sheet shows the project tree and returns to the shell", async ({
	browser,
}) => {
	const context = await deviceContext(browser, MOBILE_DEVICE);
	const page = await context.newPage();
	try {
		await openMobileWorkspace(page);
		await page.getByTestId("mobile-project-chip").click();
		const sheet = page.getByTestId("mobile-projects-sheet");
		await expect(sheet).toBeVisible();
		await expect(sheet.getByTestId("project-item").first()).toBeVisible();
		await expect(sheet.getByTestId("workspace-item").first()).toBeVisible();
		await page.keyboard.press("Escape");
		await expect(sheet).toBeHidden();
		await expect(page.getByTestId("mobile-topbar")).toBeVisible();
		await expect(page.getByTestId("chat-input")).toBeVisible();
		await noHorizontalOverflow(page);
	} finally {
		await context.close();
	}
});

test("a mobile file tap opens the read-only Pierre view and back returns to the tree", async ({
	browser,
}) => {
	const context = await deviceContext(browser, MOBILE_DEVICE);
	const page = await context.newPage();
	try {
		await openMobileWorkspace(page);
		await page.getByTestId("mobile-tab-files").click();
		await expect(page.getByTestId("mobile-tab-files")).toHaveAttribute("aria-pressed", "true");
		await expect(page.getByTestId("mobile-files-tree")).toBeVisible();
		await page.getByTestId("file-node").filter({ hasText: "notes.txt" }).first().click();
		await expect(page.getByTestId("mobile-files-header")).toBeVisible();
		await expect(page.getByTestId("mobile-files-title")).toHaveText("notes.txt");
		const fileView = page.getByTestId("file-view");
		await expect(fileView).toBeVisible();
		await expect(pierreLines(fileView, "plain-text-fixture")).toHaveCount(1);
		await expect(page.locator(".monaco-editor")).toHaveCount(0);
		await page.getByTestId("mobile-files-back").click();
		await expect(page.getByTestId("mobile-files-tree")).toBeVisible();
		await expect(page.getByTestId("mobile-files-header")).toHaveCount(0);
		await noHorizontalOverflow(page);
	} finally {
		await context.close();
	}
});

test("the mobile files tab lists changes and opens a unified-only diff", async ({ browser }) => {
	const context = await deviceContext(browser, MOBILE_DEVICE);
	const page = await context.newPage();
	try {
		await openMobileWorkspace(page);
		writeFileSync(
			join(worktree(), "script.ts"),
			"export const one = 1;\nexport const two = 2;\nexport const three = 3;\n",
		);
		await page.getByTestId("mobile-tab-files").click();
		await page.getByTestId("files-mode-changed").click();
		const item = page.getByTestId("change-item").filter({ hasText: "script.ts" });
		await expect(item).toBeVisible();
		await item.click();
		await expect(page.getByTestId("mobile-files-header")).toBeVisible();
		const diff = page.getByTestId("diff-view");
		await expect(diff.getByText("three = 3", { exact: false }).last()).toBeVisible();
		await expect(page.getByTestId("diff-toggle-split")).toHaveCount(0);
		await expect(page.getByTestId("diff-toggle-inline")).toHaveCount(0);
		await expect(page.getByTestId("hunk-toolbar").first()).toBeVisible();
		await noHorizontalOverflow(page);
	} finally {
		await context.close();
	}
});

test("the mobile plan tab shows the plan state and switches back to chat", async ({ browser }) => {
	const context = await deviceContext(browser, MOBILE_DEVICE);
	const page = await context.newPage();
	try {
		await openMobileWorkspace(page);
		await page.getByTestId("mobile-tab-plan").click();
		await expect(page.getByTestId("mobile-tab-plan")).toHaveAttribute("aria-pressed", "true");
		// The plan tab shows the active chat's plan (empty for a fresh session).
		await expect(page.getByTestId("mobile-plan")).toBeVisible();
		await page.getByTestId("mobile-tab-chat").click();
		await expect(page.getByTestId("mobile-tab-chat")).toHaveAttribute("aria-pressed", "true");
		await expect(page.getByTestId("chat-input")).toBeVisible();
		await noHorizontalOverflow(page);
	} finally {
		await context.close();
	}
});

test("a coarse-pointer tablet keeps the mobile shell at wide width", async ({ browser }) => {
	const context = await deviceContext(browser, TABLET_DEVICE);
	const page = await context.newPage();
	try {
		await openMobileWorkspace(page);
		await expect(page.getByTestId("shell")).toHaveAttribute("data-mobile", "true");
		await expect(page.getByTestId("mobile-topbar")).toBeVisible();
		await expect(page.getByTestId("mobile-tabbar")).toBeVisible();
		for (const id of ["left-stack", "right-stack", "bottom-panel"]) {
			await expect(page.getByTestId(id)).toHaveCount(0);
		}
		await noHorizontalOverflow(page);
	} finally {
		await context.close();
	}
});

test("the mobile chat steers a real agent end to end", { tag: "@agent" }, async ({ browser }) => {
	test.setTimeout(180_000);
	const context = await deviceContext(browser, MOBILE_DEVICE);
	const page = await context.newPage();
	try {
		await openMobileWorkspace(page);
		await page.getByTestId("chat-input").fill("Reply with exactly: ping");
		await page.getByTestId("chat-send").click();
		await expect(
			page
				.locator('[data-testid="chat-message"][data-role="assistant"]')
				.filter({ hasText: "ping" })
				.first(),
		).toBeVisible({ timeout: 120_000 });
		await expect(page.getByTestId("chat-scroll")).toHaveAttribute("data-streaming", "false", {
			timeout: 60_000,
		});
	} finally {
		await context.close();
	}
});

test("an ask-user-question card renders and answers on the mobile shell", {
	tag: "@agent",
}, async ({ browser }) => {
	test.setTimeout(300_000);
	const context = await deviceContext(browser, MOBILE_DEVICE);
	const page = await context.newPage();
	try {
		await openMobileWorkspace(page);
		await page
			.getByTestId("chat-input")
			.fill(
				"Use the ask_user_question tool to ask me exactly one multiple-choice question: which fruit I prefer. Give exactly two options: Apple and Banana.",
			);
		await page.getByTestId("chat-send").click();
		const card = page.locator('[data-testid="ask-user-question"][data-tone="active"]');
		await expect(card).toBeVisible({ timeout: 150_000 });
		await card.getByTestId("ask-option").first().click();
		await card.getByTestId("ask-continue").click();
		await expect(card).toBeHidden({ timeout: 60_000 });
		await expect(page.getByTestId("chat-scroll")).toHaveAttribute("data-streaming", "false", {
			timeout: 120_000,
		});
		await noHorizontalOverflow(page);
	} finally {
		await context.close();
	}
});
