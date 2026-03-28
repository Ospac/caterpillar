import { describe, expect, it } from "@rstest/core";
import {
	applyFallback,
	createDockedNodeState,
	DROP_REASONS,
	FALLBACK_STRATEGIES,
	isDockableCell,
	isDockableForSpan,
	resolveDropPosition,
	transitionDockedNodeState,
} from "../docking";
import { CELL_SIZE, cellCoordToPosition } from "../grid";
import { TALL_SPAN, WIDE_SPAN } from "../span";
import type {
	DockedNodeState,
	DockingEvent,
	DockingInput,
	DragCancelEvent,
	DragStopEvent,
	FallbackInput,
	GridOccupancy,
} from "../type";

describe("docking(lib)", () => {
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

	const conflictedOccupancy = (...keys: string[]): GridOccupancy => ({
		occupiedCellCount: keys.length,
		cellToNodeId: new Map(),
		conflictedCellKeys: new Set(keys),
	});

	/** stage=8 기준으로 모든 sub-cell을 채운 occupancy */
	const fullOccupancy = (stage = 8): GridOccupancy => {
		const entries: Record<string, string> = {};
		for (let r = 0; r < stage; r++) {
			for (let c = 0; c < stage; c++) {
				entries[`${c},${r}`] = `node-${r * stage + c}`;
			}
		}
		return occupancyOf(entries);
	};

	describe("createDockedNodeState : position 객체로 DockedNodeState 객체를 생성한다", () => {
		it(`position이 {x: ${5 * CELL_SIZE}, y: ${2 * CELL_SIZE}}이면 DockedNodeState로 dockedCell:{col:5, row:2}를 반환한다`, () => {
			expect(
				createDockedNodeState(
					{ x: 5 * CELL_SIZE, y: 2 * CELL_SIZE },
					14,
					WIDE_SPAN,
				),
			).toEqual({
				freePosition: { x: 5 * CELL_SIZE, y: 2 * CELL_SIZE },
				dockedCell: { col: 5, row: 2 },
				lastValidDock: { col: 5, row: 2 },
			});
		});
	});
	describe("transitionDockedNodeState : dockingEvent에 따라 nodeState를 갱신한다. ", () => {
		const initialNodeState = (): DockedNodeState => ({
			freePosition: { x: 0, y: 0 },
			dockedCell: { col: 0, row: 0 },
			lastValidDock: { col: 0, row: 0 },
		});

		it("dragStart event는 freePosition만 갱신한다", () => {
			const nodeState = initialNodeState();
			const dragStartEvent = {
				type: "dragStart",
				position: { x: 300, y: 0 },
			} as DockingEvent;

			expect(transitionDockedNodeState(nodeState, dragStartEvent)).toEqual({
				freePosition: { x: 300, y: 0 },
				dockedCell: { col: 0, row: 0 },
				lastValidDock: { col: 0, row: 0 },
			});
		});
		it("dragMove event는 freePosition만 갱신한다", () => {
			const nodeState = initialNodeState();
			const dragMoveEvent = {
				type: "dragMove",
				position: { x: 300, y: 0 },
			} as DockingEvent;

			expect(transitionDockedNodeState(nodeState, dragMoveEvent)).toEqual({
				freePosition: { x: 300, y: 0 },
				dockedCell: { col: 0, row: 0 },
				lastValidDock: { col: 0, row: 0 },
			});
		});
		it("dragStop event는 freePosition, dockedCell을 갱신한다. dockedCell이 null이 아니면 lastValidDock도 갱신한다 ", () => {
			const nodeState = initialNodeState();
			const dragStopEvent = {
				type: "dragStop",
				position: { x: 190, y: 190 },
				dockedCell: { col: 2, row: 2 },
			} as DragStopEvent;

			expect(transitionDockedNodeState(nodeState, dragStopEvent)).toEqual({
				freePosition: { x: 190, y: 190 },
				dockedCell: { col: 2, row: 2 },
				lastValidDock: { col: 2, row: 2 },
			});
		});
		it("dragStop event에서 dockedCell이 null이라면 lastValidDock은 갱신하지 않는다. ", () => {
			const nodeState = initialNodeState();
			const dragStopEvent = {
				type: "dragStop",
				position: { x: -200, y: 190 },
				dockedCell: null,
			} as DragStopEvent;

			expect(transitionDockedNodeState(nodeState, dragStopEvent)).toEqual({
				freePosition: { x: -200, y: 190 },
				dockedCell: null,
				lastValidDock: { col: 0, row: 0 },
			});
		});
		it("dragCancelEvent는 lastValidDock 기준 위치로 freePosition을 복구한다 ", () => {
			const nodeState = {
				freePosition: { x: 190, y: 190 },
				dockedCell: { col: 0, row: 0 },
				lastValidDock: { col: 0, row: 0 },
			};
			const dragCancelEvent = {
				type: "dragCancel",
			} as DragCancelEvent;

			expect(transitionDockedNodeState(nodeState, dragCancelEvent)).toEqual(
				initialNodeState(),
			);
		});
		it("dragCancel은 lastValidDock가 없으면 dockedCell 기준 위치로 복구한다", () => {
			const nodeState = {
				freePosition: { x: 190, y: 190 },
				dockedCell: { col: 0, row: 0 },
				lastValidDock: null,
			};
			const dragCancelEvent = {
				type: "dragCancel",
			} as DragCancelEvent;

			expect(transitionDockedNodeState(nodeState, dragCancelEvent)).toEqual({
				freePosition: { x: 0, y: 0 },
				dockedCell: { col: 0, row: 0 },
				lastValidDock: null,
			});
		});
	});
	describe("isDockableCell : 셀이 현재 stage에서 도킹 가능한지 판정한다", () => {
		describe("stage 경계 검사", () => {
			it("stage 범위 안이면 true", () => {
				expect(isDockableCell({ col: 3, row: 3 }, emptyOccupancy(), 8)).toEqual(
					true,
				);
			});
			it("col이 음수면 false", () => {
				expect(
					isDockableCell({ col: -1, row: 2 }, emptyOccupancy(), 8),
				).toEqual(false);
			});
			it("row가 음수면 false", () => {
				expect(
					isDockableCell({ col: 2, row: -1 }, emptyOccupancy(), 8),
				).toEqual(false);
			});
			it("stage 이상 col/row면 false", () => {
				expect(isDockableCell({ col: 8, row: 2 }, emptyOccupancy(), 8)).toEqual(
					false,
				);
			});
		});

		describe("점유 검사", () => {
			it("비어 있는 셀에 도킹하면 true", () => {
				const occupancy = occupancyOf({ "0,0": "node-a", "0,1": "node-b" });
				expect(isDockableCell({ col: 0, row: 2 }, occupancy, 8)).toEqual(true);
			});
			it("다른 노드가 점유한 셀에 도킹하면 false", () => {
				const occupancy = occupancyOf({ "1,2": "node-a" });
				expect(isDockableCell({ col: 1, row: 2 }, occupancy, 8)).toEqual(false);
			});
			it("충돌 상태인 셀에 도킹하면 false", () => {
				const occupancy = conflictedOccupancy("1,2");
				expect(isDockableCell({ col: 1, row: 2 }, occupancy, 8)).toEqual(false);
			});
		});

		describe("ignoreNodeId 예외", () => {
			it("ignoreNodeId가 node-a이고 셀 {1,2}를 node-a만 점유 중이면 true를 반환한다", () => {
				const occupancy = occupancyOf({ "1,2": "node-a" });
				expect(
					isDockableCell({ col: 1, row: 2 }, occupancy, 8, "node-a"),
				).toEqual(true);
			});
			it("ignoreNodeId가 node-a이고 셀 {1,2}를 node-b가 점유 중이면 false를 반환한다", () => {
				const occupancy = occupancyOf({ "1,2": "node-b" });
				expect(
					isDockableCell({ col: 1, row: 2 }, occupancy, 8, "node-a"),
				).toEqual(false);
			});
			it("ignoreNodeId가 있어도 충돌 상태인 셀은 false를 반환한다", () => {
				const occupancy = conflictedOccupancy("1,2");
				expect(
					isDockableCell({ col: 1, row: 2 }, occupancy, 8, "node-a"),
				).toEqual(false);
			});
		});
	});

	describe("isDockableForSpan : 앵커+스팬으로 확장했을 때 모든 셀이 도킹 가능한지 판정한다", () => {
		it("2×2 span 앵커 {0,0}가 모두 비어 있으면 true를 반환한다", () => {
			expect(
				isDockableForSpan({ col: 0, row: 0 }, WIDE_SPAN, emptyOccupancy(), 8),
			).toEqual(true);
		});
		it("2×2 span 앵커 {0,0}에서 {1,0}이 점유되어 있으면 false를 반환한다", () => {
			const occupancy = occupancyOf({ "1,0": "node-a" });
			expect(
				isDockableForSpan({ col: 0, row: 0 }, WIDE_SPAN, occupancy, 8),
			).toEqual(false);
		});
		it("1×2 tall span 앵커 {3,5}가 stage 경계 안이고 비어 있으면 true를 반환한다", () => {
			expect(
				isDockableForSpan({ col: 3, row: 5 }, TALL_SPAN, emptyOccupancy(), 8),
			).toEqual(true);
		});
		it("1×2 tall span 앵커 {3,7}는 row+1=8이 stage 밖이므로 false를 반환한다", () => {
			expect(
				isDockableForSpan({ col: 3, row: 7 }, TALL_SPAN, emptyOccupancy(), 8),
			).toEqual(false);
		});
		it("ignoreNodeId를 주면 자기 셀은 통과한다", () => {
			const occupancy = occupancyOf({
				"0,0": "self",
				"1,0": "self",
				"0,1": "self",
				"1,1": "self",
			});
			expect(
				isDockableForSpan({ col: 0, row: 0 }, WIDE_SPAN, occupancy, 8, "self"),
			).toEqual(true);
		});
	});

	describe("applyFallback : 유효한 도킹 셀을 즉시 확정할 수 없을 때 대체 위치를 계산한다", () => {
		const fallbackInput = (
			overrides: Partial<FallbackInput> = {},
		): FallbackInput => ({
			position: { x: CELL_SIZE, y: CELL_SIZE },
			stage: 8,
			occupancy: emptyOccupancy(),
			span: WIDE_SPAN,
			lastValidDock: { col: 0, row: 0 },
			reason: DROP_REASONS.occupiedCell,
			...overrides,
		});

		it("lastValidDock가 유효하면 해당 셀로 복귀한다", () => {
			const result = applyFallback(
				fallbackInput({
					position: { x: 2 * CELL_SIZE, y: 2 * CELL_SIZE },
					lastValidDock: { col: 1, row: 0 },
				}),
			);

			expect(result).toEqual({
				position: cellCoordToPosition({ col: 1, row: 0 }),
				strategy: FALLBACK_STRATEGIES.lastValidDock,
				cell: { col: 1, row: 0 },
			});
		});

		it("lastValidDock가 막혀 있으면 가장 가까운 빈 앵커를 탐색하여 복귀한다", () => {
			const result = applyFallback(
				fallbackInput({
					position: { x: 2 * CELL_SIZE, y: 2 * CELL_SIZE },
					lastValidDock: { col: 1, row: 1 },
					// {1,1},{2,1},{1,2},{2,2} + {2,2},{3,2},{2,3},{3,3} 점유
					occupancy: occupancyOf({
						"1,1": "node-a",
						"2,1": "node-a",
						"1,2": "node-a",
						"2,2": "node-a",
					}),
				}),
			);

			expect(result?.strategy).toEqual(FALLBACK_STRATEGIES.nearestEmptyCell);
		});

		it("stage 전체가 막혀 있으면 null을 반환한다", () => {
			const result = applyFallback(
				fallbackInput({
					occupancy: fullOccupancy(8),
				}),
			);

			expect(result).toEqual(null);
		});

		it("nearest empty cell 탐색은 현재 위치와 가장 가까운 빈 앵커를 고른다", () => {
			const result = applyFallback(
				fallbackInput({
					position: { x: -30, y: -30 },
					lastValidDock: null,
					occupancy: occupancyOf({
						"2,0": "node-a",
						"0,2": "node-b",
						"2,2": "node-c",
					}),
				}),
			);

			expect(result).toEqual({
				position: cellCoordToPosition({ col: 0, row: 0 }),
				strategy: FALLBACK_STRATEGIES.nearestEmptyCell,
				cell: { col: 0, row: 0 },
			});
		});

		it("ignoreNodeId를 주면 자기 셀을 fallback 후보로 인정한다", () => {
			const result = applyFallback(
				fallbackInput({
					lastValidDock: { col: 2, row: 1 },
					occupancy: occupancyOf({
						"2,1": "node-self",
						"3,1": "node-self",
						"2,2": "node-self",
						"3,2": "node-self",
						"0,0": "node-a",
					}),
					ignoreNodeId: "node-self",
				}),
			);

			expect(result).toEqual({
				position: cellCoordToPosition({ col: 2, row: 1 }),
				strategy: FALLBACK_STRATEGIES.lastValidDock,
				cell: { col: 2, row: 1 },
			});
		});
	});
	describe("resolveDropPosition : 드롭 좌표를 최종 배치 위치로 변환한다", () => {
		const dockingInput = (
			overrides: Partial<DockingInput> = {},
		): DockingInput => ({
			position: { x: CELL_SIZE, y: CELL_SIZE },
			stage: 8,
			occupancy: emptyOccupancy(),
			span: WIDE_SPAN,
			lastValidDock: { col: 0, row: 0 },
			...overrides,
		});

		it("stage 안의 빈 nearest cell이면 valid-dock / usedFallback false를 반환한다", () => {
			const result = resolveDropPosition(
				dockingInput({
					position: { x: 4 * CELL_SIZE, y: 2 * CELL_SIZE },
				}),
			);

			expect(result).toEqual({
				position: cellCoordToPosition({ col: 4, row: 2 }),
				cell: { col: 4, row: 2 },
				reason: DROP_REASONS.validDock,
				usedFallback: false,
			});
		});

		it("stage 밖 위치면 outside-stage 사유로 fallback 결과를 반환한다", () => {
			const result = resolveDropPosition(
				dockingInput({
					position: { x: -20, y: CELL_SIZE },
					lastValidDock: { col: 1, row: 0 },
				}),
			);

			expect(result).toEqual({
				position: cellCoordToPosition({ col: 1, row: 0 }),
				cell: { col: 1, row: 0 },
				reason: DROP_REASONS.outsideStage,
				strategy: FALLBACK_STRATEGIES.lastValidDock,
				usedFallback: true,
			});
		});

		it("nearest cell의 span이 점유 중이면 occupied-cell 사유로 fallback 결과를 반환한다", () => {
			const result = resolveDropPosition(
				dockingInput({
					position: { x: 4 * CELL_SIZE, y: 2 * CELL_SIZE },
					lastValidDock: { col: 0, row: 0 },
					// anchor {4,2}의 sub-cell 중 하나를 점유
					occupancy: occupancyOf({ "5,2": "node-a" }),
				}),
			);

			expect(result).toEqual({
				position: cellCoordToPosition({ col: 0, row: 0 }),
				cell: { col: 0, row: 0 },
				reason: DROP_REASONS.occupiedCell,
				strategy: FALLBACK_STRATEGIES.lastValidDock,
				usedFallback: true,
			});
		});

		it("fallback으로 nearest-empty-cell이 선택되면 strategy를 그대로 노출한다", () => {
			const result = resolveDropPosition(
				dockingInput({
					position: { x: 4 * CELL_SIZE, y: 4 * CELL_SIZE },
					lastValidDock: { col: 4, row: 4 },
					// anchor {4,4}의 모든 sub-cell 점유
					occupancy: occupancyOf({
						"4,4": "node-a",
						"5,4": "node-a",
						"4,5": "node-a",
						"5,5": "node-a",
					}),
				}),
			);

			expect(result.reason).toEqual(DROP_REASONS.occupiedCell);
			expect(result.strategy).toEqual(FALLBACK_STRATEGIES.nearestEmptyCell);
			expect(result.usedFallback).toEqual(true);
		});

		it("ignoreNodeId를 주면 자기 자리 드롭은 valid-dock 처리된다", () => {
			const result = resolveDropPosition(
				dockingInput({
					position: { x: 4 * CELL_SIZE, y: 2 * CELL_SIZE },
					occupancy: occupancyOf({
						"4,2": "node-self",
						"5,2": "node-self",
						"4,3": "node-self",
						"5,3": "node-self",
					}),
					ignoreNodeId: "node-self",
				}),
			);

			expect(result).toEqual({
				position: cellCoordToPosition({ col: 4, row: 2 }),
				cell: { col: 4, row: 2 },
				reason: DROP_REASONS.validDock,
				usedFallback: false,
			});
		});

		it("fallback도 실패하면 현재 position을 유지하고 cell null을 반환한다", () => {
			const result = resolveDropPosition(
				dockingInput({
					position: { x: -20, y: CELL_SIZE },
					lastValidDock: null,
					occupancy: fullOccupancy(8),
				}),
			);

			expect(result).toEqual({
				position: { x: -20, y: CELL_SIZE },
				cell: null,
				reason: DROP_REASONS.outsideStage,
				usedFallback: false,
			});
		});

		it("1×2 tall span 노드는 2개 sub-cell을 점유하여 도킹 판정한다", () => {
			const result = resolveDropPosition(
				dockingInput({
					position: { x: 2 * CELL_SIZE, y: 3 * CELL_SIZE },
					span: TALL_SPAN,
					occupancy: emptyOccupancy(),
					lastValidDock: null,
				}),
			);

			expect(result).toEqual({
				position: cellCoordToPosition({ col: 2, row: 3 }),
				cell: { col: 2, row: 3 },
				reason: DROP_REASONS.validDock,
				usedFallback: false,
			});
		});
	});
});
