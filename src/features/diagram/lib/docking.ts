import {
	clampPositionToStage,
	type CellCoord,
	type GridOccupancy,
	type GridStage,
	isNodeOutsideStage,
	NODE_SIZE,
} from "./grid";

export type XYPosition = {
	x: number;
	y: number;
};

export const SNAP_IN_DISTANCE = 40;
export const SNAP_OUT_DISTANCE = 56;

export const DROP_REASONS = {
	validDock: "valid-dock",
	outsideStage: "outside-stage",
	occupiedCell: "occupied-cell",
	noNearestCell: "no-nearest-cell",
} as const;

export type DropReason = (typeof DROP_REASONS)[keyof typeof DROP_REASONS];

export const FALLBACK_STRATEGIES = {
	lastValidDock: "last-valid-dock",
	nearestEmptyCell: "nearest-empty-cell",
	clamp: "clamp",
} as const;

export type FallbackStrategy =
	(typeof FALLBACK_STRATEGIES)[keyof typeof FALLBACK_STRATEGIES];

export type DockedNodeState = {
	freePosition: XYPosition;
	dockedCell: CellCoord | null;
	lastValidDock: CellCoord | null;
};

export type DropResolutionBase = {
	reason: DropReason;
	usedFallback: boolean;
};

export type FallbackResult = {
	position: XYPosition;
	strategy: FallbackStrategy;
	cell: CellCoord | null;
};

export type ResolveDropResult = DropResolutionBase & {
	position: XYPosition;
	cell: CellCoord | null;
	strategy?: FallbackStrategy;
};

export type DockingInput = {
	position: XYPosition;
	stage: GridStage;
	occupancy: GridOccupancy;
	ignoreNodeId?: string;
	lastValidDock: CellCoord | null;
};

export type FallbackInput = DockingInput & {
	reason: DropReason;
};

function getNearestCellIndex(axis: number): number {
	const biasedAxis = axis + NODE_SIZE / 2 - Number.EPSILON;
	return Math.floor(biasedAxis / NODE_SIZE);
}

export function getNearestDockCell(
	position: XYPosition,
	stage: GridStage,
): CellCoord | null {
	const cell = {
		col: getNearestCellIndex(position.x),
		row: getNearestCellIndex(position.y),
	};

	if (cell.col < 0 || cell.row < 0 || cell.col >= stage || cell.row >= stage) {
		return null;
	}

	return cell;
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

	const occupantIds = occupancy.cellToNodeIds.get(`${cell.col},${cell.row}`) ?? [];

	if (!ignoreNodeId) {
		return occupantIds.length === 0;
	}

	return occupantIds.every((nodeId) => nodeId === ignoreNodeId);
}

function getNearestEmptyCell(input: DockingInput): CellCoord | null {
	const nearestCell = getNearestDockCell(input.position, input.stage);
	const preferredCell = nearestCell ?? input.lastValidDock;
	let bestCell: CellCoord | null = null;
	let bestDistance = Number.POSITIVE_INFINITY;

	for (let row = 0; row < input.stage; row += 1) {
		for (let col = 0; col < input.stage; col += 1) {
			const cell = { col, row };

			if (!isDockableCell(cell, input.occupancy, input.stage, input.ignoreNodeId)) {
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
			position: toDockPosition(input.lastValidDock),
			strategy: FALLBACK_STRATEGIES.lastValidDock,
			cell: input.lastValidDock,
		};
	}

	const nearestEmptyCell = getNearestEmptyCell(input);
	if (nearestEmptyCell) {
		return {
			position: toDockPosition(nearestEmptyCell),
			strategy: FALLBACK_STRATEGIES.nearestEmptyCell,
			cell: nearestEmptyCell,
		};
	}

	const clampedPosition = clampDockPosition(input.position, input.stage);

	return {
		position: clampedPosition,
		strategy: FALLBACK_STRATEGIES.clamp,
		cell: getNearestDockCell(clampedPosition, input.stage),
	};
}

export function resolveDropPosition(input: DockingInput): ResolveDropResult {
	if (isNodeOutsideStage(input.position, input.stage)) {
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

	const nearestCell = getNearestDockCell(input.position, input.stage);

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

	if (!isDockableCell(nearestCell, input.occupancy, input.stage, input.ignoreNodeId)) {
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
		position: toDockPosition(nearestCell),
		cell: nearestCell,
		reason: DROP_REASONS.validDock,
		usedFallback: false,
	};
}

export function toDockPosition(cell: CellCoord): XYPosition {
	return {
		x: cell.col * NODE_SIZE,
		y: cell.row * NODE_SIZE,
	};
}

export function clampDockPosition(position: XYPosition, stage: GridStage): XYPosition {
	return clampPositionToStage(position, stage);
}
