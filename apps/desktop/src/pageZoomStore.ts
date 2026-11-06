import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const PAGE_ZOOM_VERSION = 1;
const DEFAULT_PAGE_ZOOM = 1;
// Guards against garbage only; the 50%–200% step range is owned by pageZoom.
const MIN_PERSISTED_ZOOM = 0.25;
const MAX_PERSISTED_ZOOM = 4;

interface PageZoomDocument {
	version: 1;
	zooms: Record<string, number>;
}

function validZoom(value: unknown): value is number {
	return (
		typeof value === "number" &&
		Number.isFinite(value) &&
		value >= MIN_PERSISTED_ZOOM &&
		value <= MAX_PERSISTED_ZOOM
	);
}

function readDocument(path: string): PageZoomDocument {
	try {
		const value = JSON.parse(readFileSync(path, "utf8")) as unknown;
		if (
			typeof value !== "object" ||
			value === null ||
			Reflect.get(value, "version") !== PAGE_ZOOM_VERSION ||
			typeof Reflect.get(value, "zooms") !== "object" ||
			Reflect.get(value, "zooms") === null
		) {
			return { version: PAGE_ZOOM_VERSION, zooms: {} };
		}
		const zooms: Record<string, number> = {};
		for (const [key, zoom] of Object.entries(
			Reflect.get(value, "zooms") as Record<string, unknown>,
		)) {
			if (validZoom(zoom)) zooms[key] = zoom;
		}
		return { version: PAGE_ZOOM_VERSION, zooms };
	} catch {
		return { version: PAGE_ZOOM_VERSION, zooms: {} };
	}
}

export class PageZoomStore {
	readonly #path: string;
	readonly #document: PageZoomDocument;

	constructor(path: string) {
		this.#path = path;
		this.#document = existsSync(path)
			? readDocument(path)
			: {
					version: PAGE_ZOOM_VERSION,
					zooms: {},
				};
	}

	read(backendProfileId: string, windowId: string): number {
		return this.#document.zooms[`${backendProfileId}:${windowId}`] ?? DEFAULT_PAGE_ZOOM;
	}

	write(backendProfileId: string, windowId: string, zoom: unknown): boolean {
		if (!validZoom(zoom)) return false;
		const key = `${backendProfileId}:${windowId}`;
		if (this.#document.zooms[key] === zoom) return true;
		this.#document.zooms[key] = zoom;
		mkdirSync(dirname(this.#path), { recursive: true });
		writeFileSync(this.#path, `${JSON.stringify(this.#document, null, "\t")}\n`);
		return true;
	}
}
