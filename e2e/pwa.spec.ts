import { expect, test } from "@playwright/test";
import { deviceContext, MOBILE_DEVICE, openAppFresh } from "./fixtures/app";

// The PWA lane: the one lane where service workers run (the default suite blocks them, because a
// precaching service worker would defeat page.route aborts of precached assets). The production
// build is the same in both lanes; only the browser's service-worker policy differs.
test("the PWA shell registers a service worker and opens offline with the disconnected status", async ({
	browser,
}) => {
	const context = await deviceContext(browser, MOBILE_DEVICE);
	const page = await context.newPage();
	try {
		await openAppFresh(page);
		await expect(page.getByTestId("mobile-topbar")).toBeVisible();
		await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
			"href",
			/manifest\.webmanifest$/,
		);
		// Wait until the service worker controls this page (clientsClaim lands a frame after
		// install); an uncontrolled page would take the offline navigation to the network.
		await page.waitForFunction(
			() =>
				Promise.resolve(navigator.serviceWorker.ready).then(
					() => navigator.serviceWorker.controller !== null,
				),
			undefined,
			{ timeout: 30_000 },
		);
		await context.setOffline(true);
		try {
			await page.reload();
			await expect(page.getByTestId("mobile-topbar")).toBeVisible();
			await expect(page.getByTestId("connection-status").first()).toHaveAttribute(
				"data-status",
				"disconnected",
			);
		} finally {
			await context.setOffline(false);
		}
	} finally {
		await context.close();
	}
});
