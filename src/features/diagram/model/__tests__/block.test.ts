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
				blockType: "movie",
				title: "Movie",
			}),
		).toEqual({
			status: "invalid",
			reason: "지원하지 않는 blockType: movie",
		});
	});
});
