import type { DiagramNode } from "../model/type";
import { createDockedNodeState } from "./docking";
import { getNodeSpan } from "./span";
import type {
	CellCoord,
	DockedNodeState,
	GridOccupancy,
	GridStage,
	NodeSpan,
	XYPosition,
} from "./type";

export const GRID_STAGES = [8, 14, 20] as const;
export const MAX_GRID_STAGE: GridStage = GRID_STAGES[GRID_STAGES.length - 1];
export const CELL_SIZE = 108;

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

export function toCellKey(cell: CellCoord): string {
	return `${cell.col},${cell.row}`;
}

/**
 * 노드의 좌상단이 stage 밖이거나 중심점이 stage 밖으로 나갔는지 판정합니다.
 * 드래그 중 stage 자동 확대 트리거 및 유효 앵커 계산의 gate로 사용됩니다.
 */
export function isNodeEscapingStage(
	position: { x: number; y: number },
	stage: GridStage,
	span: NodeSpan,
): boolean {
	const stageSize = stage * CELL_SIZE;
	const centerX = position.x + (span.cols * CELL_SIZE) / 2;
	const centerY = position.y + (span.rows * CELL_SIZE) / 2;

	return (
		position.x < 0 ||
		position.y < 0 ||
		centerX > stageSize ||
		centerY > stageSize
	);
}

/**
 * 노드의 좌상단 좌표를 가장 가까운 그리드 앵커 셀로 변환합니다.
 * 노드 중심점에 가깝게 보정한 뒤 `Number.EPSILON`을 빼서 정확히 셀 경계에 놓인 경우
 * 다음 셀로 밀리는 현상을 방지합니다.
 * 노드가 stage 밖이면 null을 반환합니다.
 * @param span 경계 검사(`isNodeEscapingStage`)에 사용되며, 앵커 계산 자체는 좌상단 기준으로 span 무관
 */
export function positionToAnchorCell(
	position: XYPosition,
	stage: GridStage,
	span: NodeSpan,
): CellCoord | null {
	if (isNodeEscapingStage(position, stage, span)) return null;

	const biasedX = position.x + CELL_SIZE / 2 - Number.EPSILON;
	const biasedY = position.y + CELL_SIZE / 2 - Number.EPSILON;

	return {
		col: Math.floor(biasedX / CELL_SIZE),
		row: Math.floor(biasedY / CELL_SIZE),
	};
}

export function cellCoordToPosition(cell: CellCoord): XYPosition {
	return { x: cell.col * CELL_SIZE, y: cell.row * CELL_SIZE };
}

export function clampPositionToStage(
	position: { x: number; y: number },
	stage: GridStage,
	span: NodeSpan,
): { x: number; y: number } {
	const maxX = (stage - span.cols) * CELL_SIZE;
	const maxY = (stage - span.rows) * CELL_SIZE;

	return {
		x: Math.min(Math.max(position.x, 0), maxX),
		y: Math.min(Math.max(position.y, 0), maxY),
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
 * 앵커 셀 기준으로 노드가 점유하는 모든 sub-cell 목록을 반환합니다.
 */
export function getNodeCells(anchor: CellCoord, span: NodeSpan): CellCoord[] {
	const cells: CellCoord[] = [];
	for (let r = 0; r < span.rows; r++) {
		for (let c = 0; c < span.cols; c++) {
			cells.push({ col: anchor.col + c, row: anchor.row + r });
		}
	}
	return cells;
}

/**
 * 주어진 노드 목록의 그리드 점유 현황을 상세하게 계산합니다.
 *
 * 각 노드는 blockType에 따른 span만큼 여러 sub-cell을 점유합니다.
 * 점유 충돌은 sub-cell 단위로 감지됩니다.
 */
export function getGridOccupancy(
	nodes: DiagramNode[],
	stage: GridStage,
): GridOccupancy {
	const cellToNodeId = new Map<string, string>();
	const conflictedCellKeys = new Set<string>();

	for (const node of nodes) {
		const span = getNodeSpan(node.data.blockType);
		const anchor = positionToAnchorCell(node.position, stage, span);
		if (!anchor) continue;

		for (const cell of getNodeCells(anchor, span)) {
			const key = toCellKey(cell);
			if (conflictedCellKeys.has(key)) continue;

			if (cellToNodeId.has(key)) {
				cellToNodeId.delete(key);
				conflictedCellKeys.add(key);
			} else {
				cellToNodeId.set(key, node.id);
			}
		}
	}

	return {
		occupiedCellCount: cellToNodeId.size + conflictedCellKeys.size,
		cellToNodeId,
		conflictedCellKeys,
	};
}

export function syncNodeDockingState(
	currentState: Record<string, DockedNodeState>,
	nodes: DiagramNode[],
	stage: GridStage,
): Record<string, DockedNodeState> {
	const nextNodeIds = new Set(nodes.map((node) => node.id));
	let changed = false;
	const nextState: Record<string, DockedNodeState> = {};

	for (const node of nodes) {
		const existingState = currentState[node.id];
		if (existingState) {
			nextState[node.id] = existingState;
			continue;
		}

		const span = getNodeSpan(node.data.blockType);
		nextState[node.id] = createDockedNodeState(node.position, stage, span);
		changed = true;
	}

	for (const nodeId of Object.keys(currentState)) {
		if (!nextNodeIds.has(nodeId)) {
			changed = true;
			break;
		}
	}

	return changed ? nextState : currentState;
}
