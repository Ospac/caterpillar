import type { DiagramNode } from "@/features/diagram/model/nodeTypes";
import { getNodeSpan } from "./blockSpan";
import { createDockedNodeState } from "./docking";
import type {
	CellCoord,
	DockedNodeState,
	GridCellCount,
	GridOccupancy,
	NodeSpan,
	XYPosition,
} from "./geometry";

export const GRID_CELL_COUNT = 30;
export const CELL_SIZE = 106;
export const MIN_GRID_ZOOM = 0.2;
export const MAX_GRID_ZOOM = 1;
export const GRID_ZOOM_BUTTON_CELL_STEP = 2;
export const GRID_ZOOM_WHEEL_CELL_STEP = 1;

export function getGridPixelSize(
	cellCount: GridCellCount = GRID_CELL_COUNT,
): number {
	return cellCount * CELL_SIZE;
}

export function isNodeFullyInsideGrid(
	node: DiagramNode,
	cellCount: GridCellCount = GRID_CELL_COUNT,
): boolean {
	const span = getNodeSpan(node.data.blockType);
	const gridSize = getGridPixelSize(cellCount);

	return (
		node.position.x >= 0 &&
		node.position.y >= 0 &&
		node.position.x + span.cols * CELL_SIZE <= gridSize &&
		node.position.y + span.rows * CELL_SIZE <= gridSize
	);
}

export function getNodesOutsideGrid(
	nodes: DiagramNode[],
	cellCount: GridCellCount = GRID_CELL_COUNT,
): DiagramNode[] {
	return nodes.filter((node) => !isNodeFullyInsideGrid(node, cellCount));
}

export function getResponsiveGridZoom(containerWidth: number): number {
	return getGridZoomForVisibleCells(
		containerWidth,
		getResponsiveGridVisibleCellCount(containerWidth),
	);
}

export function clampGridZoom(zoom: number): number {
	return Math.min(Math.max(zoom, MIN_GRID_ZOOM), MAX_GRID_ZOOM);
}

export function getVisibleCellCountBounds(
	containerWidth: number,
	cellCount: GridCellCount = GRID_CELL_COUNT,
): { min: number; max: number } {
	if (containerWidth <= 0) {
		return { min: cellCount, max: cellCount };
	}

	const minVisibleCellCount = Math.min(
		cellCount,
		Math.max(1, Math.ceil(containerWidth / (CELL_SIZE * MAX_GRID_ZOOM))),
	);
	const maxVisibleCellCount = Math.min(
		cellCount,
		Math.max(
			minVisibleCellCount,
			Math.floor(containerWidth / (CELL_SIZE * MIN_GRID_ZOOM)),
		),
	);

	return {
		min: minVisibleCellCount,
		max: maxVisibleCellCount,
	};
}

export function getClampedVisibleCellCount(
	containerWidth: number,
	visibleCellCount: number,
	cellCount: GridCellCount = GRID_CELL_COUNT,
): number {
	const bounds = getVisibleCellCountBounds(containerWidth, cellCount);
	const roundedVisibleCellCount = Math.round(visibleCellCount);

	return Math.min(Math.max(roundedVisibleCellCount, bounds.min), bounds.max);
}

export function getResponsiveGridVisibleCellCount(
	containerWidth: number,
	cellCount: GridCellCount = GRID_CELL_COUNT,
): number {
	return getVisibleCellCountBounds(containerWidth, cellCount).max;
}

export function getVisibleCellCount(
	containerWidth: number,
	zoom: number,
	cellCount: GridCellCount = GRID_CELL_COUNT,
): number {
	if (containerWidth <= 0) return cellCount;

	return getClampedVisibleCellCount(
		containerWidth,
		containerWidth / (CELL_SIZE * clampGridZoom(zoom)),
		cellCount,
	);
}

export function getGridZoomForVisibleCells(
	containerWidth: number,
	visibleCellCount: number,
	cellCount: GridCellCount = GRID_CELL_COUNT,
): number {
	if (containerWidth <= 0) return MAX_GRID_ZOOM;

	const clampedVisibleCellCount = getClampedVisibleCellCount(
		containerWidth,
		visibleCellCount,
		cellCount,
	);

	return clampGridZoom(containerWidth / (CELL_SIZE * clampedVisibleCellCount));
}

export function getNextGridZoom(
	currentZoom: number,
	containerWidth: number,
	visibleCellDelta: number,
	cellCount: GridCellCount = GRID_CELL_COUNT,
): number {
	const currentVisibleCellCount = getVisibleCellCount(
		containerWidth,
		currentZoom,
		cellCount,
	);
	return getGridZoomForVisibleCells(
		containerWidth,
		currentVisibleCellCount + visibleCellDelta,
		cellCount,
	);
}

export function getNextGridVisibleCellCount(
	currentVisibleCellCount: number,
	containerWidth: number,
	visibleCellDelta: number,
	cellCount: GridCellCount = GRID_CELL_COUNT,
): number {
	return getClampedVisibleCellCount(
		containerWidth,
		currentVisibleCellCount + visibleCellDelta,
		cellCount,
	);
}

export function getWheelGridZoom(
	currentZoom: number,
	deltaY: number,
	containerWidth: number,
	cellCount: GridCellCount = GRID_CELL_COUNT,
): number {
	if (deltaY === 0) return currentZoom;

	const visibleCellDelta = deltaY < 0 ? -1 : 1;
	return getNextGridZoom(
		currentZoom,
		containerWidth,
		visibleCellDelta * GRID_ZOOM_WHEEL_CELL_STEP,
		cellCount,
	);
}

export function getWheelGridVisibleCellCount(
	currentVisibleCellCount: number,
	deltaY: number,
	containerWidth: number,
	cellCount: GridCellCount = GRID_CELL_COUNT,
): number {
	if (deltaY === 0) return currentVisibleCellCount;

	const visibleCellDelta = deltaY < 0 ? -1 : 1;
	return getNextGridVisibleCellCount(
		currentVisibleCellCount,
		containerWidth,
		visibleCellDelta * GRID_ZOOM_WHEEL_CELL_STEP,
		cellCount,
	);
}

export function isGridZoomWheelEvent(event: {
	metaKey: boolean;
	ctrlKey: boolean;
}): boolean {
	return event.metaKey || event.ctrlKey;
}

export function getCenteredScrollOffset(
	center: number,
	zoom: number,
	viewportSize: number,
): number {
	return center * zoom - viewportSize / 2;
}

export function getAnchoredScrollOffset(
	flowPosition: number,
	anchorPosition: number,
	zoom: number,
): number {
	return flowPosition * zoom - anchorPosition;
}

function clampScrollOffset(
	scrollOffset: number,
	zoom: number,
	viewportSize: number,
	cellCount: GridCellCount = GRID_CELL_COUNT,
): number {
	const maxScrollOffset = Math.max(
		0,
		getGridPixelSize(cellCount) * zoom - viewportSize,
	);

	return Math.min(Math.max(scrollOffset, 0), maxScrollOffset);
}

function snapScrollOffsetToCell(scrollOffset: number, zoom: number): number {
	const renderedCellSize = CELL_SIZE * zoom;

	if (renderedCellSize <= 0) return scrollOffset;

	return Math.round(scrollOffset / renderedCellSize) * renderedCellSize;
}

export function getCellAlignedCenteredScrollOffset(
	center: number,
	zoom: number,
	viewportSize: number,
	cellCount: GridCellCount = GRID_CELL_COUNT,
): number {
	const rawScrollOffset = getCenteredScrollOffset(center, zoom, viewportSize);
	const clampedScrollOffset = clampScrollOffset(
		rawScrollOffset,
		zoom,
		viewportSize,
		cellCount,
	);
	const snappedScrollOffset = snapScrollOffsetToCell(clampedScrollOffset, zoom);
	return clampScrollOffset(snappedScrollOffset, zoom, viewportSize, cellCount);
}

export function getCellAlignedAnchoredScrollOffset(
	flowPosition: number,
	anchorPosition: number,
	zoom: number,
	viewportSize: number,
	cellCount: GridCellCount = GRID_CELL_COUNT,
): number {
	const rawScrollOffset = getAnchoredScrollOffset(
		flowPosition,
		anchorPosition,
		zoom,
	);
	const clampedScrollOffset = clampScrollOffset(
		rawScrollOffset,
		zoom,
		viewportSize,
		cellCount,
	);
	const snappedScrollOffset = snapScrollOffsetToCell(clampedScrollOffset, zoom);
	return clampScrollOffset(snappedScrollOffset, zoom, viewportSize, cellCount);
}

export function toCellKey(cell: CellCoord): string {
	return `${cell.col},${cell.row}`;
}

export function getNodeCenterPosition(
	position: XYPosition,
	span: ReturnType<typeof getNodeSpan>,
): XYPosition {
	return {
		x: position.x + (span.cols * CELL_SIZE) / 2,
		y: position.y + (span.rows * CELL_SIZE) / 2,
	};
}
/**
 * 노드의 좌상단이 grid 밖이거나 중심점이 grid 밖으로 나갔는지 판정합니다.
 */
export function isNodeEscapingGrid(
	position: { x: number; y: number },
	span: NodeSpan,
	cellCount: GridCellCount = GRID_CELL_COUNT,
): boolean {
	const gridSize = cellCount * CELL_SIZE;
	const { x: centerX, y: centerY } = getNodeCenterPosition(position, span);
	return (
		position.x < 0 || position.y < 0 || centerX > gridSize || centerY > gridSize
	);
}

/**
 * 노드의 좌상단 좌표를 가장 가까운 그리드 앵커 셀로 변환합니다.
 * 노드 중심점에 가깝게 보정한 뒤 `Number.EPSILON`을 빼서 정확히 셀 경계에 놓인 경우
 * 다음 셀로 밀리는 현상을 방지합니다.
 * 노드가 grid 밖이면 null을 반환합니다.
 * @param span 경계 검사(`isNodeEscapingGrid`)에 사용되며, 앵커 계산 자체는 좌상단 기준으로 span 무관
 */
export function positionToAnchorCell(
	position: XYPosition,
	span: NodeSpan,
	cellCount: GridCellCount = GRID_CELL_COUNT,
): CellCoord | null {
	if (isNodeEscapingGrid(position, span, cellCount)) return null;

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

export function clampPositionToGrid(
	position: { x: number; y: number },
	span: NodeSpan,
	cellCount: GridCellCount = GRID_CELL_COUNT,
): { x: number; y: number } {
	const maxX = (cellCount - span.cols) * CELL_SIZE;
	const maxY = (cellCount - span.rows) * CELL_SIZE;

	return {
		x: Math.min(Math.max(position.x, 0), maxX),
		y: Math.min(Math.max(position.y, 0), maxY),
	};
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
	cellCount: GridCellCount = GRID_CELL_COUNT,
): GridOccupancy {
	const cellToNodeId = new Map<string, string>();
	const conflictedCellKeys = new Set<string>();

	for (const node of nodes) {
		const span = getNodeSpan(node.data.blockType);
		const anchor = positionToAnchorCell(node.position, span, cellCount);
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
	cellCount: GridCellCount = GRID_CELL_COUNT,
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
		nextState[node.id] = createDockedNodeState(node.position, span, cellCount);
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
