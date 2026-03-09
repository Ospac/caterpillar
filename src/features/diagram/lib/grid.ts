import type { CellCoord, DiagramNode, GridStage, XYPosition } from "./type";

export const GRID_STAGES = [4, 7, 10] as const;
export const MAX_GRID_STAGE: GridStage = GRID_STAGES[GRID_STAGES.length - 1];
export const NODE_SIZE = 96;

export function getNextStage(currentStage: GridStage): GridStage {
	const currentIndex = GRID_STAGES.indexOf(currentStage);
	if (currentIndex === -1 || currentIndex === GRID_STAGES.length - 1) {
		return currentStage;
	}

	return GRID_STAGES[currentIndex + 1];
}

export function getStagePixelSize(stage: GridStage): number {
	return stage * NODE_SIZE;
}

export function positionToCellCoord(position: {
	x: number;
	y: number;
}): CellCoord {
	const centerX = position.x + NODE_SIZE / 2;
	const centerY = position.y + NODE_SIZE / 2;

	return {
		col: Math.floor(centerX / NODE_SIZE),
		row: Math.floor(centerY / NODE_SIZE),
	};
}
export function cellCoordToPosition(cell: CellCoord): XYPosition {
	return {
		x: cell.col * NODE_SIZE,
		y: cell.row * NODE_SIZE,
	};
}
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

export function toCellKey(cell: CellCoord): string {
	return `${cell.col},${cell.row}`;
}

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

export function getOccupiedCells(nodes: DiagramNode[]): Set<string> {
	const occupied = new Set<string>();

	for (const node of nodes) {
		const cell = positionToCellCoord(node.position);
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

export function getGridOccupancy(nodes: DiagramNode[]): GridOccupancy {
	const cellToNodeIds = new Map<string, string[]>();

	for (const node of nodes) {
		const cell = positionToCellCoord(node.position);
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
