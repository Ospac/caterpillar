import { describe, expect, it } from "@rstest/core";
import type { GridOccupancy } from "../geometry";
import { CELL_SIZE } from "../grid";
import { resolveMenuNodeDropPosition } from "../menuDrop";

describe("menuDrop(lib)", () => {
	const emptyOccupancy = (): GridOccupancy => ({
		occupiedCellCount: 0,
		cellToNodeId: new Map(),
		conflictedCellKeys: new Set(),
	});

	const occupancyOf = (entries: Record<string, string>): GridOccupancy => ({
		occupiedCellCount: Object.keys(entries).length,
		cellToNodeId: new Map(Object.entries(entries)),
		conflictedCellKeys: new Set(),
	});

	const fullOccupancy = (stage = 8): GridOccupancy => {
		const entries: Record<string, string> = {};
		for (let row = 0; row < stage; row += 1) {
			for (let col = 0; col < stage; col += 1) {
				entries[`${col},${row}`] = `node-${row * stage + col}`;
			}
		}
		return occupancyOf(entries);
	};

	it("빈 위치를 메뉴 노드 도킹 좌표로 스냅한다", () => {
		expect(
			resolveMenuNodeDropPosition({
				position: { x: 2 * CELL_SIZE + 8, y: CELL_SIZE + 12 },
				stage: 8,
				occupancy: emptyOccupancy(),
			}),
		).toEqual({ x: 2 * CELL_SIZE, y: CELL_SIZE });
	});

	it("점유된 위치는 가까운 빈 셀로 fallback한다", () => {
		expect(
			resolveMenuNodeDropPosition({
				position: { x: 0, y: 0 },
				stage: 8,
				occupancy: occupancyOf({ "0,0": "node-a" }),
			}),
		).toEqual({ x: CELL_SIZE, y: 0 });
	});

	it("도킹 가능한 셀이 없으면 null을 반환한다", () => {
		expect(
			resolveMenuNodeDropPosition({
				position: { x: -20, y: 0 },
				stage: 8,
				occupancy: fullOccupancy(8),
			}),
		).toBeNull();
	});
});
