import { expect, test } from "bun:test";
import { currentTranslator } from "@thinkrail/locales/react";
import { renderToStaticMarkup } from "react-dom/server";
import { MobileTabBar } from "./MobileTabBar";
import { MobileTopbar } from "./MobileTopbar";

const t = currentTranslator();

const openingButton = (markup: string, testId: string): string =>
	new RegExp(`<button[^>]*data-testid="${testId}"[^>]*>`).exec(markup)?.[0] ?? "";

test("the mobile tab bar renders chat, files, and plan tabs with the active tab pressed", () => {
	const markup = renderToStaticMarkup(<MobileTabBar tab="files" onChange={() => {}} />);
	expect(markup).toContain('data-testid="mobile-tabbar"');
	for (const id of ["chat", "files", "plan"]) {
		expect(markup).toContain(`data-testid="mobile-tab-${id}"`);
	}
	expect(markup).toContain(t("shell.mobile.tab.chat"));
	expect(markup).toContain(t("shell.mobile.tab.files"));
	expect(markup).toContain(t("shell.mobile.tab.plan"));
	expect(openingButton(markup, "mobile-tab-files")).toContain('aria-pressed="true"');
	expect(openingButton(markup, "mobile-tab-chat")).not.toContain('aria-pressed="true"');
});

test("the mobile topbar renders brand, status, and no location chips without a context project", () => {
	const markup = renderToStaticMarkup(<MobileTopbar />);
	expect(markup).toContain('data-testid="mobile-topbar"');
	expect(markup).toContain('data-testid="brand-logo"');
	expect(markup).toContain('data-testid="connection-status"');
	expect(markup).not.toContain('data-testid="mobile-project-chip"');
	expect(markup).not.toContain('data-testid="mobile-workspace-chip"');
	expect(markup).not.toContain('data-testid="mobile-branch"');
	// The location sheet is closed by default; the sheet content is not mounted.
	expect(markup).not.toContain('data-testid="mobile-projects"');
});
