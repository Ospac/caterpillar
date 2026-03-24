# M2: Drag, Snap, Docking

## 목표
- 스냅/도킹/검증 도메인 로직 순수 함수 분리
- `freePosition`, `dockedCell`, `lastValidDock` 상태 흐름 구현
- 자유 드래그 + 드롭 시 nearest snap
- 스냅 프리뷰 + 히스테리시스 (`snapInDistance`, `snapOutDistance`)
- invalid drop 롤백 + fallback 체인

## 범위

**In Scope**
- 드래그 중 자유 이동, 드롭 시점 스냅 확정
- 도킹 상태 모델 (`DockedNodeState`) 및 전이 규칙
- 점유 셀/경계 검증 + fallback 정책
- 스냅 프리뷰 시각화 및 히스테리시스
- M2 Unit 테스트 + 핵심 컴포넌트 동작 테스트

**Out of Scope**
- 블록 편집 UX (M4), 검색 API (M5), 저장/협업 (M6)

## 구현 단계

### P0-A: 도메인 계약 고정
핵심 함수 시그니처:
```ts
getNearestDockCell(position, stage): CellCoord | null
isDockableCell(cell, occupancy, stage, ignoreNodeId?): boolean
resolveDropPosition(input): { position, cell, reason, usedFallback, strategy }
applyFallback(input): { position, strategy }
```
- 상수: `SNAP_IN_DISTANCE`, `SNAP_OUT_DISTANCE`, `DROP_REASONS`, `FALLBACK_STRATEGIES`

### P0-B: 상태 흐름
노드별 `DockedNodeState { freePosition, dockedCell, lastValidDock }`

| 이벤트 | 변경 |
|---|---|
| `dragStart` | `freePosition` 갱신, `dockedCell`/`lastValidDock` 유지 |
| `dragMove` | `freePosition`만 갱신 |
| `dragStop` | 세 필드 모두 갱신 |
| `cancel` | `lastValidDock`/`dockedCell` 기준으로 `freePosition` 복구 |

### P1-A: 드롭 시 nearest snap
- `snapToGrid: false` 유지 (자유 드래그)
- `onNodeDragStop` → `resolveDropPosition()` 호출 → 노드 좌표 반영

### P1-B: 스냅 프리뷰 + 히스테리시스
- 진입: `distance <= snapInDistance`, 해제: `distance >= snapOutDistance`
- 프리뷰는 시각 힌트만 — 실제 확정은 drop 시점만

### P2: invalid drop 롤백
- invalid 조건: stage 경계 밖, 점유 셀 충돌
- fallback 체인: `lastValidDock → nearest empty cell → clamp`
- `reason`/`strategy` 반환으로 추적 가능

### 안정화
- Unit (Rstest): nearest snap, occupancy, fallback 체인, hysteresis 경계값
- Component (RTL): drag-stop 스냅, 프리뷰 표시/해제, invalid drop 롤백
- 수동: M1 stage 확장 회귀 확인

## 검증 체크리스트
- [ ] 순수 함수 기반 스냅/도킹/검증 로직 분리
- [ ] `freePosition`, `dockedCell`, `lastValidDock` 상태 흐름 동작
- [ ] 자유 드래그 후 드롭 시 nearest snap 적용
- [ ] 스냅 프리뷰 + 히스테리시스 안정 동작
- [ ] invalid drop 시 fallback 우선순위대로 롤백
