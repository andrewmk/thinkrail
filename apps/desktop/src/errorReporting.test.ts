import { expect, spyOn, test } from "bun:test";
import { desktopError } from "./errorReporting";

test("desktop errors log locally with their scope prefix", () => {
	const consoleError = spyOn(console, "error").mockImplementation(() => {});
	const boom = new Error("boom");
	try {
		desktopError("updates", "update lifecycle failed", boom);
		desktopError("preferences", "could not save a local preference");
		expect(consoleError).toHaveBeenCalledTimes(2);
		expect(consoleError).toHaveBeenCalledWith("[desktop:updates] update lifecycle failed", boom);
		expect(consoleError).toHaveBeenCalledWith(
			"[desktop:preferences] could not save a local preference",
		);
	} finally {
		consoleError.mockRestore();
	}
});
