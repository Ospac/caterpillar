import type {
	CellCoord,
	DiagramNode,
	GridOccupancy,
	GridStage,
	XYPosition,
} from "./type";

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
export function toCellKey(cell: CellCoord): string {
	return `${cell.col},${cell.row}`;
}
export function isNodeCenterOutsideStage(
	position: { x: number; y: number },
	stage: GridStage,
): boolean {
	const stageSize = stage * NODE_SIZE;

	return (
		position.x < 0 ||
		position.y < 0 ||
		position.x + NODE_SIZE / 2 > stageSize ||
		position.y + NODE_SIZE / 2 > stageSize
	);
}
/**
 * 노드의 좌표{`x`,`y`}를 가장 가까운 그리드 셀 좌표로 변환합니다.
 *
 * XYPosition은 노드의 topLeftAxis를 나타냅니다.
 * 노드의 좌상단 좌표를 그대로 쓰지 않고, 노드 중심점에 가깝게 보정한 뒤
 * `Number.EPSILON`을 빼서 정확히 셀 경계에 놓인 경우 다음 셀로 밀리는 현상을 방지합니다.
 * `NODE_SIZE`로 나누어 어느 셀에 가장 가깝게 위치하는지 계산합니다.
 * @param position 노드의 {x, y} 좌표 객체
 * @returns position에서 가장 가까운 셀의 좌표 {col, row} 객체
 */
export function positionToNearestCellCoord(
	position: XYPosition,
	stage: GridStage,
): CellCoord | null {
	if (isNodeCenterOutsideStage(position, stage)) return null;

	const biasedX = position.x + NODE_SIZE / 2 - Number.EPSILON;
	const biasedY = position.y + NODE_SIZE / 2 - Number.EPSILON;

	return {
		col: Math.floor(biasedX / NODE_SIZE),
		row: Math.floor(biasedY / NODE_SIZE),
	};
}
export function cellCoordToPosition(cell: CellCoord): XYPosition {
	return { x: cell.col * NODE_SIZE, y: cell.row * NODE_SIZE };
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

export function isCellCoordInsideMaxGrid(
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
 * 주어진 노드 목록의 그리드 점유 현황을 상세하게 계산합니다.
 *
 * 각 노드의 `position`은 `positionToNearestCellCoord` 규칙으로 셀 좌표에 매핑되며,
 * 최대 그리드 범위 `MAX_GRID_STAGE` 밖의 노드는 집계에서 제외됩니다.
 *
 * 반환값에는 다음 정보가 포함됩니다.
 * - `occupiedCellCount`: 하나 이상의 노드가 차지한 고유 셀 수
 * - `cellToNodeId`: `"col,row"` 셀 키별 대표 노드 ID
 *
 * @param nodes 점유 현황을 계산할 다이어그램 노드 목록.
 * @returns 셀 점유 수와 셀별 노드 ID 매핑을 포함한 그리드 점유 정보.
 */
export function getGridOccupancy(
	nodes: DiagramNode[],
	stage: GridStage,
): GridOccupancy {
	const cellToNodeId = new Map<string, string>();

	for (const node of nodes) {
		const cell = positionToNearestCellCoord(node.position, stage);
		if (!cell) continue;

		const key = toCellKey(cell);
		const existing = cellToNodeId.get(key);
		if (!existing) {
			cellToNodeId.set(key, node.id);
		}
	}

	return {
		occupiedCellCount: cellToNodeId.size,
		cellToNodeId,
	};
}
