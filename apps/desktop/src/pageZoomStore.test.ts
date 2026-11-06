import { afterEach, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PageZoomStore } from "./pageZoomStore";

const roots: string[] = [];

afterEach(() => {
	for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function zoomPath(): string {
	const root = mkdtempSync(join(tmpdir(), "thinkrail-page-zoom-"));
	roots.push(root);
	mkdirSync(join(root, "nested"));
	return join(root, "nested", "page-zoom.json");
}

test("persists zooms independently by backend and window", () => {
	const path = zoomPath();
	const zooms = new PageZoomStore(path);
	expect(zooms.read("local", "main")).toBe(1);
	expect(zooms.write("local", "main", 1.75)).toBe(true);
	expect(zooms.write("remote", "main", 1.25)).toBe(true);
	const restored = new PageZoomStore(path);
	expect(restored.read("local", "main")).toBe(1.75);
	expect(restored.read("remote", "main")).toBe(1.25);
});

test("rejects out-of-bounds and non-finite zooms", () => {
	const path = zoomPath();
	const zooms = new PageZoomStore(path);
	expect(zooms.write("local", "main", 0)).toBe(false);
	expect(zooms.write("local", "main", 0.24)).toBe(false);
	expect(zooms.write("local", "main", 4.01)).toBe(false);
	expect(zooms.write("local", "main", Number.NaN)).toBe(false);
	expect(zooms.write("local", "main", Number.POSITIVE_INFINITY)).toBe(false);
	expect(zooms.write("local", "main", "1.5")).toBe(false);
	expect(existsSync(path)).toBe(false);
});

test("falls back from corrupt or unsupported zoom documents", () => {
	const path = zoomPath();
	writeFileSync(path, "not-json");
	expect(new PageZoomStore(path).read("local", "main")).toBe(1);
	writeFileSync(path, JSON.stringify({ version: 2, zooms: { "local:main": 1.5 } }));
	expect(new PageZoomStore(path).read("local", "main")).toBe(1);
	writeFileSync(
		path,
		JSON.stringify({ version: 1, zooms: { "local:main": "1.5", "remote:main": 99 } }),
	);
	const store = new PageZoomStore(path);
	expect(store.read("local", "main")).toBe(1);
	expect(store.read("remote", "main")).toBe(1);
});

test("idempotent writes preserve the stored document", () => {
	const path = zoomPath();
	const zooms = new PageZoomStore(path);
	zooms.write("local", "main", 1.5);
	const first = readFileSync(path, "utf8");
	zooms.write("local", "main", 1.5);
	expect(readFileSync(path, "utf8")).toBe(first);
});
