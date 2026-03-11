# Docking Guide

## 목적
현재 구현된 M2 `T1~T7`의 도킹 로직이 어떤 상태와 함수 흐름으로 동작하는지 설명한다.  
대상 코드는 다음 두 파일이다.

- `src/features/diagram/lib/docking.ts`
- `src/features/diagram/ui/CanvasCore/CanvasCoreInner.tsx`

## 핵심 개념
이번 단계의 목표는 "드래그 중 자유 이동"과 "드롭 시점 스냅 확정"을 분리하는 것이다.

- 드래그 중에는 노드가 자유롭게 움직인다.
- 드롭하는 순간 nearest dock cell을 계산한다.
- 유효하지 않은 드롭이면 fallback 체인을 적용한다.
- 노드마다 자유 좌표와 도킹 상태를 별도로 유지한다.

## 상태 모델
도킹 상태는 `DockedNodeState`로 관리한다.

- `freePosition`: 드래그 중 실제 자유 좌표
- `dockedCell`: 현재 확정된 셀
- `lastValidDock`: 마지막으로 유효했던 셀

이 구조로 인해 "지금 마우스로 이동 중인 위치"와 "최종 도킹 위치"를 구분할 수 있다.

## 도메인 상수와 결과 타입
`src/features/diagram/lib/docking.ts`에는 도킹 규칙을 표현하는 상수와 타입이 있다.

- `SNAP_IN_DISTANCE`, `SNAP_OUT_DISTANCE`
  - 현재 단계에서는 상수만 정의되어 있다.
  - 이후 프리뷰, 히스테리시스 구현에서 사용한다.
- `DROP_REASONS`
  - `valid-dock`
  - `outside-stage`
  - `occupied-cell`
  - `no-nearest-cell`
- `FALLBACK_STRATEGIES`
  - `last-valid-dock`
  - `nearest-empty-cell`
  - `clamp`

드롭 처리 결과는 `position`, `cell`, `reason`, `usedFallback`, `strategy` 조합으로 반환된다.

## 드래그 상태 전이
이벤트별 상태 변경 규칙은 `transitionDockedNodeState`에 고정되어 있다.

### dragStart
- `freePosition`만 현재 좌표로 갱신한다.
- 기존 `dockedCell`, `lastValidDock`는 유지한다.

### dragMove
- `freePosition`만 드래그 좌표로 갱신한다.

### dragStop
- 최종 좌표를 `freePosition`에 반영한다.
- 최종 확정 셀을 `dockedCell`에 반영한다.
- 확정 셀이 있으면 `lastValidDock`도 갱신한다.

### cancel
- `lastValidDock` 또는 `dockedCell` 기준 위치로 `freePosition`을 복구한다.

## nearest dock 계산
`getNearestDockCell(position, stage)`는 좌표에서 가장 가까운 셀을 계산한다.

- 노드 크기(`NODE_SIZE`) 기준으로 셀 인덱스를 계산한다.
- 경계값 tie-break가 항상 같은 방향으로 처리되도록 `Number.EPSILON`을 사용한다.
- 계산된 셀이 현재 `stage` 범위 밖이면 `null`을 반환한다.

이 함수는 동일 입력에 대해 동일 출력을 반환해야 한다.

## 도킹 가능 셀 검증
`isDockableCell(cell, occupancy, stage, ignoreNodeId?)`는 셀이 실제로 사용 가능한지 검사한다.

검사 항목은 두 가지다.

- 현재 `stage` 범위 안인지
- 다른 노드가 이미 점유 중인지

`ignoreNodeId`를 넘기면 자기 자신은 충돌로 간주하지 않는다.  
그래서 드래그 중인 노드가 원래 위치한 셀을 occupied로 오판하지 않는다.

## fallback 체인
유효하지 않은 드롭이면 `applyFallback`이 대체 위치를 결정한다.

우선순위는 다음과 같다.

1. `lastValidDock`
2. nearest empty cell
3. clamp position

### 1. lastValidDock
- 마지막 유효 셀이 아직 비어 있고 stage 안에 있으면 그 셀로 복귀한다.

### 2. nearest empty cell
- 현재 위치 또는 마지막 유효 셀에 가장 가까운 빈 셀을 찾는다.
- stage 전체를 순회하면서 가장 작은 거리의 빈 셀을 선택한다.

### 3. clamp position
- 빈 셀도 찾지 못하면 좌표를 stage 안쪽으로만 보정한다.
- 이 경우 셀이 아닌 좌표 보정이므로 마지막 안전 장치 역할이다.

반환값에는 `strategy`가 포함되어 어떤 fallback이 선택됐는지 추적할 수 있다.

## drop resolver
`resolveDropPosition(input)`은 드롭 처리의 단일 진입점이다.

처리 순서는 다음과 같다.

1. 노드가 stage 밖에 있으면 `outside-stage`로 판단하고 fallback 적용
2. nearest cell이 없으면 `no-nearest-cell`로 판단하고 fallback 적용
3. nearest cell이 occupied면 `occupied-cell`로 판단하고 fallback 적용
4. 모두 통과하면 `valid-dock`으로 판단하고 해당 셀 위치로 스냅

UI는 이 함수의 결과를 그대로 반영하면 된다.  
도킹 규칙을 UI 이벤트 핸들러 안에서 다시 계산하지 않는다.

## CanvasCoreInner에서의 연결 방식
React Flow 쪽에서는 `nodeDockingState`를 별도로 둬서 노드별 도킹 상태를 저장한다.

- key: 노드 id
- value: `DockedNodeState`

초기 노드와 새로 추가된 노드는 `createDockedNodeState(position, stage)`로 초기화한다.

## 드래그 이벤트 흐름
### onNodeDragStart
- 가이드를 표시한다.
- `transitionDockedNodeState(..., { type: "dragStart" })` 호출
- 도킹 상태는 유지하고 자유 좌표만 시작 시점으로 맞춘다.

### onNodeDrag
- `transitionDockedNodeState(..., { type: "dragMove" })` 호출
- `freePosition`을 계속 갱신한다.
- 노드가 현재 stage 밖으로 나가면 기존 M1 규칙대로 stage를 확장한다.

### onNodeDragStop
- 현재 노드의 `lastValidDock`를 읽는다.
- `resolveDropPosition(...)`을 호출한다.
- 반환된 `resolution.position`을 실제 노드 좌표에 반영한다.
- 같은 결과를 `transitionDockedNodeState(..., { type: "dragStop" })`로 도킹 상태에도 반영한다.
- 가이드를 숨긴다.

즉, 드롭 시점에만 최종 스냅과 fallback이 적용된다.

## snapToGrid 처리
React Flow의 기본 `snapToGrid`는 명시적으로 `false`다.

- 드래그 중 React Flow가 자동 스냅하지 않는다.
- 대신 드롭 시점에만 `resolveDropPosition`이 최종 좌표를 결정한다.

이 설정이 있어야 "자유 드래그 + 드롭 시점 스냅" 요구사항을 만족할 수 있다.

## 현재 단계에서 보장되는 동작
- 드래그 중 자유 이동
- 기존 stage 확장 동작 유지
- 드롭 순간 nearest snap 시도
- invalid drop이면 fallback 체인 적용
- 노드별 `freePosition`, `dockedCell`, `lastValidDock` 유지

## 아직 남은 작업
현재 문서는 `T1~T7` 기준이다. 아직 구현하지 않은 항목은 다음과 같다.

- 스냅 프리뷰 UI
- 히스테리시스(`snapInDistance`, `snapOutDistance`) 실제 적용
- invalid drop 이유 및 strategy 노출
- 테스트 코드
