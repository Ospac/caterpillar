import { describe, expect, it } from "@rstest/core";
import type { DiagramNode } from "../../model/nodeTypes";
import { getNodeSpan, TALL_SPAN, WIDE_SPAN } from "../blockSpan";
import {
	CELL_SIZE,
	GRID_ZOOM_BUTTON_CELL_STEP,
	GRID_ZOOM_WHEEL_CELL_STEP,
	getAnchoredScrollOffset,
	getCellAlignedAnchoredScrollOffset,
	getCellAlignedCenteredScrollOffset,
	getCenteredScrollOffset,
	getClampedVisibleCellCount,
	getGridOccupancy,
	getGridZoomForVisibleCells,
	getNextGridVisibleCellCount,
	getNextGridZoom,
	getNodeCells,
	getNodesOutsideGrid,
	getResponsiveGridVisibleCellCount,
	getResponsiveGridZoom,
	getVisibleCellCount,
	getVisibleCellCountBounds,
	getWheelGridVisibleCellCount,
	getWheelGridZoom,
	isGridZoomWheelEvent,
	isNodeEscapingGrid,
	isNodeFullyInsideGrid,
	positionToAnchorCell,
} from "../grid";

describe("grid(lib)", () => {
	it("grid가 화면보다 클 때만 최소 배율까지 축소한다", () => {
		expect(getResponsiveGridZoom(4000)).toBe(1);
		expect(getResponsiveGridZoom(954)).toBeCloseTo(954 / (CELL_SIZE * 30));
		expect(getResponsiveGridZoom(100)).toBeCloseTo(100 / (CELL_SIZE * 4));
	});

	it("zoom은 viewport에 보이는 CELL 개수 기준으로 정렬한다", () => {
		expect(getVisibleCellCountBounds(954)).toEqual({
			min: 9,
			max: 30,
		});
		expect(getResponsiveGridVisibleCellCount(954)).toBe(30);
		expect(getResponsiveGridVisibleCellCount(100)).toBe(4);
		expect(getGridZoomForVisibleCells(954, 18)).toBeCloseTo(
			954 / (CELL_SIZE * 18),
		);
		expect(getVisibleCellCount(954, 0.5)).toBe(18);
		expect(getClampedVisibleCellCount(954, 4)).toBe(9);
		expect(getClampedVisibleCellCount(954, 40)).toBe(30);
	});

	it("수동 zoom은 보이는 CELL 개수를 이산 변경하고 20%에서 100% 사이로 제한한다", () => {
		expect(
			getNextGridVisibleCellCount(18, 954, -GRID_ZOOM_BUTTON_CELL_STEP),
		).toBe(16);
		expect(
			getNextGridVisibleCellCount(18, 954, GRID_ZOOM_BUTTON_CELL_STEP),
		).toBe(20);
		expect(getNextGridZoom(0.5, 954, -2)).toBeCloseTo(954 / (CELL_SIZE * 16));
		expect(getNextGridZoom(0.5, 954, 2)).toBeCloseTo(954 / (CELL_SIZE * 20));
		expect(getNextGridZoom(1, 954, -2)).toBe(1);
		expect(getNextGridZoom(0.2, 954, 2)).toBeCloseTo(954 / (CELL_SIZE * 30));
		expect(getWheelGridVisibleCellCount(18, -25, 954)).toBe(
			18 - GRID_ZOOM_WHEEL_CELL_STEP,
		);
		expect(getWheelGridVisibleCellCount(18, 25, 954)).toBe(
			18 + GRID_ZOOM_WHEEL_CELL_STEP,
		);
		expect(getWheelGridZoom(0.5, -25, 954)).toBeCloseTo(954 / (CELL_SIZE * 17));
		expect(getWheelGridZoom(0.5, 25, 954)).toBeCloseTo(954 / (CELL_SIZE * 19));
		expect(getWheelGridZoom(0.5, 0, 954)).toBe(0.5);
	});

	it("modifier wheel만 zoom으로 처리하고 중앙 scroll offset을 계산한다", () => {
		expect(isGridZoomWheelEvent({ metaKey: true, ctrlKey: false })).toBe(true);
		expect(isGridZoomWheelEvent({ metaKey: false, ctrlKey: true })).toBe(true);
		expect(isGridZoomWheelEvent({ metaKey: false, ctrlKey: false })).toBe(
			false,
		);
		expect(getCenteredScrollOffset(1000, 0.5, 800)).toBe(100);
		expect(
			getCellAlignedCenteredScrollOffset(1300, 0.5, 954) / (CELL_SIZE * 0.5),
		).toBeCloseTo(3);
	});

	it("마우스 위치 기준 scroll offset을 계산한다", () => {
		expect(getAnchoredScrollOffset(1000, 300, 0.5)).toBe(200);
		expect(
			getCellAlignedAnchoredScrollOffset(1300, 300, 0.5, 954) /
				(CELL_SIZE * 0.5),
		).toBeCloseTo(7);
		expect(getCellAlignedAnchoredScrollOffset(100, 300, 0.5, 954)).toBe(0);
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

	it("노드 span 전체가 30칸 grid 안에 있어야 유지한다", () => {
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
		const insideWideNode = node(28 * CELL_SIZE, 28 * CELL_SIZE);
		const outsideWideNode = node(29 * CELL_SIZE, 28 * CELL_SIZE);
		const insideTallNode = node(29 * CELL_SIZE, 28 * CELL_SIZE, "movie");
		const outsideTallNode = node(29 * CELL_SIZE, 29 * CELL_SIZE, "movie");

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
				{ x: 29 * CELL_SIZE + 1, y: 29 * CELL_SIZE },
				WIDE_SPAN,
			),
		).toBe(true);
		expect(
			positionToAnchorCell(
				{ x: 29 * CELL_SIZE + 1, y: 29 * CELL_SIZE },
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
