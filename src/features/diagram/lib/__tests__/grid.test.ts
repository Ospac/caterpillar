import { describe, expect, it } from "@rstest/core";
import type { DiagramNode } from "../../model/nodeTypes";
import { getNodeSpan, TALL_SPAN, WIDE_SPAN } from "../blockSpan";
import {
	CELL_SIZE,
	GRID_COLUMN_COUNT,
	GRID_ROW_COUNT,
	getGridOccupancy,
	getNodeCells,
	getNodesOutsideGrid,
	isNodeEscapingGrid,
	isNodeFullyInsideGrid,
	positionToAnchorCell,
} from "../grid";

describe("grid(lib)", () => {
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

	it("노드 span 전체가 30x15 grid 안에 있어야 유지한다", () => {
		const node = (
			x: number,
			y: number,
			blockType: "text" | "movie" = "text",
		): DiagramNode =>
			({
				id: `${x}-${y}-${blockType}`,
				type: "block",
				position: { x, y },
				data: { blockType },
			}) as DiagramNode;
		const insideWideNode = node(28 * CELL_SIZE, 13 * CELL_SIZE);
		const outsideWideNode = node(29 * CELL_SIZE, 13 * CELL_SIZE);
		const insideTallNode = node(29 * CELL_SIZE, 13 * CELL_SIZE, "movie");
		const outsideTallNode = node(29 * CELL_SIZE, 14 * CELL_SIZE, "movie");

		expect(isNodeFullyInsideGrid(insideWideNode)).toBe(true);
		expect(isNodeFullyInsideGrid(outsideWideNode)).toBe(false);
		expect(isNodeFullyInsideGrid(insideTallNode)).toBe(true);
		expect(isNodeFullyInsideGrid(outsideTallNode)).toBe(false);
		expect(
			getNodesOutsideGrid([
				insideWideNode,
				outsideWideNode,
				insideTallNode,
				outsideTallNode,
			]),
		).toEqual([outsideWideNode, outsideTallNode]);
	});

	it("블록 타입별 스팬 규칙을 한 곳에서 제공한다", () => {
		expect(getNodeSpan("text")).toBe(WIDE_SPAN);
		expect(getNodeSpan("music")).toBe(WIDE_SPAN);
		expect(getNodeSpan("menu")).toBe(WIDE_SPAN);
		expect(getNodeSpan("game")).toBe(TALL_SPAN);
		expect(getNodeSpan("movie")).toBe(TALL_SPAN);
		expect(getNodeSpan("book")).toBe(TALL_SPAN);
	});

	it("노드 중심이 grid를 벗어나면 앵커 셀을 만들지 않는다", () => {
		expect(isNodeEscapingGrid({ x: 0, y: 0 }, WIDE_SPAN)).toBe(false);
		expect(isNodeEscapingGrid({ x: -1, y: 0 }, WIDE_SPAN)).toBe(true);
		expect(
			isNodeEscapingGrid(
				{ x: 29 * CELL_SIZE + 1, y: 13 * CELL_SIZE },
				WIDE_SPAN,
			),
		).toBe(true);
		expect(
			positionToAnchorCell(
				{ x: 29 * CELL_SIZE + 1, y: 13 * CELL_SIZE },
				WIDE_SPAN,
			),
		).toBeNull();
	});

	it("기본 grid 치수는 가로 30칸, 세로 15칸이다", () => {
		expect(GRID_COLUMN_COUNT).toBe(30);
		expect(GRID_ROW_COUNT).toBe(15);
		expect(
			isNodeEscapingGrid({ x: 0, y: 14 * CELL_SIZE + 1 }, TALL_SPAN),
		).toBe(true);
		expect(
			positionToAnchorCell({ x: 0, y: 13 * CELL_SIZE }, TALL_SPAN),
		).toEqual({ col: 0, row: 13 });
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

		const occupancy = getGridOccupancy([
			node("node-a", 0, 0),
			node("node-b", CELL_SIZE, 0),
			node("node-c", 4 * CELL_SIZE, 0, "movie"),
		]);

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
