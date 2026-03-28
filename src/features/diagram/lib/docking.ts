import {
	CELL_SIZE,
	cellCoordToPosition,
	getNodeCells,
	isNodeEscapingStage,
	positionToAnchorCell,
} from "./grid";
import type {
	CellCoord,
	DockedNodeState,
	DockingEvent,
	DockingInput,
	FallbackInput,
	FallbackResolution,
	GridOccupancy,
	GridStage,
	NodeSpan,
	ResolveDropResult,
	XYPosition,
} from "./type";

export const SNAP_IN_DISTANCE = 40;
export const SNAP_OUT_DISTANCE = 56;

export const DROP_REASONS = {
	validDock: "valid-dock",
	outsideStage: "outside-stage",
	occupiedCell: "occupied-cell",
	noNearestCell: "no-nearest-cell",
} as const;

export const FALLBACK_STRATEGIES = {
	lastValidDock: "last-valid-dock",
	nearestEmptyCell: "nearest-empty-cell",
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
	span: NodeSpan,
): DockedNodeState {
	const dockedCell = positionToAnchorCell(position, stage, span);

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

/**
 * 앵커 셀에 span을 전개했을 때 모든 sub-cell이 도킹 가능한지 검사한다.
 */
export function isDockableForSpan(
	anchor: CellCoord,
	span: NodeSpan,
	occupancy: GridOccupancy,
	stage: GridStage,
	ignoreNodeId?: string,
): boolean {
	for (const cell of getNodeCells(anchor, span)) {
		if (!isDockableCell(cell, occupancy, stage, ignoreNodeId)) {
			return false;
		}
	}
	return true;
}

function getNearestEmptyCell(input: DockingInput): CellCoord | null {
	const nearestCell = positionToAnchorCell(
		input.position,
		input.stage,
		input.span,
	);
	const preferredCell = nearestCell ?? input.lastValidDock;
	let bestCell: CellCoord | null = null;
	let bestDistance = Number.POSITIVE_INFINITY;

	for (let row = 0; row < input.stage; row += 1) {
		for (let col = 0; col < input.stage; col += 1) {
			const cell = { col, row };

			if (
				!isDockableForSpan(
					cell,
					input.span,
					input.occupancy,
					input.stage,
					input.ignoreNodeId,
				)
			) {
				continue;
			}

			const refCol =
				preferredCell?.col ?? Math.round(input.position.x / CELL_SIZE);
			const refRow =
				preferredCell?.row ?? Math.round(input.position.y / CELL_SIZE);
			const cellDistance = Math.abs(refCol - col) + Math.abs(refRow - row);
			if (cellDistance < bestDistance) {
				bestCell = cell;
				bestDistance = cellDistance;
			}
		}
	}

	return bestCell;
}

export function applyFallback(input: FallbackInput): FallbackResolution {
	if (
		input.lastValidDock &&
		isDockableForSpan(
			input.lastValidDock,
			input.span,
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

	return null;
}

function resolveFailedDrop(
	input: DockingInput,
	reason: (typeof DROP_REASONS)[keyof typeof DROP_REASONS],
): ResolveDropResult {
	const fallback = applyFallback({
		...input,
		reason,
	});

	if (!fallback) {
		return {
			position: input.position,
			cell: null,
			reason,
			usedFallback: false,
		};
	}

	return {
		...fallback,
		reason,
		usedFallback: true,
	};
}

export function resolveDropPosition(input: DockingInput): ResolveDropResult {
	if (isNodeEscapingStage(input.position, input.stage, input.span)) {
		return resolveFailedDrop(input, DROP_REASONS.outsideStage);
	}

	const nearestCell = positionToAnchorCell(
		input.position,
		input.stage,
		input.span,
	);

	if (!nearestCell) {
		return resolveFailedDrop(input, DROP_REASONS.noNearestCell);
	}

	if (
		!isDockableForSpan(
			nearestCell,
			input.span,
			input.occupancy,
			input.stage,
			input.ignoreNodeId,
		)
	) {
		return resolveFailedDrop(input, DROP_REASONS.occupiedCell);
	}

	return {
		position: cellCoordToPosition(nearestCell),
		cell: nearestCell,
		reason: DROP_REASONS.validDock,
		usedFallback: false,
	};
}
