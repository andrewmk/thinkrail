import { useSyncExternalStore } from "react";

const PHONE_QUERIES = ["(pointer: coarse)", "(max-width: 767px)"] as const;
const COARSE_POINTER_QUERY = "(pointer: coarse)" as const;

function matchQuery(query: string): MediaQueryList | null {
	const matchMedia = Reflect.get(globalThis, "matchMedia");
	if (typeof matchMedia !== "function") return null;
	return Reflect.apply(matchMedia, globalThis, [query]) as MediaQueryList;
}

function phoneQueries(): MediaQueryList[] {
	const queries: MediaQueryList[] = [];
	for (const query of PHONE_QUERIES) {
		const list = matchQuery(query);
		if (list) queries.push(list);
	}
	return queries;
}

export function isPhoneViewport(): boolean {
	return phoneQueries().some((query) => query.matches);
}

function subscribePhoneViewport(onChange: () => void): () => void {
	const queries = phoneQueries();
	for (const query of queries) query.addEventListener("change", onChange);
	return () => {
		for (const query of queries) query.removeEventListener("change", onChange);
	};
}

export function usePhoneViewport(): boolean {
	return useSyncExternalStore(subscribePhoneViewport, isPhoneViewport, () => false);
}

export function isCoarsePointer(): boolean {
	const query = matchQuery(COARSE_POINTER_QUERY);
	return query ? query.matches : false;
}

function subscribeCoarsePointer(onChange: () => void): () => void {
	const query = matchQuery(COARSE_POINTER_QUERY);
	if (!query) return () => {};
	query.addEventListener("change", onChange);
	return () => {
		query.removeEventListener("change", onChange);
	};
}

export function useCoarsePointer(): boolean {
	return useSyncExternalStore(subscribeCoarsePointer, isCoarsePointer, () => false);
}
