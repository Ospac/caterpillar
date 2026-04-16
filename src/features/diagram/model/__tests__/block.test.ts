import { describe, expect, it } from "@rstest/core";
import { validateBlockData } from "../block";

describe("block(model)", () => {
	it("정상 text block data는 ok로 통과한다", () => {
		expect(
			validateBlockData({
				blockType: "text",
				text: "Node 1",
			}),
		).toEqual({
			status: "ok",
			data: {
				blockType: "text",
				text: "Node 1",
			},
		});
	});

	it("link: url이 있으면 ok를 반환한다", () => {
		expect(
			validateBlockData({
				blockType: "link",
				url: "https://example.com",
			}),
		).toEqual({
			status: "ok",
			data: {
				blockType: "link",
				url: "https://example.com",
			},
		});
	});

	it("link: url이 빈 문자열이면 fallback으로 보정한다", () => {
		expect(
			validateBlockData({
				blockType: "link",
				url: "",
			}),
		).toEqual({
			status: "fallback",
			data: {
				blockType: "link",
				url: "",
			},
		});
	});

	it("link: url이 없으면 invalid를 반환한다", () => {
		expect(
			validateBlockData({
				blockType: "link",
			}),
		).toEqual({
			status: "invalid",
			reason: expect.any(String),
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

	it("music: title/secondary가 빈 문자열이면 fallback으로 보정한다", () => {
		expect(
			validateBlockData({ blockType: "music", title: "", secondary: "" }),
		).toEqual({
			status: "fallback",
			data: {
				blockType: "music",
				title: "music",
				secondary: "",
			},
		});
	});

	it("music: 모든 필드가 있으면 ok를 반환한다", () => {
		expect(
			validateBlockData({
				blockType: "music",
				title: "Bohemian Rhapsody",
				secondary: "Queen",
				image: "https://example.com/art.jpg",
			}),
		).toEqual({
			status: "ok",
			data: {
				blockType: "music",
				title: "Bohemian Rhapsody",
				secondary: "Queen",
				image: "https://example.com/art.jpg",
			},
		});
	});

	it("game: title이 빈 문자열이면 fallback으로 보정한다", () => {
		expect(
			validateBlockData({ blockType: "game", title: "", secondary: "" }),
		).toEqual({
			status: "fallback",
			data: {
				blockType: "game",
				title: "game",
				secondary: "",
			},
		});
	});

	it("game: title이 있으면 ok를 반환한다", () => {
		expect(
			validateBlockData({
				blockType: "game",
				title: "Elden Ring",
				secondary: "",
				year: "2022",
			}),
		).toEqual({
			status: "ok",
			data: {
				blockType: "game",
				title: "Elden Ring",
				secondary: "",
				year: "2022",
			},
		});
	});

	it("movie: title이 빈 문자열이면 fallback으로 보정한다", () => {
		expect(
			validateBlockData({ blockType: "movie", title: "", secondary: "" }),
		).toEqual({
			status: "fallback",
			data: {
				blockType: "movie",
				title: "movie",
				secondary: "",
			},
		});
	});

	it("movie: title이 있으면 ok를 반환한다", () => {
		expect(
			validateBlockData({
				blockType: "movie",
				title: "Inception",
				secondary: "",
				image: "https://example.com/poster.jpg",
				year: "2010",
			}),
		).toEqual({
			status: "ok",
			data: {
				blockType: "movie",
				title: "Inception",
				secondary: "",
				image: "https://example.com/poster.jpg",
				year: "2010",
			},
		});
	});

	it("book: title/secondary가 빈 문자열이면 fallback으로 보정한다", () => {
		expect(
			validateBlockData({ blockType: "book", title: "", secondary: "" }),
		).toEqual({
			status: "fallback",
			data: {
				blockType: "book",
				title: "book",
				secondary: "",
			},
		});
	});

	it("book: 모든 필드가 있으면 ok를 반환한다", () => {
		expect(
			validateBlockData({
				blockType: "book",
				title: "The Hobbit",
				secondary: "J.R.R. Tolkien",
				image: "https://example.com/cover.jpg",
			}),
		).toEqual({
			status: "ok",
			data: {
				blockType: "book",
				title: "The Hobbit",
				secondary: "J.R.R. Tolkien",
				image: "https://example.com/cover.jpg",
			},
		});
	});
});
