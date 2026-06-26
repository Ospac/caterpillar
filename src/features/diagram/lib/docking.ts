import type {
	CellCoord,
	DockedNodeState,
	DockingInput,
	FallbackInput,
	FallbackResolution,
	GridDimensions,
	GridOccupancy,
	NodeSpan,
	ResolveDropResult,
	XYPosition,
} from "./geometry";
import {
	CELL_SIZE,
	cellCoordToPosition,
	getNodeCells,
	isNodeEscapingGrid,
	positionToAnchorCell,
} from "./grid";

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

export function createDockedNodeState(
	position: XYPosition,
	span: NodeSpan,
	gridDimensions: GridDimensions,
): DockedNodeState {
	const dockedCell = positionToAnchorCell(position, span, gridDimensions);

	return {
		dockedCell,
		lastValidDock: dockedCell,
	};
}

export function commitDockedNodeState(
	state: DockedNodeState,
	dockedCell: CellCoord | null,
): DockedNodeState {
	return {
		dockedCell,
		lastValidDock: dockedCell ?? state.lastValidDock,
	};
}

/**
 * 주어진 grid cell이 현재 canvas 안에서 도킹 가능한지 판정한다.
 */
export function isDockableCell(
	cell: CellCoord,
	occupancy: GridOccupancy,
	gridDimensions: GridDimensions,
	ignoreNodeId?: string,
): boolean {
	if (
		cell.col < 0 ||
		cell.row < 0 ||
		cell.col >= gridDimensions.cols ||
		cell.row >= gridDimensions.rows
	) {
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
	gridDimensions: GridDimensions,
	ignoreNodeId?: string,
): boolean {
	for (const cell of getNodeCells(anchor, span)) {
		if (!isDockableCell(cell, occupancy, gridDimensions, ignoreNodeId)) {
			return false;
		}
	}
	return true;
}

function getNearestEmptyCell(input: DockingInput): CellCoord | null {
	const nearestCell = positionToAnchorCell(
		input.position,
		input.span,
		input.gridDimensions,
	);
	const preferredCell = nearestCell ?? input.lastValidDock;
	let bestCell: CellCoord | null = null;
	let bestDistance = Number.POSITIVE_INFINITY;

	for (let row = 0; row < input.gridDimensions.rows; row += 1) {
		for (let col = 0; col < input.gridDimensions.cols; col += 1) {
			const cell = { col, row };

			if (
				!isDockableForSpan(
					cell,
					input.span,
					input.occupancy,
					input.gridDimensions,
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
			input.gridDimensions,
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
	if (isNodeEscapingGrid(input.position, input.span, input.gridDimensions)) {
		return resolveFailedDrop(input, DROP_REASONS.outsideStage);
	}

	const nearestCell = positionToAnchorCell(
		input.position,
		input.span,
		input.gridDimensions,
	);

	if (!nearestCell) {
		return resolveFailedDrop(input, DROP_REASONS.noNearestCell);
	}

	if (
		!isDockableForSpan(
			nearestCell,
			input.span,
			input.occupancy,
			input.gridDimensions,
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
