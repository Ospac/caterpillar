import {
	cellCoordToPosition,
	isNodeCenterOutsideStage,
	NODE_SIZE,
	positionToNearestCellCoord,
} from "./grid";
import type {
	CellCoord,
	DockedNodeState,
	DockingEvent,
	DockingInput,
	FallbackInput,
	FallbackResolution,
	GridOccupancy,
	GridStage,
	ResolveDropResult,
	XYPosition,
} from "./type";

export const SNAP_IN_DISTANCE = 40;
export const SNAP_OUT_DISTANCE = 56;

export const DROP_REASONS = {
	validDock: "valid-dock",
	outsideStage: "outside-stage",
	occupiedCell: "occupied-cell",
	noNearestCell: "no-nearest-cell",
} as const;

export const FALLBACK_STRATEGIES = {
	lastValidDock: "last-valid-dock",
	nearestEmptyCell: "nearest-empty-cell",
} as const;

export const DRAG_EVENT_TRANSITIONS = {
	dragStart: "freePosition만 현재 좌표로 갱신하고 도킹 기준점은 유지한다.",
	dragMove: "freePosition만 드래그 좌표로 갱신한다.",
	dragStop:
		"최종 좌표와 확정 dockedCell을 반영하고, 유효한 dockedCell이면 lastValidDock도 갱신한다.",
	dragCancel:
		"lastValidDock 또는 dockedCell 기준 위치로 freePosition을 복구한다.",
} as const;

export function createDockedNodeState(
	position: XYPosition,
	stage: GridStage,
): DockedNodeState {
	const dockedCell = positionToNearestCellCoord(position, stage);

	return {
		freePosition: position,
		dockedCell,
		lastValidDock: dockedCell,
	};
}

export function transitionDockedNodeState(
	state: DockedNodeState,
	event: DockingEvent,
): DockedNodeState {
	switch (event.type) {
		case "dragStart":
		case "dragMove":
			return {
				...state,
				freePosition: event.position,
			};
		case "dragStop":
			return {
				freePosition: event.position,
				dockedCell: event.dockedCell,
				lastValidDock: event.dockedCell ?? state.lastValidDock,
			};
		case "dragCancel": {
			const anchorCell = state.lastValidDock ?? state.dockedCell;
			return {
				...state,
				freePosition: anchorCell
					? cellCoordToPosition(anchorCell)
					: state.freePosition,
			};
		}
	}
}

/**
 * 주어진 grid cell이 현재 stage 안에서 도킹 가능한지 판정한다.
 *
 * 판정 규칙은 다음과 같다.
 * - `cell.col`, `cell.row`가 `0 <= index < stage` 범위를 벗어나면 `false`
 * - 해당 셀에 점유한 노드가 없으면 `true`
 * - `ignoreNodeId`가 없으면 다른 노드가 이미 점유 중인 셀이므로 `false`
 * - `ignoreNodeId`가 있으면, 그 셀 점유자가 자기 자신(`ignoreNodeId`)일 때만 `true`
 *
 * 이 함수는 드래그 중인 노드가 "원래 자기 셀" 위에 다시 드롭되는 상황에서
 * 자기 자신을 충돌로 오판하지 않도록 `ignoreNodeId`를 지원한다.
 *
 * @param cell 도킹 가능 여부를 검사할 대상 셀 좌표
 * @param occupancy 현재 grid 점유 상태. `cellToNodeId`에서 `"col,row"` 키를 사용한다.
 * @param stage 현재 활성 grid stage 크기. 유효 셀 범위는 `0`부터 `stage - 1`까지다.
 * @param ignoreNodeId 충돌 검사에서 제외할 노드 id. 보통 현재 드래그 중인 노드 id를 넘긴다.
 * @returns 해당 셀이 현재 조건에서 도킹 가능하면 `true`, 아니면 `false`
 */
export function isDockableCell(
	cell: CellCoord,
	occupancy: GridOccupancy,
	stage: GridStage,
	ignoreNodeId?: string,
): boolean {
	if (cell.col < 0 || cell.row < 0 || cell.col >= stage || cell.row >= stage) {
		return false;
	}

	const key = `${cell.col},${cell.row}`;
	if (occupancy.conflictedCellKeys.has(key)) {
		return false;
	}

	const occupantId = occupancy.cellToNodeId.get(key);
	if (!occupantId) {
		return true;
	}

	if (!ignoreNodeId) {
		return false;
	}

	return occupantId === ignoreNodeId;
}

function getNearestEmptyCell(input: DockingInput): CellCoord | null {
	const nearestCell = positionToNearestCellCoord(input.position, input.stage);
	const preferredCell = nearestCell ?? input.lastValidDock;
	let bestCell: CellCoord | null = null;
	let bestDistance = Number.POSITIVE_INFINITY;

	for (let row = 0; row < input.stage; row += 1) {
		for (let col = 0; col < input.stage; col += 1) {
			const cell = { col, row };

			if (
				!isDockableCell(cell, input.occupancy, input.stage, input.ignoreNodeId)
			) {
				continue;
			}

			// preferredCell이 있으면 셀 단위 맨해튼 거리 사용 (preferredCell.col - col)
			// 없으면 현재 픽셀 위치에서 각 셀 중심까지의 거리 사용 (input.position.x - col * NODE_SIZE)
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

/**
 * 유효한 도킹 셀을 즉시 확정할 수 없을 때 대체 위치를 계산한다.
 *
 * 이 함수는 `resolveDropPosition`에서 `outside-stage`, `no-nearest-cell`,
 * `occupied-cell` 같은 실패 사유가 발생했을 때 호출되며, 아래 우선순위대로
 * fallback 전략을 적용한다.
 *
 * 1. `lastValidDock`가 현재도 도킹 가능하면 해당 셀로 복귀한다.
 * 2. 복귀할 셀이 없거나 더 이상 유효하지 않으면 가장 가까운 빈 셀을 탐색한다.
 * 3. 더 이상 대체 가능한 도킹 셀이 없으면 `null`을 반환한다.
 *
 * 세부 규칙:
 * - `lastValidDock` 검증과 빈 셀 탐색 모두 `ignoreNodeId`를 반영한다.
 * - 빈 셀 탐색 기준점은 `position`에서 계산한 최근접 셀이고, 그 셀이 없으면
 *   `lastValidDock`, 둘 다 없으면 현재 픽셀 좌표 자체를 기준으로 삼는다.
 * - `input.reason`은 현재 구현에서 분기에는 직접 사용하지 않으며, 호출 맥락을 보존하기 위한 입력이다.
 *
 * @param input fallback 계산에 필요한 드롭 컨텍스트
 * @param input.position 드롭 실패가 발생한 현재 노드 좌표
 * @param input.stage 현재 활성 grid stage 크기
 * @param input.occupancy 현재 셀 점유 상태
 * @param input.ignoreNodeId 충돌 검사에서 제외할 노드 id. 보통 현재 드래그 중인 노드 자신이다.
 * @param input.lastValidDock 이전에 유효했던 마지막 도킹 셀. 있으면 최우선 fallback 후보가 된다.
 * @param input.reason fallback이 호출된 원인. 현재는 호출 맥락 전달용으로 유지된다.
 * @returns 대체 가능한 도킹 후보가 있으면 그 결과를, 없으면 `null`을 반환한다.
 * 반환 객체의 `strategy`는 실제 선택된 전략을 나타내고,
 * `position`은 그 전략으로 계산된 최종 좌표이며,
 * `cell`은 해당 좌표에 대응하는 셀이다.
 */
export function applyFallback(input: FallbackInput): FallbackResolution {
	// lastValidDock이 유효하면 last-valid-dock 전략을 사용한다 (해당 셀로 복귀)
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
			position: cellCoordToPosition(input.lastValidDock),
			strategy: FALLBACK_STRATEGIES.lastValidDock,
			cell: input.lastValidDock,
		};
	}
	// lastValidDock이 막혀 있으면 가장 가까운 빈 셀을 탐색하여 복귀한다
	const nearestEmptyCell = getNearestEmptyCell(input);
	if (nearestEmptyCell) {
		return {
			position: cellCoordToPosition(nearestEmptyCell),
			strategy: FALLBACK_STRATEGIES.nearestEmptyCell,
			cell: nearestEmptyCell,
		};
	}
	// 가장 가까운 빈 셀이 없어 stage 전체가 막혀 있으면 null을 반환한다
	return null;
}

function resolveFailedDrop(
	input: DockingInput,
	reason: (typeof DROP_REASONS)[keyof typeof DROP_REASONS],
): ResolveDropResult {
	const fallback = applyFallback({
		...input,
		reason,
	});

	// fallback도 실패하면 현재 자유 좌표를 유지하고 미도킹 상태로 반환한다
	if (!fallback) {
		return {
			position: input.position,
			cell: null,
			reason,
			usedFallback: false,
		};
	}

	return {
		...fallback,
		reason,
		usedFallback: true,
	};
}

/**
 * 드롭 시점의 자유 좌표를 최종 배치 위치로 해석한다.
 *
 * 이 함수는 현재 드롭 좌표가 즉시 도킹 가능한지 검사하고, 가능하면 grid 셀 기준으로
 * 스냅된 위치를 반환한다. 즉시 도킹이 불가능하면 실패 사유를 판정한 뒤
 * `applyFallback`으로 대체 위치를 시도한다.
 *
 * 판정 순서:
 * 1. 노드 중심이 stage 밖이면 `outside-stage`
 * 2. stage 안이지만 최근접 셀을 계산할 수 없으면 `no-nearest-cell`
 * 3. 최근접 셀이 계산됐지만 점유/충돌 등으로 도킹 불가면 `occupied-cell`
 * 4. 위 조건에 걸리지 않으면 `valid-dock`
 *
 * 반환 규칙:
 * - `valid-dock`이면 최근접 셀의 스냅 좌표를 반환하고 `usedFallback`은 `false`
 * - 실패 사유에서 `applyFallback`이 성공하면 그 결과를 그대로 사용하고 `usedFallback`은 `true`
 * - 실패 사유에서 `applyFallback`도 실패하면 현재 `input.position`을 유지하고
 *   `cell`은 `null`, `usedFallback`은 `false`
 * - `strategy`는 fallback이 실제 적용된 경우에만 포함된다
 *
 * 세부 규칙:
 * - 셀 점유 판정은 `isDockableCell` 규칙을 따른다.
 * - `ignoreNodeId`가 있으면 자기 자신의 기존 셀은 충돌로 보지 않는다.
 * - `lastValidDock`은 직접 도킹 판정에는 쓰이지 않고, fallback 계산 시에만 사용된다.
 *
 * @param input 드롭 위치 해석에 필요한 현재 도킹 컨텍스트
 * @param input.position 사용자가 드롭한 현재 노드 좌표
 * @param input.stage 현재 활성 grid stage 크기
 * @param input.occupancy 현재 grid 점유 상태
 * @param input.ignoreNodeId 충돌 검사에서 제외할 노드 id. 보통 현재 드래그 중인 노드 자신이다.
 * @param input.lastValidDock 이전에 유효했던 마지막 도킹 셀. fallback 계산 시 복귀 후보로 사용된다.
 * @returns 최종 반영할 좌표, 확정 셀, 실패/성공 사유, fallback 사용 여부를 담은 결과 객체
 */
export function resolveDropPosition(input: DockingInput): ResolveDropResult {
	// 노드 중심이 stage 밖이면 outside-stage 사유로 fallback을 시도한다
	if (isNodeCenterOutsideStage(input.position, input.stage)) {
		return resolveFailedDrop(input, DROP_REASONS.outsideStage);
	}

	const nearestCell = positionToNearestCellCoord(input.position, input.stage);

	// 최근접 셀을 계산할 수 없으면 no-nearest-cell 사유로 fallback을 시도한다
	if (!nearestCell) {
		return resolveFailedDrop(input, DROP_REASONS.noNearestCell);
	}

	if (
		!isDockableCell(
			nearestCell,
			input.occupancy,
			input.stage,
			input.ignoreNodeId,
		)
	) {
		return resolveFailedDrop(input, DROP_REASONS.occupiedCell);
	}

	// 최근접 셀이 비어 있으면 해당 셀로 스냅하여 정상 도킹 처리한다
	return {
		position: cellCoordToPosition(nearestCell),
		cell: nearestCell,
		reason: DROP_REASONS.validDock,
		usedFallback: false,
	};
}
