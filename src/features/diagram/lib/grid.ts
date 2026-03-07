import type { Node } from "@xyflow/react";

export type CellCoord = {
	col: number;
	row: number;
};

export type DiagramNodeData = {
	label: string;
};

export type DiagramNode = Node<DiagramNodeData>;

export type GridStage = (typeof GRID_STAGES)[number];

export const GRID_STAGES = [4, 7, 10] as const;
export const MAX_GRID_STAGE: GridStage = GRID_STAGES[GRID_STAGES.length - 1];
export const NODE_SIZE = 96;

/**
 * Advance to the next grid stage in GRID_STAGES if one exists.
 *
 * @returns The next stage from GRID_STAGES after `currentStage`, or `currentStage` if `currentStage` is not in GRID_STAGES or is already the last stage.
 */
export function getNextStage(currentStage: GridStage): GridStage {
	const currentIndex = GRID_STAGES.indexOf(currentStage);
	if (currentIndex === -1 || currentIndex === GRID_STAGES.length - 1) {
		return currentStage;
	}

	return GRID_STAGES[currentIndex + 1];
}

/**
 * Computes the pixel dimension of a grid stage.
 *
 * @param stage - The grid stage (number of cells per side)
 * @returns The stage size in pixels (width/height)
 */
export function getStagePixelSize(stage: GridStage): number {
	return stage * NODE_SIZE;
}

/**
 * Converts a node's top-left pixel position to grid cell coordinates based on the node's center.
 *
 * @param position - The node's top-left position in pixels (`x`, `y`)
 * @returns The `col` and `row` indices of the grid cell that contains the node's center
 */
export function toCellCoord(position: { x: number; y: number }): CellCoord {
	const centerX = position.x + NODE_SIZE / 2;
	const centerY = position.y + NODE_SIZE / 2;

	return {
		col: Math.floor(centerX / NODE_SIZE),
		row: Math.floor(centerY / NODE_SIZE),
	};
}

/**
 * Determines whether a node at the given top-left position lies outside the stage bounds.
 *
 * @param position - The node's top-left coordinates in pixels.
 * @param stage - The grid stage (number of cells per side) used to compute stage dimensions.
 * @returns `true` if any part of the node would be outside the stage area, `false` otherwise.
 */
export function isNodeOutsideStage(
	position: { x: number; y: number },
	stage: GridStage,
): boolean {
	const stageSize = stage * NODE_SIZE;

	return (
		position.x < 0 ||
		position.y < 0 ||
		position.x + NODE_SIZE > stageSize ||
		position.y + NODE_SIZE > stageSize
	);
}

/**
 * Clamp a top-left node position to the pixel bounds of the given grid stage.
 *
 * @param position - Top-left pixel coordinates of the node.
 * @param stage - Grid stage size (number of cells per side).
 * @returns A position whose `x` and `y` are clamped to the inclusive range [0, stage * NODE_SIZE - NODE_SIZE].
 */
export function clampPositionToStage(
	position: { x: number; y: number },
	stage: GridStage,
): { x: number; y: number } {
	const stageSize = stage * NODE_SIZE;
	const max = stageSize - NODE_SIZE;

	return {
		x: Math.min(Math.max(position.x, 0), max),
		y: Math.min(Math.max(position.y, 0), max),
	};
}

/**
 * Serialize a cell coordinate into a compact string key.
 *
 * @param cell - The cell coordinate with numeric `col` and `row`
 * @returns The cell key in the format `col,row`
 */
export function toCellKey(cell: CellCoord): string {
	return `${cell.col},${cell.row}`;
}

/**
 * Checks whether a grid cell is within the square grid bounds [0, maxGridSize).
 *
 * @param cell - Cell coordinates with `col` and `row`
 * @param maxGridSize - Exclusive upper bound for valid columns and rows; defaults to `MAX_GRID_STAGE`
 * @returns `true` if `cell.col` and `cell.row` are both >= 0 and < `maxGridSize`, `false` otherwise.
 */
function isCellInsideMaxGrid(
	cell: CellCoord,
	maxGridSize = MAX_GRID_STAGE,
): boolean {
	return (
		cell.col >= 0 &&
		cell.row >= 0 &&
		cell.col < maxGridSize &&
		cell.row < maxGridSize
	);
}

/**
 * Computes the set of grid cells occupied by the provided nodes.
 *
 * @param nodes - Array of diagram nodes whose positions will be converted to grid cells
 * @returns A set of cell keys (`"col,row"`) representing cells that contain at least one node within the maximum grid
 */
export function getOccupiedCells(nodes: DiagramNode[]): Set<string> {
	const occupied = new Set<string>();

	for (const node of nodes) {
		const cell = toCellCoord(node.position);
		if (!isCellInsideMaxGrid(cell)) {
			continue;
		}
		occupied.add(toCellKey(cell));
	}

	return occupied;
}

export type GridOccupancy = {
	occupiedCellCount: number;
	conflictCellCount: number;
	cellToNodeIds: Map<string, string[]>;
};

/**
 * Computes how diagram nodes occupy grid cells and identifies cells with conflicts.
 *
 * @param nodes - Array of diagram nodes to evaluate; nodes whose computed cell lies outside the maximum grid are ignored
 * @returns An object containing:
 *  - `occupiedCellCount`: number of distinct cells that contain at least one node,
 *  - `conflictCellCount`: number of cells containing more than one node,
 *  - `cellToNodeIds`: mapping from cell key `"col,row"` to the array of node IDs occupying that cell
 */
export function getGridOccupancy(nodes: DiagramNode[]): GridOccupancy {
	const cellToNodeIds = new Map<string, string[]>();

	for (const node of nodes) {
		const cell = toCellCoord(node.position);
		if (!isCellInsideMaxGrid(cell)) {
			continue;
		}

		const key = toCellKey(cell);
		const existing = cellToNodeIds.get(key);
		if (existing) {
			existing.push(node.id);
		} else {
			cellToNodeIds.set(key, [node.id]);
		}
	}

	let conflictCellCount = 0;
	for (const nodeIds of cellToNodeIds.values()) {
		if (nodeIds.length > 1) {
			conflictCellCount += 1;
		}
	}

	return {
		occupiedCellCount: cellToNodeIds.size,
		conflictCellCount,
		cellToNodeIds,
	};
}
