import {
	cellCoordToPosition,
	clampPositionToStage,
	isNodeCenterOutsideStage,
	NODE_SIZE,
	positionToNearestCellCoord,
} from "./grid";
import type {
	CellCoord,
	DockedNodeState,
	DockingEvent,
	DockingInput,
	FallbackInput,
	FallbackResult,
	GridOccupancy,
	GridStage,
	ResolveDropResult,
	XYPosition,
} from "./type";

export const SNAP_IN_DISTANCE = 40;
export const SNAP_OUT_DISTANCE = 56;

// 디버깅 용도 상수들
export const DROP_REASONS = {
	validDock: "valid-dock",
	outsideStage: "outside-stage",
	occupiedCell: "occupied-cell",
	noNearestCell: "no-nearest-cell",
} as const;

export const FALLBACK_STRATEGIES = {
	lastValidDock: "last-valid-dock",
	nearestEmptyCell: "nearest-empty-cell",
	clamp: "clamp",
} as const;

export const DRAG_EVENT_TRANSITIONS = {
	dragStart: "freePosition만 현재 좌표로 갱신하고 도킹 기준점은 유지한다.",
	dragMove: "freePosition만 드래그 좌표로 갱신한다.",
	dragStop:
		"최종 좌표와 확정 dockedCell을 반영하고, 유효한 dockedCell이면 lastValidDock도 갱신한다.",
	dragCancel:
		"lastValidDock 또는 dockedCell 기준 위치로 freePosition을 복구한다.",
} as const;

export function createDockedNodeState(
	position: XYPosition,
	stage: GridStage,
): DockedNodeState {
	const dockedCell = positionToNearestCellCoord(position, stage);

	return {
		freePosition: position,
		dockedCell,
		lastValidDock: dockedCell,
	};
}

export function transitionDockedNodeState(
	state: DockedNodeState,
	event: DockingEvent,
): DockedNodeState {
	switch (event.type) {
		case "dragStart":
		case "dragMove":
			return {
				...state,
				freePosition: event.position,
			};
		case "dragStop":
			return {
				freePosition: event.position,
				dockedCell: event.dockedCell,
				lastValidDock: event.dockedCell ?? state.lastValidDock,
			};
		case "dragCancel": {
			const anchorCell = state.lastValidDock ?? state.dockedCell;
			return {
				...state,
				freePosition: anchorCell
					? cellCoordToPosition(anchorCell)
					: state.freePosition,
			};
		}
	}
}

/**
 * 주어진 grid cell이 현재 stage 안에서 도킹 가능한지 판정한다.
 *
 * 판정 규칙은 다음과 같다.
 * - `cell.col`, `cell.row`가 `0 <= index < stage` 범위를 벗어나면 `false`
 * - 해당 셀에 점유한 노드가 없으면 `true`
 * - `ignoreNodeId`가 없으면 다른 노드가 이미 점유 중인 셀이므로 `false`
 * - `ignoreNodeId`가 있으면, 그 셀 점유자가 자기 자신(`ignoreNodeId`)일 때만 `true`
 *
 * 이 함수는 드래그 중인 노드가 "원래 자기 셀" 위에 다시 드롭되는 상황에서
 * 자기 자신을 충돌로 오판하지 않도록 `ignoreNodeId`를 지원한다.
 *
 * @param cell 도킹 가능 여부를 검사할 대상 셀 좌표
 * @param occupancy 현재 grid 점유 상태. `cellToNodeId`에서 `"col,row"` 키를 사용한다.
 * @param stage 현재 활성 grid stage 크기. 유효 셀 범위는 `0`부터 `stage - 1`까지다.
 * @param ignoreNodeId 충돌 검사에서 제외할 노드 id. 보통 현재 드래그 중인 노드 id를 넘긴다.
 * @returns 해당 셀이 현재 조건에서 도킹 가능하면 `true`, 아니면 `false`
 */
export function isDockableCell(
	cell: CellCoord,
	occupancy: GridOccupancy,
	stage: GridStage,
	ignoreNodeId?: string,
): boolean {
	if (cell.col < 0 || cell.row < 0 || cell.col >= stage || cell.row >= stage) {
		return false;
	}

	const key = `${cell.col},${cell.row}`;
	if (occupancy.conflictedCellKeys.has(key)) {
		return false;
	}

	const occupantId = occupancy.cellToNodeId.get(key);
	if (!occupantId) {
		return true;
	}

	if (!ignoreNodeId) {
		return false;
	}

	return occupantId === ignoreNodeId;
}

function getNearestEmptyCell(input: DockingInput): CellCoord | null {
	const nearestCell = positionToNearestCellCoord(input.position, input.stage);
	const preferredCell = nearestCell ?? input.lastValidDock;
	let bestCell: CellCoord | null = null;
	let bestDistance = Number.POSITIVE_INFINITY;

	for (let row = 0; row < input.stage; row += 1) {
		for (let col = 0; col < input.stage; col += 1) {
			const cell = { col, row };

			if (
				!isDockableCell(cell, input.occupancy, input.stage, input.ignoreNodeId)
			) {
				continue;
			}

			const cellDistance = preferredCell
				? Math.abs(preferredCell.col - col) + Math.abs(preferredCell.row - row)
				: Math.abs(input.position.x - col * NODE_SIZE) +
					Math.abs(input.position.y - row * NODE_SIZE);

			if (cellDistance < bestDistance) {
				bestCell = cell;
				bestDistance = cellDistance;
			}
		}
	}

	return bestCell;
}

export function applyFallback(input: FallbackInput): FallbackResult {
	if (
		input.lastValidDock &&
		isDockableCell(
			input.lastValidDock,
			input.occupancy,
			input.stage,
			input.ignoreNodeId,
		)
	) {
		return {
			position: cellCoordToPosition(input.lastValidDock),
			strategy: FALLBACK_STRATEGIES.lastValidDock,
			cell: input.lastValidDock,
		};
	}

	const nearestEmptyCell = getNearestEmptyCell(input);
	if (nearestEmptyCell) {
		return {
			position: cellCoordToPosition(nearestEmptyCell),
			strategy: FALLBACK_STRATEGIES.nearestEmptyCell,
			cell: nearestEmptyCell,
		};
	}

	const clampedPosition = clampDockPosition(input.position, input.stage);

	return {
		position: clampedPosition,
		strategy: FALLBACK_STRATEGIES.clamp,
		cell: positionToNearestCellCoord(clampedPosition, input.stage),
	};
}

export function resolveDropPosition(input: DockingInput): ResolveDropResult {
	if (isNodeCenterOutsideStage(input.position, input.stage)) {
		const fallback = applyFallback({
			...input,
			reason: DROP_REASONS.outsideStage,
		});

		return {
			...fallback,
			reason: DROP_REASONS.outsideStage,
			usedFallback: true,
		};
	}

	const nearestCell = positionToNearestCellCoord(input.position, input.stage);

	if (!nearestCell) {
		const fallback = applyFallback({
			...input,
			reason: DROP_REASONS.noNearestCell,
		});

		return {
			...fallback,
			reason: DROP_REASONS.noNearestCell,
			usedFallback: true,
		};
	}

	if (
		!isDockableCell(
			nearestCell,
			input.occupancy,
			input.stage,
			input.ignoreNodeId,
		)
	) {
		const fallback = applyFallback({
			...input,
			reason: DROP_REASONS.occupiedCell,
		});

		return {
			...fallback,
			reason: DROP_REASONS.occupiedCell,
			usedFallback: true,
		};
	}

	return {
		position: cellCoordToPosition(nearestCell),
		cell: nearestCell,
		reason: DROP_REASONS.validDock,
		usedFallback: false,
	};
}

export function clampDockPosition(
	position: XYPosition,
	stage: GridStage,
): XYPosition {
	return clampPositionToStage(position, stage);
}
