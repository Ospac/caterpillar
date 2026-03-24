# M2: Task Breakdown

PR 단위 권장 분할:
- **PR-1**: T1~T7 (P0 전부 + P1 핵심 snap)
- **PR-2**: T8~T11, T12~T14 (프리뷰/히스테리시스 + rollback + 검증)

---

## P0 (Foundation)

### T1. 타입/상수 정의
- `SNAP_IN_DISTANCE`, `SNAP_OUT_DISTANCE` 상수 정의
- `DROP_REASONS`: `valid-dock | outside-stage | occupied-cell | no-nearest-cell`
- `FALLBACK_STRATEGIES`: `last-valid-dock | nearest-empty-cell | clamp`
- drop 결과 타입 (`reason`, `usedFallback`, `strategy`) 정의

의존성: 없음

### T2. `getNearestDockCell`
- `getNearestDockCell(position, stage): CellCoord | null`
- stage 경계 내/외 케이스, 경계값 tie-break 고정 (`Number.EPSILON`)

의존성: T1

### T3. `isDockableCell`
- `isDockableCell(cell, occupancy, stage, ignoreNodeId?): boolean`
- 점유 충돌 판정 + stage 범위 검증

의존성: T1

### T4. `applyFallback`
- 우선순위: `lastValidDock → nearest empty cell → clamp`
- 선택된 `strategy` 반환

의존성: T2, T3

### T5. `resolveDropPosition`
- 단일 진입점: valid drop → nearest snap / invalid → fallback 위임
- `reason`, `usedFallback` 포함 결과 반환

의존성: T2, T3, T4

### T6. 상태 모델 도입
- `DockedNodeState { freePosition, dockedCell, lastValidDock }` 반영
- `transitionDockedNodeState` 이벤트별 전이 구현
- 상태 갱신 책임: UI 이벤트 → 도메인 함수 호출 → 상태 반영

의존성: T5

---

## P1 (Core Interaction)

### T7. 자유 드래그 + 드롭 시점 스냅
- `snapToGrid: false` 유지 확인
- `onNodeDragStop` → `resolveDropPosition()` → 좌표 반영 + 상태 동기화

의존성: T6

### T8. 스냅 프리뷰
- 프리뷰 셀 계산/표시 로직 추가
- 프리뷰 상태와 확정 도킹 상태 분리

의존성: T7

### T9. 히스테리시스
- `snapInDistance` 진입 규칙
- `snapOutDistance` 유지/해제 규칙

의존성: T8

---

## P2 (Recovery/Policy)

### T10. invalid drop 정책 연결
- 경계 밖/점유 셀 → invalid 처리 → `lastValidDock` 롤백 → fallback 체인 UI 반영

의존성: T9

### T11. 개발 모드 관측성
- `reason`, `strategy`를 개발 모드 로그에 노출

의존성: T10

---

## 테스트

### T12. Unit (Rstest)
- nearest snap, occupancy/경계, fallback 체인, hysteresis 경계값

의존성: T5, T9

### T13. Component (RTL)
- drag-stop snap 반영, 프리뷰 표시/해제, invalid drop 롤백

의존성: T10

### T14. 수동 회귀 점검
- M1: stage 확장 (4→7→10), 가이드 표시/숨김
- M2: snap/preview/rollback

의존성: T13
