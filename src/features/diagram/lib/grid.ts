import type { Node } from "@xyflow/react";

export const GRID_STAGES = [4, 7, 10] as const;
export type GridStage = (typeof GRID_STAGES)[number];

export const CELL_SIZE = 96;
export const NODE_SIZE = 72;

export type CellCoord = {
	col: number;
	row: number;
};

export type DiagramNodeData = {
	label: string;
};

export type DiagramNode = Node<DiagramNodeData>;

const MAX_GRID_SIZE: GridStage = 10;

export function getNextStage(currentStage: GridStage): GridStage {
	const currentIndex = GRID_STAGES.indexOf(currentStage);
	if (currentIndex === -1 || currentIndex === GRID_STAGES.length - 1) {
		return currentStage;
	}

	return GRID_STAGES[currentIndex + 1];
}

export function getStagePixelSize(stage: GridStage): number {
	return stage * CELL_SIZE;
}

export function toCellCoord(
	position: { x: number; y: number },
	nodeSize = NODE_SIZE,
	cellSize = CELL_SIZE,
): CellCoord {
	const centerX = position.x + nodeSize / 2;
	const centerY = position.y + nodeSize / 2;

	return {
		col: Math.floor(centerX / cellSize),
		row: Math.floor(centerY / cellSize),
	};
}

export function isNodeOutsideStage(
	position: { x: number; y: number },
	stage: GridStage,
	nodeSize = NODE_SIZE,
	cellSize = CELL_SIZE,
): boolean {
	const stageSize = stage * cellSize;

	return (
		position.x < 0 ||
		position.y < 0 ||
		position.x + nodeSize > stageSize ||
		position.y + nodeSize > stageSize
	);
}

export function clampPositionToStage(
	position: { x: number; y: number },
	stage: GridStage,
	nodeSize = NODE_SIZE,
	cellSize = CELL_SIZE,
): { x: number; y: number } {
	const stageSize = stage * cellSize;
	const max = stageSize - nodeSize;

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
	maxGridSize = MAX_GRID_SIZE,
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
		const cell = toCellCoord(node.position);
		if (!isCellInsideMaxGrid(cell)) {
			continue;
		}
		occupied.add(toCellKey(cell));
	}

	return occupied;
}
