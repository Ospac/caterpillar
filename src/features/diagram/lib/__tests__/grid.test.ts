import { describe, expect, it } from "@rstest/core";
import { createDefaultBlockData } from "../../model/block";
import {
	cellCoordToPosition,
	clampPositionToStage,
	GRID_STAGES,
	getGridOccupancy,
	getNextStage,
	getStagePixelSize,
	isCellCoordInsideMaxGrid,
	isNodeCenterOutsideStage,
	NODE_SIZE,
	positionToNearestCellCoord,
	toCellKey,
} from "../grid";
import type { DiagramNode } from "../type";

describe("grid(lib)", () => {
	describe("getNextStage: 다음 stage 값을 얻기", () => {
		it(`현재 stage가 ${GRID_STAGES[0]}이면 다음 stage로 ${GRID_STAGES[1]}을 반환한다`, () => {
			const stage = getNextStage(GRID_STAGES[0]);
			expect(stage).toEqual(GRID_STAGES[1]);
		});
		it(`현재 stage가 ${GRID_STAGES[1]}이면 다음 stage로 ${GRID_STAGES[2]}을 반환한다`, () => {
			const stage = getNextStage(GRID_STAGES[1]);
			expect(stage).toEqual(GRID_STAGES[2]);
		});
		it(`현재 stage가 ${GRID_STAGES[2]}이면 마지막 stage이므로 ${GRID_STAGES[2]}을 그대로 반환한다`, () => {
			const stage = getNextStage(GRID_STAGES[2]);
			expect(stage).toEqual(GRID_STAGES[2]);
		});
	});
	describe("getStagePixelSize : stage 값으로 stage의 pixel 사이즈 얻기", () => {
		it(`stage가 4이면 stage pixel size로 ${4 * NODE_SIZE}를 반환한다`, () => {
			const pixelSize = getStagePixelSize(4);
			expect(pixelSize).toEqual(4 * NODE_SIZE);
		});
	});
	describe("toCellKey : cell 객체로 cell을 위한 key string 얻기", () => {
		it("cell이 {col: 1, row: 2}이면 key string으로 '1,2'를 반환한다", () => {
			const keyString = toCellKey({ col: 1, row: 2 });
			expect(keyString).toEqual("1,2");
		});
	});
	describe("positionToNearestCellCoord : position 객체로 가장 가까운 cell의 cellCoord 객체 얻기", () => {
		it("position이 {x: 0, y: 0}이면 가장 가까운 cell 좌표로 {col: 0, row: 0}을 반환한다", () => {
			const cellCoord = positionToNearestCellCoord({ x: 0, y: 0 }, 4);
			expect(cellCoord).toEqual({ col: 0, row: 0 });
		});
		it("position이 {x: 520, y: 144}이면 가장 가까운 cell 좌표로 {col: 5, row: 2}를 반환한다", () => {
			const cellCoord = positionToNearestCellCoord({ x: 520, y: 144 }, 7);
			expect(cellCoord).toEqual({ col: 5, row: 2 });
		});
	});
	describe("cellCoordToPosition : cellCoord 객체로 position 객체로 얻기 ", () => {
		it("cellCoord가 {col: 0, row: 0}이면 position으로 {x: 0, y: 0}을 반환한다", () => {
			const cellCoord = cellCoordToPosition({ col: 0, row: 0 });
			expect(cellCoord).toEqual({ x: 0, y: 0 });
		});
		it(`cellCoord가 {col: 9, row: 9}이면 position으로 {x: ${9 * NODE_SIZE}, y: ${9 * NODE_SIZE}}를 반환한다`, () => {
			const cellCoord = cellCoordToPosition({ col: 9, row: 9 });
			expect(cellCoord).toEqual({ x: 9 * NODE_SIZE, y: 9 * NODE_SIZE });
		});
	});
	describe("isNodeCenterOutsideStage : 주어진 node의 중심 position이 stage 밖에 있는지 검증 ", () => {
		it("stage가 4이고 중심 position이 (0, 0)이면 stage 밖이 아니므로 false를 반환한다", () => {
			const isPositionOutside = isNodeCenterOutsideStage({ x: 0, y: 0 }, 4);
			expect(isPositionOutside).toEqual(false);
		});
		it("stage가 4이고 중심 position이 (-1, 0)이면 stage 밖이므로 true를 반환한다", () => {
			const isPositionOutside = isNodeCenterOutsideStage({ x: -1, y: 0 }, 4);
			expect(isPositionOutside).toEqual(true);
		});
		it(`stage가 4이고 중심 position이 (${NODE_SIZE * 3 + NODE_SIZE / 2}, ${NODE_SIZE * 3 + NODE_SIZE / 2})이면 경계 안이므로 false를 반환한다`, () => {
			const isPositionOutside = isNodeCenterOutsideStage(
				{ x: NODE_SIZE * 3 + NODE_SIZE / 2, y: NODE_SIZE * 3 + NODE_SIZE / 2 },
				4,
			);
			expect(isPositionOutside).toEqual(false);
		});
		it(`stage가 4이고 중심 position이 (${NODE_SIZE * 3 + NODE_SIZE / 2 + 1}, ${NODE_SIZE * 3 + NODE_SIZE / 2})이면 경계를 벗어나므로 true를 반환한다`, () => {
			const isPositionOutside = isNodeCenterOutsideStage(
				{
					x: NODE_SIZE * 3 + NODE_SIZE / 2 + 1,
					y: NODE_SIZE * 3 + NODE_SIZE / 2,
				},
				4,
			);
			expect(isPositionOutside).toEqual(true);
		});
		it(`stage가 10이고 중심 position이 (${NODE_SIZE * 9 + NODE_SIZE / 2}, 0)이면 마지막 열 경계 안이므로 false를 반환한다`, () => {
			const isPositionOutside = isNodeCenterOutsideStage(
				{
					x: NODE_SIZE * 9 + NODE_SIZE / 2,
					y: 0,
				},
				10,
			);
			expect(isPositionOutside).toEqual(false);
		});
	});
	describe("clampPositionToStage : position을 stage 범위 안으로 보정한다", () => {
		it("stage가 4이고 position이 음수이면 x와 y를 0으로 보정한다", () => {
			const clampedPosition = clampPositionToStage({ x: -10, y: -20 }, 4);
			expect(clampedPosition).toEqual({ x: 0, y: 0 });
		});
		it("stage가 4이고 position이 stage 범위 안이면 원래 좌표를 그대로 반환한다", () => {
			const clampedPosition = clampPositionToStage(
				{ x: NODE_SIZE, y: NODE_SIZE * 2 },
				4,
			);
			expect(clampedPosition).toEqual({ x: NODE_SIZE, y: NODE_SIZE * 2 });
		});
		it("stage가 4이고 position이 마지막 셀 내부에 있으면 마지막 셀의 좌상단 좌표로 보정한다", () => {
			const clampedPosition = clampPositionToStage(
				{ x: NODE_SIZE * 3 + 1, y: NODE_SIZE * 3 + 1 },
				4,
			);
			expect(clampedPosition).toEqual({
				x: NODE_SIZE * 3,
				y: NODE_SIZE * 3,
			});
		});
		it("stage가 4이고 position이 최대 범위를 초과하면 마지막 셀의 좌상단 좌표로 보정한다", () => {
			const clampedPosition = clampPositionToStage(
				{ x: NODE_SIZE * 10, y: NODE_SIZE * 5 },
				4,
			);
			expect(clampedPosition).toEqual({
				x: NODE_SIZE * 3,
				y: NODE_SIZE * 3,
			});
		});
	});
	describe("isCellCoordInsideMaxGrid : cell 좌표가 최대 grid 범위 안에 있는지 검증한다", () => {
		it("cell 좌표가 {col: 0, row: 0}이면 최대 grid 범위 안이므로 true를 반환한다", () => {
			const isInside = isCellCoordInsideMaxGrid({ col: 0, row: 0 });
			expect(isInside).toEqual(true);
		});
		it("cell 좌표가 {col: -1, row: 0}이면 최대 grid 범위를 벗어나므로 false를 반환한다", () => {
			const isInside = isCellCoordInsideMaxGrid({ col: -1, row: 0 });
			expect(isInside).toEqual(false);
		});
		it("cell 좌표가 마지막 유효 셀 {col: 9, row: 9}이면 최대 grid 범위 안이므로 true를 반환한다", () => {
			const isInside = isCellCoordInsideMaxGrid({ col: 9, row: 9 });
			expect(isInside).toEqual(true);
		});
		it("cell 좌표가 {col: 10, row: 9}이면 최대 grid 범위를 벗어나므로 false를 반환한다", () => {
			const isInside = isCellCoordInsideMaxGrid({ col: 10, row: 9 });
			expect(isInside).toEqual(false);
		});
		it("maxGridSize가 4이고 cell 좌표가 {col: 3, row: 3}이면 지정한 grid 범위 안이므로 true를 반환한다", () => {
			const isInside = isCellCoordInsideMaxGrid({ col: 3, row: 3 }, 4);
			expect(isInside).toEqual(true);
		});
		it("maxGridSize가 4이고 cell 좌표가 {col: 4, row: 3}이면 지정한 grid 범위를 벗어나므로 false를 반환한다", () => {
			const isInside = isCellCoordInsideMaxGrid({ col: 4, row: 3 }, 4);
			expect(isInside).toEqual(false);
		});
	});
	describe("getGridOccupancy : 노드 목록의 셀 점유 현황을 계산한다", () => {
		const createNode = (id: string, x: number, y: number): DiagramNode =>
			({
				id,
				position: { x, y },
				data: createDefaultBlockData("text", id),
				type: "block",
			}) as DiagramNode;

		it("서로 다른 셀에 있는 노드들을 cellToNodeId에 단일 값으로 기록한다", () => {
			const occupancy = getGridOccupancy(
				[
					createNode("node-a", 0, 0),
					createNode("node-b", NODE_SIZE, NODE_SIZE * 2),
				],
				4,
			);

			expect(occupancy.occupiedCellCount).toEqual(2);
			expect(Array.from(occupancy.cellToNodeId.entries())).toEqual([
				["0,0", "node-a"],
				["1,2", "node-b"],
			]);
		});

		it("같은 셀에 여러 노드가 오면 첫 점유 노드만 유지한다", () => {
			const occupancy = getGridOccupancy(
				[
					createNode("node-a", 0, 0),
					createNode("node-b", 10, 10),
					createNode("node-c", 20, 20),
				],
				4,
			);

			expect(occupancy.occupiedCellCount).toEqual(1);
			expect(Array.from(occupancy.cellToNodeId.entries())).toEqual([]);
			expect(Array.from(occupancy.conflictedCellKeys)).toEqual(["0,0"]);
		});

		it("최대 grid 범위 밖 노드는 점유 집계에서 제외한다", () => {
			const occupancy = getGridOccupancy(
				[
					createNode("node-a", 0, 0),
					createNode("node-b", NODE_SIZE * 11, NODE_SIZE * 11),
				],
				4,
			);

			expect(occupancy.occupiedCellCount).toEqual(1);
			expect(Array.from(occupancy.cellToNodeId.entries())).toEqual([
				["0,0", "node-a"],
			]);
			expect(Array.from(occupancy.conflictedCellKeys)).toEqual([]);
		});

		it("충돌이 없는 셀과 충돌 셀을 함께 집계한다", () => {
			const occupancy = getGridOccupancy(
				[
					createNode("node-a", 0, 0),
					createNode("node-b", NODE_SIZE, 0),
					createNode("node-c", NODE_SIZE + 10, 10),
				],
				4,
			);

			expect(occupancy.occupiedCellCount).toEqual(2);
			expect(Array.from(occupancy.cellToNodeId.entries())).toEqual([
				["0,0", "node-a"],
			]);
			expect(Array.from(occupancy.conflictedCellKeys)).toEqual(["1,0"]);
		});
	});
});
