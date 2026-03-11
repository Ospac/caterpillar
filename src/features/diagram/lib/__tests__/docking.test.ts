/*
@TODO:
- applyFallback
  - lastValidDock가 유효하면 last-valid-dock 전략을 사용한다.
  - lastValidDock가 막혀 있으면 nearest-empty-cell 전략을 사용한다.
  - stage 전체가 막혀 있으면 clamp 전략을 사용한다.
  - nearest empty cell 탐색은 현재 위치와 가장 가까운 빈 셀을 고른다.
  - ignoreNodeId를 주면 자기 셀을 fallback 후보로 인정한다.

- resolveDropPosition
  - stage 안의 빈 nearest cell이면 valid-dock / usedFallback false
  - stage 밖 위치면 outside-stage + fallback
  - nearest cell이 점유 중이면 occupied-cell + fallback
  - fallback 결과의 strategy가 그대로 노출된다.
  - ignoreNodeId를 주면 자기 자리 드롭은 valid-dock 처리된다.

- clampDockPosition
  - stage 밖 좌표를 stage 내부 좌표로 보정한다.
  - 이미 유효한 좌표면 그대로 반환한다.
*/

import { describe, expect, it } from "@rstest/core";
import {
	createDockedNodeState,
	isDockableCell,
	transitionDockedNodeState,
} from "../docking";
import type {
	DockedNodeState,
	DockingEvent,
	DragCancelEvent,
	DragStopEvent,
	GridOccupancy,
} from "../type";

describe("docking(lib)", () => {
	describe("createDockedNodeState : position 객체로 DockedNodeState 객체를 생성한다", () => {
		it("position이 {x: 520, y: 144}이면 DockedNodeState로 {freePosition: {x:520, y:144}, dockedCell:{col:5, row:2}, lastValidDock:{col:5, row:2}}를 반환한다", () => {
			expect(createDockedNodeState({ x: 520, y: 144 }, 7)).toEqual({
				freePosition: { x: 520, y: 144 },
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
		describe("stage 경계 검사", () => {
			//경계 밖 판정은 occupancy 와 무관하게 false
			it("stage 범위 안이면 true", () => {
				expect(isDockableCell({ col: 3, row: 3 }, emptyOccupancy(), 4)).toEqual(
					true,
				);
			});
			it("col이 음수면 false", () => {
				expect(
					isDockableCell({ col: -1, row: 2 }, emptyOccupancy(), 4),
				).toEqual(false);
			});
			it("row가 음수면 false", () => {
				expect(
					isDockableCell({ col: 2, row: -1 }, emptyOccupancy(), 4),
				).toEqual(false);
			});
			it("stage 이상 col/row면 false", () => {
				expect(isDockableCell({ col: 4, row: 2 }, emptyOccupancy(), 4)).toEqual(
					false,
				);
			});
		});

		describe("점유 검사", () => {
			it("비어 있는 셀에 도킹하면 true", () => {
				const occupancy = occupancyOf({ "0,0": "node-a", "0,1": "node-b" });
				expect(isDockableCell({ col: 0, row: 2 }, occupancy, 4)).toEqual(true);
			});
			it("다른 노드가 점유한 셀에 도킹하면 false", () => {
				const occupancy = occupancyOf({ "1,2": "node-a" });
				expect(isDockableCell({ col: 1, row: 2 }, occupancy, 4)).toEqual(false);
			});
			it("충돌 상태인 셀에 도킹하면 false", () => {
				const occupancy = conflictedOccupancy("1,2");
				expect(isDockableCell({ col: 1, row: 2 }, occupancy, 4)).toEqual(false);
			});
		});

		describe("ignoreNodeId 예외", () => {
			it("ignoreNodeId가 node-a이고 셀 {1,2}를 node-a만 점유 중이면 true를 반환한다", () => {
				const occupancy = occupancyOf({
					"1,2": "node-a",
				});

				const result = isDockableCell(
					{ col: 1, row: 2 },
					occupancy,
					4,
					"node-a",
				);

				expect(result).toEqual(true);
			});

			it("ignoreNodeId가 node-a이고 셀 {1,2}를 node-b가 점유 중이면 false를 반환한다", () => {
				const occupancy = occupancyOf({
					"1,2": "node-b",
				});

				const result = isDockableCell(
					{ col: 1, row: 2 },
					occupancy,
					4,
					"node-a",
				);

				expect(result).toEqual(false);
			});

			it("ignoreNodeId가 있어도 충돌 상태인 셀은 false를 반환한다", () => {
				const occupancy = conflictedOccupancy("1,2");

				const result = isDockableCell(
					{ col: 1, row: 2 },
					occupancy,
					4,
					"node-a",
				);

				expect(result).toEqual(false);
			});
		});
	});
});
