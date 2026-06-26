import { CELL_SIZE, GRID_COLUMN_COUNT } from "./grid";

export const MIN_GRID_ZOOM = 0.2;
export const MAX_GRID_ZOOM = 1;
export const GRID_ZOOM_BUTTON_CELL_STEP = 2;
export const GRID_ZOOM_WHEEL_CELL_STEP = 1;

/**
 * zoom 값을 지원 범위인 `MIN_GRID_ZOOM`과 `MAX_GRID_ZOOM` 사이로 제한합니다.
 */
function clampGridZoom(zoom: number): number {
	return Math.min(Math.max(zoom, MIN_GRID_ZOOM), MAX_GRID_ZOOM);
}

/**
 * viewport 너비에서 허용 가능한 최소·최대 visible column 수를 계산합니다.
 */
export function getVisibleCellCountBounds(
	containerWidth: number,
	cellCount = GRID_COLUMN_COUNT,
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

/**
 * visible column 수를 정수로 반올림하고 현재 viewport의 허용 범위로 제한합니다.
 */
export function getClampedVisibleCellCount(
	containerWidth: number,
	visibleCellCount: number,
	cellCount = GRID_COLUMN_COUNT,
): number {
	const bounds = getVisibleCellCountBounds(containerWidth, cellCount);
	const roundedVisibleCellCount = Math.round(visibleCellCount);

	return Math.min(Math.max(roundedVisibleCellCount, bounds.min), bounds.max);
}

/**
 * 수동 zoom이 없을 때 viewport에 맞춰 표시할 기본 column 수를 반환합니다.
 */
export function getResponsiveGridVisibleCellCount(
	containerWidth: number,
	cellCount = GRID_COLUMN_COUNT,
): number {
	return getVisibleCellCountBounds(containerWidth, cellCount).max;
}

/**
 * viewport 너비와 visible column 수를 실제 grid zoom 배율로 변환합니다.
 */
export function getGridZoomForVisibleCells(
	containerWidth: number,
	visibleCellCount: number,
	cellCount = GRID_COLUMN_COUNT,
): number {
	if (containerWidth <= 0) return MAX_GRID_ZOOM;

	const clampedVisibleCellCount = getClampedVisibleCellCount(
		containerWidth,
		visibleCellCount,
		cellCount,
	);

	return clampGridZoom(containerWidth / (CELL_SIZE * clampedVisibleCellCount));
}

/**
 * 현재 visible column 수에 증감값을 적용하고 허용 범위로 제한합니다.
 */
export function getNextGridVisibleCellCount(
	currentVisibleCellCount: number,
	containerWidth: number,
	visibleCellDelta: number,
	cellCount = GRID_COLUMN_COUNT,
): number {
	return getClampedVisibleCellCount(
		containerWidth,
		currentVisibleCellCount + visibleCellDelta,
		cellCount,
	);
}

/**
 * wheel 방향을 cell 단위 증감으로 변환해 다음 visible column 수를 반환합니다.
 */
export function getWheelGridVisibleCellCount(
	currentVisibleCellCount: number,
	deltaY: number,
	containerWidth: number,
	cellCount = GRID_COLUMN_COUNT,
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

/**
 * `Ctrl` 또는 `Cmd`가 눌린 wheel 이벤트인지 판정합니다.
 */
export function isGridZoomWheelEvent(event: {
	metaKey: boolean;
	ctrlKey: boolean;
}): boolean {
	return event.metaKey || event.ctrlKey;
}

/**
 * scroll offset을 현재 zoom에서 이동 가능한 grid 범위로 제한합니다.
 */
function clampScrollOffset(
	scrollOffset: number,
	zoom: number,
	viewportSize: number,
	axisCellCount = GRID_COLUMN_COUNT,
): number {
	const maxScrollOffset = Math.max(
		0,
		axisCellCount * CELL_SIZE * zoom - viewportSize,
	);

	return Math.min(Math.max(scrollOffset, 0), maxScrollOffset);
}

/**
 * scroll offset을 렌더링된 cell 크기의 가장 가까운 경계로 정렬합니다.
 */
function snapScrollOffsetToCell(scrollOffset: number, zoom: number): number {
	const renderedCellSize = CELL_SIZE * zoom;

	if (renderedCellSize <= 0) return scrollOffset;

	return Math.round(scrollOffset / renderedCellSize) * renderedCellSize;
}

/**
 * 지정한 flow 좌표가 viewport의 anchor 위치에 유지되도록 cell 정렬된 scroll
 * offset을 계산합니다.
 */
export function getCellAlignedAnchoredScrollOffset(
	flowPosition: number,
	anchorPosition: number,
	zoom: number,
	viewportSize: number,
	axisCellCount = GRID_COLUMN_COUNT,
): number {
	const rawScrollOffset = flowPosition * zoom - anchorPosition;
	const clampedScrollOffset = clampScrollOffset(
		rawScrollOffset,
		zoom,
		viewportSize,
		axisCellCount,
	);
	const snappedScrollOffset = snapScrollOffsetToCell(clampedScrollOffset, zoom);
	return clampScrollOffset(
		snappedScrollOffset,
		zoom,
		viewportSize,
		axisCellCount,
	);
}
