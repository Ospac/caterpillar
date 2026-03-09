import {
	clampPositionToStage,
	type CellCoord,
	type GridOccupancy,
	type GridStage,
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

export function toDockPosition(cell: CellCoord): XYPosition {
	return {
		x: cell.col * NODE_SIZE,
		y: cell.row * NODE_SIZE,
	};
}

export function clampDockPosition(position: XYPosition, stage: GridStage): XYPosition {
	return clampPositionToStage(position, stage);
}
