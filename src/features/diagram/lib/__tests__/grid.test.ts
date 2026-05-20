import { describe, expect, it } from "@rstest/core";
import type { DiagramNode } from "../../model/nodeTypes";
import { getNodeSpan, TALL_SPAN, WIDE_SPAN } from "../blockSpan";
import {
	CELL_SIZE,
	getGridOccupancy,
	getNextStage,
	getNodeCells,
	isNodeEscapingStage,
	positionToAnchorCell,
} from "../grid";

describe("grid(lib)", () => {
	it("stage는 마지막 단계까지만 확장된다", () => {
		expect(getNextStage(8)).toBe(14);
		expect(getNextStage(14)).toBe(20);
		expect(getNextStage(20)).toBe(20);
	});

	it("스팬별 점유 셀을 앵커 기준으로 전개한다", () => {
		expect(getNodeCells({ col: 2, row: 3 }, WIDE_SPAN)).toEqual([
			{ col: 2, row: 3 },
			{ col: 3, row: 3 },
			{ col: 2, row: 4 },
			{ col: 3, row: 4 },
		]);
		expect(getNodeCells({ col: 5, row: 1 }, TALL_SPAN)).toEqual([
			{ col: 5, row: 1 },
			{ col: 5, row: 2 },
		]);
	});

	it("블록 타입별 스팬 규칙을 한 곳에서 제공한다", () => {
		expect(getNodeSpan("text")).toBe(WIDE_SPAN);
		expect(getNodeSpan("music")).toBe(WIDE_SPAN);
		expect(getNodeSpan("menu")).toBe(WIDE_SPAN);
		expect(getNodeSpan("game")).toBe(TALL_SPAN);
		expect(getNodeSpan("movie")).toBe(TALL_SPAN);
		expect(getNodeSpan("book")).toBe(TALL_SPAN);
	});

	it("노드 중심이 stage를 벗어나면 앵커 셀을 만들지 않는다", () => {
		expect(isNodeEscapingStage({ x: 0, y: 0 }, 8, WIDE_SPAN)).toBe(false);
		expect(isNodeEscapingStage({ x: -1, y: 0 }, 8, WIDE_SPAN)).toBe(true);
		expect(
			isNodeEscapingStage(
				{ x: 7 * CELL_SIZE + 1, y: 7 * CELL_SIZE },
				8,
				WIDE_SPAN,
			),
		).toBe(true);
		expect(
			positionToAnchorCell(
				{ x: 7 * CELL_SIZE + 1, y: 7 * CELL_SIZE },
				8,
				WIDE_SPAN,
			),
		).toBeNull();
	});

	it("점유 현황은 스팬 단위 충돌을 sub-cell 기준으로 계산한다", () => {
		const node = (
			id: string,
			x: number,
			y: number,
			blockType: "text" | "movie" = "text",
		): DiagramNode =>
			({
				id,
				type: "block",
				position: { x, y },
				data: { blockType },
			}) as DiagramNode;

		const occupancy = getGridOccupancy(
			[
				node("node-a", 0, 0),
				node("node-b", CELL_SIZE, 0),
				node("node-c", 4 * CELL_SIZE, 0, "movie"),
			],
			8,
		);

		expect(Array.from(occupancy.conflictedCellKeys).sort()).toEqual([
			"1,0",
			"1,1",
		]);
		expect(occupancy.cellToNodeId.get("0,0")).toBe("node-a");
		expect(occupancy.cellToNodeId.get("2,0")).toBe("node-b");
		expect(occupancy.cellToNodeId.get("4,0")).toBe("node-c");
		expect(occupancy.cellToNodeId.get("4,1")).toBe("node-c");
	});
});
