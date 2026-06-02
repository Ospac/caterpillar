import { describe, expect, it } from "@rstest/core";
import type { DiagramNode } from "../../model/nodeTypes";
import {
	resolveEdgeDropConnectionHandles,
	resolveEdgeDropPosition,
	resolveEdgeDropTargetHandle,
} from "../edge";
import type { GridOccupancy } from "../geometry";
import { CELL_SIZE } from "../grid";

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

	const fullOccupancy = (stage = 12): GridOccupancy => {
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
			resolveEdgeDropPosition({
				position: { x: 2 * CELL_SIZE + 8, y: CELL_SIZE + 12 },
				stage: 12,
				occupancy: emptyOccupancy(),
			}),
		).toEqual({ x: 2 * CELL_SIZE, y: CELL_SIZE });
	});

	it("edge 드롭은 노드 드래그용 중심점 보정을 적용하지 않는다", () => {
		expect(
			resolveEdgeDropPosition({
				position: {
					x: 2 * CELL_SIZE + CELL_SIZE / 2 + 1,
					y: CELL_SIZE + CELL_SIZE / 2 + 1,
				},
				stage: 12,
				occupancy: emptyOccupancy(),
			}),
		).toEqual({ x: 2 * CELL_SIZE, y: CELL_SIZE });
	});

	it("점유된 위치는 fallback하지 않고 null을 반환한다", () => {
		expect(
			resolveEdgeDropPosition({
				position: { x: 0, y: 0 },
				stage: 12,
				occupancy: occupancyOf({ "0,0": "node-a" }),
			}),
		).toBeNull();
	});

	it("2x2 메뉴 span 안의 일부 cell이 점유되어 있으면 null을 반환한다", () => {
		expect(
			resolveEdgeDropPosition({
				position: { x: 2 * CELL_SIZE + 8, y: 2 * CELL_SIZE + 12 },
				stage: 12,
				occupancy: occupancyOf({ "3,3": "node-a" }),
			}),
		).toBeNull();
	});

	it("도킹 가능한 셀이 없으면 null을 반환한다", () => {
		expect(
			resolveEdgeDropPosition({
				position: { x: -20, y: 0 },
				stage: 12,
				occupancy: fullOccupancy(12),
			}),
		).toBeNull();
	});

	describe("resolveMenuNodeTargetHandle", () => {
		const sourceNode = (position = { x: 0, y: 0 }): DiagramNode => ({
			id: "source",
			type: "block",
			position,
			data: { blockType: "text", text: "source" },
		});

		it("target이 source 오른쪽/왼쪽에 있으면 target의 반대편 handle을 고른다", () => {
			expect(
				resolveEdgeDropTargetHandle(sourceNode(), {
					x: 2 * CELL_SIZE,
					y: 0,
				}),
			).toBe("left");
			expect(
				resolveEdgeDropTargetHandle(sourceNode(), {
					x: -2 * CELL_SIZE,
					y: 0,
				}),
			).toBe("right");
		});

		it("target이 source 위/아래에 있으면 target의 반대편 handle을 고른다", () => {
			expect(
				resolveEdgeDropTargetHandle(sourceNode(), {
					x: 0,
					y: -2 * CELL_SIZE,
				}),
			).toBe("bottom");
			expect(
				resolveEdgeDropTargetHandle(sourceNode(), {
					x: 0,
					y: 2 * CELL_SIZE,
				}),
			).toBe("top");
		});

		it("대각선 배치에서는 수평 방향을 우선한다", () => {
			expect(
				resolveEdgeDropTargetHandle(sourceNode(), {
					x: 2 * CELL_SIZE,
					y: 2 * CELL_SIZE,
				}),
			).toBe("left");
			expect(
				resolveEdgeDropTargetHandle(sourceNode(), {
					x: 2 * CELL_SIZE,
					y: -2 * CELL_SIZE,
				}),
			).toBe("left");
			expect(
				resolveEdgeDropTargetHandle(sourceNode(), {
					x: -2 * CELL_SIZE,
					y: 2 * CELL_SIZE,
				}),
			).toBe("right");
			expect(
				resolveEdgeDropTargetHandle(sourceNode(), {
					x: -2 * CELL_SIZE,
					y: -2 * CELL_SIZE,
				}),
			).toBe("right");
		});

		it("중심점이 같으면 targetHandle을 지정하지 않는다", () => {
			expect(resolveEdgeDropTargetHandle(sourceNode(), { x: 0, y: 0 })).toBe(
				null,
			);
		});

		it("x축이 같고 target이 아래에 있으면 source 아래에서 target 위로 연결한다", () => {
			expect(
				resolveEdgeDropConnectionHandles(
					sourceNode(),
					{ x: 0, y: CELL_SIZE },
					"left",
				),
			).toEqual({
				sourceHandle: "bottom",
				targetHandle: "top",
			});
		});

		it("x축이 같고 target이 위에 있으면 source 위에서 target 아래로 연결한다", () => {
			expect(
				resolveEdgeDropConnectionHandles(
					sourceNode(),
					{ x: 0, y: -CELL_SIZE },
					"right",
				),
			).toEqual({
				sourceHandle: "top",
				targetHandle: "bottom",
			});
		});

		it("x축이 다르면 기존 sourceHandle을 유지하고 targetHandle만 방향에 맞춘다", () => {
			expect(
				resolveEdgeDropConnectionHandles(
					sourceNode(),
					{ x: 2 * CELL_SIZE, y: CELL_SIZE },
					"bottom",
				),
			).toEqual({
				sourceHandle: "bottom",
				targetHandle: "left",
			});
		});
	});
});
