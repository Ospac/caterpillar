import { afterEach, expect } from "@rstest/core";
import { cleanup } from "@testing-library/react";
import * as jestDomMatchers from "@testing-library/jest-dom/matchers";

expect.extend(jestDomMatchers);

function createMemoryStorage(): Storage {
	let store: Record<string, string> = {};

	return {
		get length() {
			return Object.keys(store).length;
		},
		clear() {
			store = {};
		},
		getItem(key) {
			return store[key] ?? null;
		},
		key(index) {
			return Object.keys(store)[index] ?? null;
		},
		removeItem(key) {
			delete store[key];
		},
		setItem(key, value) {
			store[key] = value;
		},
	};
}

Object.defineProperty(globalThis, "localStorage", {
	value: createMemoryStorage(),
	configurable: true,
});

// Cleanup after each test to prevent test pollution
afterEach(() => {
	localStorage.clear();
	cleanup();
});
