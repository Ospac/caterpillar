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
	cancel: "lastValidDock 또는 dockedCell 기준 위치로 freePosition을 복구한다.",
} as const;

export function createDockedNodeState(position: XYPosition): DockedNodeState {
	const dockedCell = positionToNearestCellCoord(position);

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
		case "cancel": {
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

export function isDockableCell(
	cell: CellCoord,
	occupancy: GridOccupancy,
	stage: GridStage,
	ignoreNodeId?: string,
): boolean {
	if (cell.col < 0 || cell.row < 0 || cell.col >= stage || cell.row >= stage) {
		return false;
	}

	const occupantIds =
		occupancy.cellToNodeIds.get(`${cell.col},${cell.row}`) ?? [];

	if (!ignoreNodeId) {
		return occupantIds.length === 0;
	}

	return occupantIds.every((nodeId) => nodeId === ignoreNodeId);
}

function getNearestEmptyCell(input: DockingInput): CellCoord | null {
	const nearestCell = positionToNearestCellCoord(input.position);
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
		cell: positionToNearestCellCoord(clampedPosition),
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

	const nearestCell = positionToNearestCellCoord(input.position);

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
