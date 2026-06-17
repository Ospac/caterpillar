import { describe, expect, it } from "@rstest/core";
import { TALL_SPAN, WIDE_SPAN } from "../blockSpan";
import {
	applyFallback,
	commitDockedNodeState,
	createDockedNodeState,
	DROP_REASONS,
	FALLBACK_STRATEGIES,
	isDockableForSpan,
	resolveDropPosition,
} from "../docking";
import type { DockingInput, FallbackInput, GridOccupancy } from "../geometry";
import { CELL_SIZE, cellCoordToPosition } from "../grid";

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

	const fullOccupancy = (stage = 18): GridOccupancy => {
		const entries: Record<string, string> = {};
		for (let row = 0; row < stage; row += 1) {
			for (let col = 0; col < stage; col += 1) {
				entries[`${col},${row}`] = `node-${row * stage + col}`;
			}
		}
		return occupancyOf(entries);
	};

	it("도킹 상태는 현재 셀과 마지막 유효 셀만 보관한다", () => {
		const state = createDockedNodeState(
			{ x: 5 * CELL_SIZE, y: 2 * CELL_SIZE },
			WIDE_SPAN,
			18,
		);

		expect(state).toEqual({
			dockedCell: { col: 5, row: 2 },
			lastValidDock: { col: 5, row: 2 },
		});
		expect(commitDockedNodeState(state, { col: 6, row: 2 })).toEqual({
			dockedCell: { col: 6, row: 2 },
			lastValidDock: { col: 6, row: 2 },
		});
		expect(commitDockedNodeState(state, null)).toEqual({
			dockedCell: null,
			lastValidDock: { col: 5, row: 2 },
		});
	});

	it("스팬이 stage 경계를 넘거나 다른 노드 셀을 포함하면 도킹할 수 없다", () => {
		expect(
			isDockableForSpan({ col: 3, row: 17 }, TALL_SPAN, emptyOccupancy(), 18),
		).toBe(false);
		expect(
			isDockableForSpan(
				{ col: 0, row: 0 },
				WIDE_SPAN,
				occupancyOf({ "1,0": "node-a" }),
				18,
			),
		).toBe(false);
		expect(
			isDockableForSpan(
				{ col: 0, row: 0 },
				WIDE_SPAN,
				occupancyOf({
					"0,0": "self",
					"1,0": "self",
					"0,1": "self",
					"1,1": "self",
				}),
				18,
				"self",
			),
		).toBe(true);
	});

	it("드롭 실패 시 lastValidDock, nearest-empty-cell 순서로 복구한다", () => {
		const input = (overrides: Partial<FallbackInput> = {}): FallbackInput => ({
			position: { x: 2 * CELL_SIZE, y: 2 * CELL_SIZE },
			cellCount: 18,
			occupancy: emptyOccupancy(),
			span: WIDE_SPAN,
			lastValidDock: { col: 1, row: 0 },
			reason: DROP_REASONS.occupiedCell,
			...overrides,
		});

		expect(applyFallback(input())).toEqual({
			position: cellCoordToPosition({ col: 1, row: 0 }),
			strategy: FALLBACK_STRATEGIES.lastValidDock,
			cell: { col: 1, row: 0 },
		});

		const nearest = applyFallback(
			input({
				lastValidDock: { col: 1, row: 1 },
				occupancy: occupancyOf({
					"1,1": "node-a",
					"2,1": "node-a",
					"1,2": "node-a",
					"2,2": "node-a",
				}),
			}),
		);
		expect(nearest?.strategy).toBe(FALLBACK_STRATEGIES.nearestEmptyCell);

		expect(applyFallback(input({ occupancy: fullOccupancy(18) }))).toBeNull();
	});

	it("드롭 해석은 유효 도킹, 점유 충돌, stage 밖 fallback을 구분한다", () => {
		const input = (overrides: Partial<DockingInput> = {}): DockingInput => ({
			position: { x: CELL_SIZE, y: CELL_SIZE },
			cellCount: 18,
			occupancy: emptyOccupancy(),
			span: WIDE_SPAN,
			lastValidDock: { col: 0, row: 0 },
			...overrides,
		});

		expect(
			resolveDropPosition(
				input({ position: { x: 4 * CELL_SIZE, y: 2 * CELL_SIZE } }),
			),
		).toEqual({
			position: cellCoordToPosition({ col: 4, row: 2 }),
			cell: { col: 4, row: 2 },
			reason: DROP_REASONS.validDock,
			usedFallback: false,
		});

		expect(
			resolveDropPosition(
				input({
					position: { x: 4 * CELL_SIZE, y: 2 * CELL_SIZE },
					occupancy: occupancyOf({ "5,2": "node-a" }),
				}),
			),
		).toEqual({
			position: cellCoordToPosition({ col: 0, row: 0 }),
			cell: { col: 0, row: 0 },
			reason: DROP_REASONS.occupiedCell,
			strategy: FALLBACK_STRATEGIES.lastValidDock,
			usedFallback: true,
		});

		expect(
			resolveDropPosition(
				input({
					position: { x: -20, y: CELL_SIZE },
					lastValidDock: null,
					occupancy: fullOccupancy(18),
				}),
			),
		).toEqual({
			position: { x: -20, y: CELL_SIZE },
			cell: null,
			reason: DROP_REASONS.outsideStage,
			usedFallback: false,
		});
	});
});
