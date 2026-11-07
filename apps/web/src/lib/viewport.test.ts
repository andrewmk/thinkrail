import { expect, test } from "bun:test";
import { isCoarsePointer, isPhoneViewport } from "./viewport";

type MediaMock = {
	matches: boolean;
	addEventListener: (name: string, listener: () => void) => void;
	removeEventListener: (name: string, listener: () => void) => void;
};

function withMedia(matcher: (query: string) => boolean, run: () => void): void {
	const listeners = new Map<MediaMock, Array<() => void>>();
	const previous = globalThis.matchMedia;
	Reflect.deleteProperty(globalThis, "matchMedia");
	Reflect.set(globalThis, "matchMedia", (query: string) => {
		const mock: MediaMock = {
			matches: matcher(query),
			addEventListener: (_name, listener) => {
				const list = listeners.get(mock) ?? [];
				list.push(listener);
				listeners.set(mock, list);
			},
			removeEventListener: () => {},
		};
		return mock;
	});
	try {
		run();
	} finally {
		if (previous === undefined) Reflect.deleteProperty(globalThis, "matchMedia");
		else Reflect.set(globalThis, "matchMedia", previous);
	}
}

test("coarse pointer is detected from the pointer media query alone", () => {
	withMedia(
		(query) => query === "(pointer: coarse)",
		() => {
			expect(isCoarsePointer()).toBe(true);
			expect(isPhoneViewport()).toBe(true);
		},
	);
});

test("a narrow fine-pointer viewport is phone-class but not coarse", () => {
	withMedia(
		(query) => query === "(max-width: 767px)",
		() => {
			expect(isCoarsePointer()).toBe(false);
			expect(isPhoneViewport()).toBe(true);
		},
	);
});

test("a wide fine-pointer viewport is neither coarse nor phone-class", () => {
	withMedia(
		() => false,
		() => {
			expect(isCoarsePointer()).toBe(false);
			expect(isPhoneViewport()).toBe(false);
		},
	);
});

test("without matchMedia both detections fail closed", () => {
	const previous = globalThis.matchMedia;
	Reflect.deleteProperty(globalThis, "matchMedia");
	try {
		expect(isCoarsePointer()).toBe(false);
		expect(isPhoneViewport()).toBe(false);
	} finally {
		if (previous === undefined) Reflect.deleteProperty(globalThis, "matchMedia");
		else Reflect.set(globalThis, "matchMedia", previous);
	}
});
