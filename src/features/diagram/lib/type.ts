import type { DROP_REASONS, FALLBACK_STRATEGIES } from "./docking";
import type { GRID_STAGES } from "./grid";

// Node 자유 이동은 XYPosition을 사용하고, drop시 grid snap을 위해 CellCoord 좌표계를 사용한다.
export type CellCoord = {
	col: number;
	row: number;
};
export type XYPosition = {
	x: number;
	y: number;
};

/**
 * 드래그 가능한 노드의 현재 배치 상태를 나타낸다.
 *
 * `freePosition`은 드래그 중 실제로 따라다니는 좌표이고,
 * `dockedCell`은 현재 스냅되어 있다고 간주하는 그리드 셀이다.
 * `lastValidDock`은 점유 충돌이나 범위 이탈이 발생했을 때
 * 되돌아갈 수 있는 마지막 유효 도킹 위치를 보존한다.
 */
export type DockedNodeState = {
	freePosition: XYPosition;
	dockedCell: CellCoord | null;
	lastValidDock: CellCoord | null;
};

export interface DragStartEvent {
	type: "dragStart" | "dragMove";
	position: XYPosition;
}
export interface DragStopEvent {
	type: "dragStop";
	position: XYPosition;
	dockedCell: CellCoord | null;
}
export interface DragCancelEvent {
	type: "dragCancel";
}

/**
 * 도킹 상태 머신에 입력되는 사용자 상호작용 이벤트다.
 *
 * - `dragStart`, `dragMove`: 자유 좌표만 갱신하고, 도킹 확정은 보류한다.
 * - `dragStop`: 드롭 시점의 좌표와 확정된 `dockedCell`을 반영한다.
 * - `cancel`: 드래그를 취소하고 마지막 유효 도킹 지점 또는 현재 도킹 지점으로 복구한다.
 */
export type DockingEvent = DragStartEvent | DragStopEvent | DragCancelEvent;

export type GridStage = (typeof GRID_STAGES)[number];

export type GridOccupancy = {
	occupiedCellCount: number;
	cellToNodeId: Map<string, string>;
	conflictedCellKeys: Set<string>;
};

export type FallbackStrategy =
	(typeof FALLBACK_STRATEGIES)[keyof typeof FALLBACK_STRATEGIES];

export type FallbackResult = {
	position: XYPosition;
	strategy: FallbackStrategy;
	cell: CellCoord | null;
};

export type FallbackResolution = FallbackResult | null;

export type DockingInput = {
	position: XYPosition;
	stage: GridStage;
	occupancy: GridOccupancy;
	ignoreNodeId?: string;
	lastValidDock: CellCoord | null;
};

export type DropReason = (typeof DROP_REASONS)[keyof typeof DROP_REASONS];

export type DropResolutionBase = {
	reason: DropReason;
	usedFallback: boolean;
};
export type ResolveDropResult = DropResolutionBase & {
	position: XYPosition;
	cell: CellCoord | null;
	strategy?: FallbackStrategy;
};
export type FallbackInput = DockingInput & {
	reason: DropReason;
};
