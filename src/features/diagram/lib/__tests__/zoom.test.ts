import { describe, expect, it } from "@rstest/core";
import { CELL_SIZE } from "../grid";
import {
	GRID_ZOOM_BUTTON_CELL_STEP,
	GRID_ZOOM_WHEEL_CELL_STEP,
	getCellAlignedAnchoredScrollOffset,
	getClampedVisibleCellCount,
	getGridZoomForVisibleCells,
	getNextGridVisibleCellCount,
	getResponsiveGridVisibleCellCount,
	getVisibleCellCountBounds,
	getWheelGridVisibleCellCount,
	isGridZoomWheelEvent,
} from "../zoom";

describe("zoom(lib)", () => {
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
		expect(getGridZoomForVisibleCells(4000, 30)).toBe(1);
		expect(getGridZoomForVisibleCells(100, 4)).toBeCloseTo(
			100 / (CELL_SIZE * 4),
		);
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
		expect(getWheelGridVisibleCellCount(18, -25, 954)).toBe(
			18 - GRID_ZOOM_WHEEL_CELL_STEP,
		);
		expect(getWheelGridVisibleCellCount(18, 25, 954)).toBe(
			18 + GRID_ZOOM_WHEEL_CELL_STEP,
		);
		expect(getWheelGridVisibleCellCount(18, 0, 954)).toBe(18);
	});

	it("modifier wheel만 zoom으로 처리한다", () => {
		expect(isGridZoomWheelEvent({ metaKey: true, ctrlKey: false })).toBe(true);
		expect(isGridZoomWheelEvent({ metaKey: false, ctrlKey: true })).toBe(true);
		expect(isGridZoomWheelEvent({ metaKey: false, ctrlKey: false })).toBe(
			false,
		);
	});

	it("마우스 위치 기준 scroll offset을 계산한다", () => {
		expect(
			getCellAlignedAnchoredScrollOffset(1300, 300, 0.5, 954) /
				(CELL_SIZE * 0.5),
		).toBeCloseTo(7);
		expect(getCellAlignedAnchoredScrollOffset(100, 300, 0.5, 954)).toBe(0);
	});
});
