import { describe, expect, it } from "@rstest/core";
import type { DiagramNode } from "../../model/nodeTypes";
import { getNodeSpan, TALL_SPAN, WIDE_SPAN } from "../blockSpan";
import {
	CELL_SIZE,
	getGridOccupancy,
	getNextStage,
	getNodeCells,
	getNodesOutsideStage,
	getResponsiveGridZoom,
	isNodeEscapingStage,
	isNodeFullyInsideStage,
	positionToAnchorCell,
} from "../grid";

describe("grid(lib)", () => {
	it("stage는 마지막 단계까지만 확장된다", () => {
		expect(getNextStage(12)).toBe(18);
		expect(getNextStage(18)).toBe(24);
		expect(getNextStage(24)).toBe(24);
	});

	it("stage가 화면보다 클 때만 최소 배율까지 축소한다", () => {
		expect(getResponsiveGridZoom(2000, 12)).toBe(1);
		expect(getResponsiveGridZoom(954, 18)).toBe(0.5);
		expect(getResponsiveGridZoom(100, 24)).toBe(0.5);
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

	it("노드 span 전체가 stage 안에 있어야 유지한다", () => {
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
		const insideWideNode = node(10 * CELL_SIZE, 10 * CELL_SIZE);
		const outsideWideNode = node(11 * CELL_SIZE, 10 * CELL_SIZE);
		const insideTallNode = node(11 * CELL_SIZE, 10 * CELL_SIZE, "movie");
		const outsideTallNode = node(11 * CELL_SIZE, 11 * CELL_SIZE, "movie");

		expect(isNodeFullyInsideStage(insideWideNode, 12)).toBe(true);
		expect(isNodeFullyInsideStage(outsideWideNode, 12)).toBe(false);
		expect(isNodeFullyInsideStage(insideTallNode, 12)).toBe(true);
		expect(isNodeFullyInsideStage(outsideTallNode, 12)).toBe(false);
		expect(
			getNodesOutsideStage(
				[insideWideNode, outsideWideNode, insideTallNode, outsideTallNode],
				12,
			),
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

	it("노드 중심이 stage를 벗어나면 앵커 셀을 만들지 않는다", () => {
		expect(isNodeEscapingStage({ x: 0, y: 0 }, 12, WIDE_SPAN)).toBe(false);
		expect(isNodeEscapingStage({ x: -1, y: 0 }, 12, WIDE_SPAN)).toBe(true);
		expect(
			isNodeEscapingStage(
				{ x: 11 * CELL_SIZE + 1, y: 11 * CELL_SIZE },
				12,
				WIDE_SPAN,
			),
		).toBe(true);
		expect(
			positionToAnchorCell(
				{ x: 11 * CELL_SIZE + 1, y: 11 * CELL_SIZE },
				12,
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
			12,
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
