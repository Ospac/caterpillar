import { describe, expect, it } from "@rstest/core";
import { validateBlockData } from "../block";

describe("block(model)", () => {
	it("정상 text block data는 ok로 통과한다", () => {
		expect(
			validateBlockData({
				blockType: "text",
				title: "Node 1",
				text: "Node 1",
			}),
		).toEqual({
			status: "ok",
			data: {
				blockType: "text",
				title: "Node 1",
				text: "Node 1",
			},
		});
	});

	it("필수 필드가 빠진 link block data는 fallback으로 보정한다", () => {
		expect(
			validateBlockData({
				blockType: "link",
			}),
		).toEqual({
			status: "fallback",
			data: {
				blockType: "link",
				title: "Link",
				url: "",
			},
		});
	});

	it("지원하지 않는 blockType은 invalid를 반환한다", () => {
		expect(
			validateBlockData({
				blockType: "video",
				title: "Video",
			}),
		).toEqual({
			status: "invalid",
			reason: "지원하지 않는 blockType: video",
		});
	});

	it("blockType이 없는 데이터는 invalid를 반환한다", () => {
		expect(validateBlockData({ title: "No type" })).toEqual({
			status: "invalid",
			reason: "blockType이 없는 데이터는 복원할 수 없습니다.",
		});
	});

	// ── 신규 타입 fallback 케이스 ───────────────────────────────────────────────

	it("music: 필수 필드가 빠진 경우 fallback으로 보정한다", () => {
		expect(validateBlockData({ blockType: "music" })).toEqual({
			status: "fallback",
			data: {
				blockType: "music",
				title: "Music",
				artist: "",
			},
		});
	});

	it("music: 모든 필드가 있으면 ok를 반환한다", () => {
		expect(
			validateBlockData({
				blockType: "music",
				title: "Bohemian Rhapsody",
				artist: "Queen",
				albumArt: "https://example.com/art.jpg",
			}),
		).toEqual({
			status: "ok",
			data: {
				blockType: "music",
				title: "Bohemian Rhapsody",
				artist: "Queen",
				albumArt: "https://example.com/art.jpg",
			},
		});
	});

	it("game: title이 없으면 fallback으로 보정한다", () => {
		expect(validateBlockData({ blockType: "game" })).toEqual({
			status: "fallback",
			data: {
				blockType: "game",
				title: "Game",
			},
		});
	});

	it("game: title이 있으면 ok를 반환한다", () => {
		expect(
			validateBlockData({
				blockType: "game",
				title: "Elden Ring",
				releaseYear: 2022,
			}),
		).toEqual({
			status: "ok",
			data: {
				blockType: "game",
				title: "Elden Ring",
				releaseYear: 2022,
			},
		});
	});

	it("movie: title이 없으면 fallback으로 보정한다", () => {
		expect(validateBlockData({ blockType: "movie" })).toEqual({
			status: "fallback",
			data: {
				blockType: "movie",
				title: "Movie",
			},
		});
	});

	it("movie: title이 있으면 ok를 반환한다", () => {
		expect(
			validateBlockData({
				blockType: "movie",
				title: "Inception",
				posterUrl: "https://example.com/poster.jpg",
				releaseYear: 2010,
			}),
		).toEqual({
			status: "ok",
			data: {
				blockType: "movie",
				title: "Inception",
				posterUrl: "https://example.com/poster.jpg",
				releaseYear: 2010,
			},
		});
	});

	it("book: 필수 필드가 빠진 경우 fallback으로 보정한다", () => {
		expect(validateBlockData({ blockType: "book" })).toEqual({
			status: "fallback",
			data: {
				blockType: "book",
				title: "Book",
				author: "",
			},
		});
	});

	it("book: 모든 필드가 있으면 ok를 반환한다", () => {
		expect(
			validateBlockData({
				blockType: "book",
				title: "The Hobbit",
				author: "J.R.R. Tolkien",
				coverUrl: "https://example.com/cover.jpg",
			}),
		).toEqual({
			status: "ok",
			data: {
				blockType: "book",
				title: "The Hobbit",
				author: "J.R.R. Tolkien",
				coverUrl: "https://example.com/cover.jpg",
			},
		});
	});
});
