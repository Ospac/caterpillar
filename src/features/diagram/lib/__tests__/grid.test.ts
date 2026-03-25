import { describe, expect, it } from "@rstest/core";
import { createDefaultBlockData } from "../../model/block";
import type { DiagramNode } from "../../model/type";
import {
	CELL_SIZE,
	cellCoordToPosition,
	clampPositionToStage,
	GRID_STAGES,
	getGridOccupancy,
	getNextStage,
	getNodeCells,
	getStagePixelSize,
	isCellCoordInsideMaxGrid,
	isNodeEscapingStage,
	positionToAnchorCell,
	toCellKey,
} from "../grid";
import { TALL_SPAN, WIDE_SPAN } from "../span";

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
		it(`stage가 8이면 stage pixel size로 ${8 * CELL_SIZE}를 반환한다`, () => {
			const pixelSize = getStagePixelSize(8);
			expect(pixelSize).toEqual(8 * CELL_SIZE);
		});
	});
	describe("toCellKey : cell 객체로 cell을 위한 key string 얻기", () => {
		it("cell이 {col: 1, row: 2}이면 key string으로 '1,2'를 반환한다", () => {
			const keyString = toCellKey({ col: 1, row: 2 });
			expect(keyString).toEqual("1,2");
		});
	});
	describe("positionToAnchorCell : position 객체로 가장 가까운 cell의 cellCoord 객체 얻기", () => {
		it("position이 {x: 0, y: 0}이면 가장 가까운 cell 좌표로 {col: 0, row: 0}을 반환한다", () => {
			const cellCoord = positionToAnchorCell({ x: 0, y: 0 }, 8, WIDE_SPAN);
			expect(cellCoord).toEqual({ col: 0, row: 0 });
		});
		it("position이 {x: 10 * CELL_SIZE, y: 4 * CELL_SIZE}이면 가장 가까운 cell 좌표로 {col: 10, row: 4}를 반환한다", () => {
			const cellCoord = positionToAnchorCell(
				{ x: 10 * CELL_SIZE, y: 4 * CELL_SIZE },
				14,
				WIDE_SPAN,
			);
			expect(cellCoord).toEqual({ col: 10, row: 4 });
		});
		it("1x2 tall span: position이 {x: 3 * CELL_SIZE, y: 2 * CELL_SIZE}이면 {col: 3, row: 2}를 반환한다", () => {
			const cellCoord = positionToAnchorCell(
				{ x: 3 * CELL_SIZE, y: 2 * CELL_SIZE },
				8,
				TALL_SPAN,
			);
			expect(cellCoord).toEqual({ col: 3, row: 2 });
		});
	});
	describe("cellCoordToPosition : cellCoord 객체로 position 객체로 얻기 ", () => {
		it("cellCoord가 {col: 0, row: 0}이면 position으로 {x: 0, y: 0}을 반환한다", () => {
			const cellCoord = cellCoordToPosition({ col: 0, row: 0 });
			expect(cellCoord).toEqual({ x: 0, y: 0 });
		});
		it(`cellCoord가 {col: 9, row: 9}이면 position으로 {x: ${9 * CELL_SIZE}, y: ${9 * CELL_SIZE}}를 반환한다`, () => {
			const cellCoord = cellCoordToPosition({ col: 9, row: 9 });
			expect(cellCoord).toEqual({ x: 9 * CELL_SIZE, y: 9 * CELL_SIZE });
		});
	});
	describe("isNodeEscapingStage : 주어진 node의 중심 position이 stage 밖에 있는지 검증 ", () => {
		it("stage가 8이고 중심 position이 (0, 0)이면 stage 밖이 아니므로 false를 반환한다", () => {
			const isPositionOutside = isNodeEscapingStage(
				{ x: 0, y: 0 },
				8,
				WIDE_SPAN,
			);
			expect(isPositionOutside).toEqual(false);
		});
		it("stage가 8이고 중심 position이 (-1, 0)이면 stage 밖이므로 true를 반환한다", () => {
			const isPositionOutside = isNodeEscapingStage(
				{ x: -1, y: 0 },
				8,
				WIDE_SPAN,
			);
			expect(isPositionOutside).toEqual(true);
		});
		it(`stage가 8이고 position이 (${7 * CELL_SIZE}, ${7 * CELL_SIZE})이면 경계 안이므로 false를 반환한다`, () => {
			const isPositionOutside = isNodeEscapingStage(
				{ x: 7 * CELL_SIZE, y: 7 * CELL_SIZE },
				8,
				WIDE_SPAN,
			);
			expect(isPositionOutside).toEqual(false);
		});
		it(`stage가 8이고 position이 (${7 * CELL_SIZE + 1}, ...)이면 경계를 벗어나므로 true를 반환한다`, () => {
			const isPositionOutside = isNodeEscapingStage(
				{
					x: 7 * CELL_SIZE + 1,
					y: 7 * CELL_SIZE,
				},
				8,
				WIDE_SPAN,
			);
			expect(isPositionOutside).toEqual(true);
		});
		it(`stage가 20이고 position이 (${19 * CELL_SIZE}, 0)이면 마지막 열 경계 안이므로 false를 반환한다`, () => {
			const isPositionOutside = isNodeEscapingStage(
				{
					x: 19 * CELL_SIZE,
					y: 0,
				},
				20,
				WIDE_SPAN,
			);
			expect(isPositionOutside).toEqual(false);
		});
	});
	describe("clampPositionToStage : position을 stage 범위 안으로 보정한다", () => {
		it("stage가 8이고 position이 음수이면 x와 y를 0으로 보정한다", () => {
			const clampedPosition = clampPositionToStage(
				{ x: -10, y: -20 },
				8,
				WIDE_SPAN,
			);
			expect(clampedPosition).toEqual({ x: 0, y: 0 });
		});
		it("stage가 8이고 position이 stage 범위 안이면 원래 좌표를 그대로 반환한다", () => {
			const clampedPosition = clampPositionToStage(
				{ x: 2 * CELL_SIZE, y: 4 * CELL_SIZE },
				8,
				WIDE_SPAN,
			);
			expect(clampedPosition).toEqual({ x: 2 * CELL_SIZE, y: 4 * CELL_SIZE });
		});
		it("stage가 8이고 position이 마지막 셀 내부에 있으면 최대 좌상단 좌표로 보정한다", () => {
			const clampedPosition = clampPositionToStage(
				{ x: 6 * CELL_SIZE + 1, y: 6 * CELL_SIZE + 1 },
				8,
				WIDE_SPAN,
			);
			expect(clampedPosition).toEqual({
				x: 6 * CELL_SIZE,
				y: 6 * CELL_SIZE,
			});
		});
		it("stage가 8이고 position이 최대 범위를 초과하면 최대 좌상단 좌표로 보정한다", () => {
			const clampedPosition = clampPositionToStage(
				{ x: 20 * CELL_SIZE, y: 10 * CELL_SIZE },
				8,
				WIDE_SPAN,
			);
			expect(clampedPosition).toEqual({
				x: 6 * CELL_SIZE,
				y: 6 * CELL_SIZE,
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
		it("cell 좌표가 마지막 유효 셀 {col: 19, row: 19}이면 최대 grid 범위 안이므로 true를 반환한다", () => {
			const isInside = isCellCoordInsideMaxGrid({ col: 19, row: 19 });
			expect(isInside).toEqual(true);
		});
		it("cell 좌표가 {col: 20, row: 19}이면 최대 grid 범위를 벗어나므로 false를 반환한다", () => {
			const isInside = isCellCoordInsideMaxGrid({ col: 20, row: 19 });
			expect(isInside).toEqual(false);
		});
		it("maxGridSize가 8이고 cell 좌표가 {col: 7, row: 7}이면 지정한 grid 범위 안이므로 true를 반환한다", () => {
			const isInside = isCellCoordInsideMaxGrid({ col: 7, row: 7 }, 8);
			expect(isInside).toEqual(true);
		});
		it("maxGridSize가 8이고 cell 좌표가 {col: 8, row: 7}이면 지정한 grid 범위를 벗어나므로 false를 반환한다", () => {
			const isInside = isCellCoordInsideMaxGrid({ col: 8, row: 7 }, 8);
			expect(isInside).toEqual(false);
		});
	});
	describe("getNodeCells : 앵커 셀과 스팬으로 점유 셀 목록을 반환한다", () => {
		it("2×2 span은 앵커 기준 4개 셀을 반환한다", () => {
			const cells = getNodeCells({ col: 2, row: 3 }, WIDE_SPAN);
			expect(cells).toEqual([
				{ col: 2, row: 3 },
				{ col: 3, row: 3 },
				{ col: 2, row: 4 },
				{ col: 3, row: 4 },
			]);
		});
		it("1×2 tall span은 앵커 기준 2개 셀을 반환한다", () => {
			const cells = getNodeCells({ col: 5, row: 1 }, TALL_SPAN);
			expect(cells).toEqual([
				{ col: 5, row: 1 },
				{ col: 5, row: 2 },
			]);
		});
	});
	describe("getGridOccupancy : 노드 목록의 셀 점유 현황을 계산한다", () => {
		const createNode = (
			id: string,
			x: number,
			y: number,
			blockType: "text" | "movie" = "text",
		): DiagramNode =>
			({
				id,
				position: { x, y },
				data: createDefaultBlockData(blockType, id),
				type: "block",
			}) as DiagramNode;

		it("2×2 텍스트 노드 하나는 4개 sub-cell을 점유한다", () => {
			const occupancy = getGridOccupancy([createNode("node-a", 0, 0)], 8);

			expect(occupancy.occupiedCellCount).toEqual(4);
			expect(occupancy.cellToNodeId.get("0,0")).toEqual("node-a");
			expect(occupancy.cellToNodeId.get("1,0")).toEqual("node-a");
			expect(occupancy.cellToNodeId.get("0,1")).toEqual("node-a");
			expect(occupancy.cellToNodeId.get("1,1")).toEqual("node-a");
		});

		it("1×2 movie 노드 하나는 2개 sub-cell을 점유한다", () => {
			const occupancy = getGridOccupancy(
				[createNode("node-a", 0, 0, "movie")],
				8,
			);

			expect(occupancy.occupiedCellCount).toEqual(2);
			expect(occupancy.cellToNodeId.get("0,0")).toEqual("node-a");
			expect(occupancy.cellToNodeId.get("0,1")).toEqual("node-a");
			expect(occupancy.cellToNodeId.size).toEqual(2);
		});

		it("서로 다른 앵커의 2×2 노드 2개는 8개 셀을 점유하고 충돌 없음", () => {
			const occupancy = getGridOccupancy(
				[
					createNode("node-a", 0, 0),
					createNode("node-b", 4 * CELL_SIZE, 0),
				],
				8,
			);

			expect(occupancy.occupiedCellCount).toEqual(8);
			expect(occupancy.conflictedCellKeys.size).toEqual(0);
			expect(occupancy.cellToNodeId.get("0,0")).toEqual("node-a");
			expect(occupancy.cellToNodeId.get("4,0")).toEqual("node-b");
		});

		it("같은 앵커에 2×2 노드 2개가 오면 4개 셀이 모두 충돌한다", () => {
			const occupancy = getGridOccupancy(
				[
					createNode("node-a", 0, 0),
					createNode("node-b", 10, 10),
				],
				8,
			);

			expect(occupancy.occupiedCellCount).toEqual(4);
			expect(occupancy.cellToNodeId.size).toEqual(0);
			expect(occupancy.conflictedCellKeys.size).toEqual(4);
		});

		it("인접 앵커의 2×2 노드들이 sub-cell을 부분 공유하면 해당 셀만 충돌한다", () => {
			// node-a: anchor {0,0} → {0,0},{1,0},{0,1},{1,1}
			// node-b: anchor {1,0} → {1,0},{2,0},{1,1},{2,1}  → {1,0},{1,1} 충돌
			const occupancy = getGridOccupancy(
				[
					createNode("node-a", 0, 0),
					createNode("node-b", 1 * CELL_SIZE, 0),
				],
				8,
			);

			expect(
				Array.from(occupancy.conflictedCellKeys).sort(),
			).toEqual(["1,0", "1,1"]);
			expect(occupancy.cellToNodeId.get("0,0")).toEqual("node-a");
			expect(occupancy.cellToNodeId.get("0,1")).toEqual("node-a");
			expect(occupancy.cellToNodeId.get("2,0")).toEqual("node-b");
			expect(occupancy.cellToNodeId.get("2,1")).toEqual("node-b");
		});

		it("최대 grid 범위 밖 노드는 점유 집계에서 제외한다", () => {
			const occupancy = getGridOccupancy(
				[
					createNode("node-a", 0, 0),
					createNode("node-b", 22 * CELL_SIZE, 22 * CELL_SIZE),
				],
				8,
			);

			expect(occupancy.occupiedCellCount).toEqual(4);
			expect(occupancy.cellToNodeId.get("0,0")).toEqual("node-a");
		});
	});
});
