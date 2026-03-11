# Milestone 2 Plan (Drag, Snap, Docking)

## 목표
`roadmap.md`의 **M2. Drag, Snap, Docking** 항목을 우선순위(`P0 -> P1 -> P2`)대로 구현 가능한 상태로 완수한다.
- `[P0]` 스냅/도킹/검증 도메인 로직 순수 함수 분리
- `[P0]` `freePosition`, `dockedCell`, `lastValidDock` 상태 흐름 구현
- `[P1]` 자유 드래그 + 드롭 시 nearest snap
- `[P1]` 스냅 프리뷰 + 히스테리시스(`snapInDistance`, `snapOutDistance`)
- `[P2]` invalid drop 롤백 + fallback(`lastValidDock -> nearest empty cell -> clamp`)

## 범위 (In Scope)
- 드래그 중 자유 이동, 드롭 시점 스냅 확정
- 도킹 상태 모델 및 전이 규칙
- 점유 셀/경계 검증과 fallback 정책
- 스냅 프리뷰 시각화 및 임계거리 기반 유지/해제
- M2 기준 테스트(Unit 중심 + 핵심 컴포넌트 동작)

## 범위 (Out of Scope)
- 블록 편집 UX(M4), 검색 API(M5), 저장/협업(M6)
- 스키마 마이그레이션(M3 잔여 항목)

## 구현 단계

### 1. P0-A 도메인 계약(순수 함수) 고정
- 함수 시그니처 정의
  - `getNearestDockCell(position, stage): CellCoord | null`
  - `isDockableCell(cell, occupancy, stage): boolean`
  - `resolveDropPosition(input): { nextPosition; reason; usedFallback }`
  - `applyFallback(input): { position; strategy }`
- 입력/출력 타입(노드 좌표, 셀, 점유맵, stage) 명시
- 경계/점유/거리 계산 상수화 (`snapInDistance`, `snapOutDistance` 포함)

완료 기준
- UI 코드 없이 함수 단독 테스트 가능한 구조
- fallback 전략 우선순위가 코드로 고정됨

### 2. P0-B 상태 흐름 설계 및 반영
- 노드별 상태 모델 정의
  - `freePosition`: 드래그 중 실제 좌표
  - `dockedCell`: 현재 확정 도킹 셀
  - `lastValidDock`: 마지막 유효 도킹 셀
- 이벤트별 상태 전이 정의
  - `dragStart`, `dragMove`, `dragStop`, `dragCancel`
- React Flow 이벤트와 상태 책임 분리(UI 이벤트 -> 도메인 함수 호출 -> 상태 반영)

완료 기준
- 상태 전이표 기준으로 모든 이벤트가 일관 처리
- `lastValidDock`가 롤백 기준으로 안정적으로 유지

### 3. P1-A 드롭 시 nearest snap 구현
- 드래그 중에는 `snapToGrid` 없이 자유 이동 유지
- `onNodeDragStop`에서 nearest cell 계산 후 스냅 확정
- 스냅 불가 시 즉시 fallback 진입 없이 "검증 결과" 먼저 확보

완료 기준
- 드롭 순간에만 위치가 스냅됨
- nearest snap 결과가 항상 재현 가능(동일 입력 -> 동일 결과)

### 4. P1-B 스냅 프리뷰 + 히스테리시스
- 프리뷰 셀 표시 규칙 정의
  - 진입: `distance <= snapInDistance`
  - 유지/해제: `distance >= snapOutDistance`
- 프리뷰와 최종 확정 분리(프리뷰는 힌트, 확정은 drop 시 결정)
- 빠른 드래그/경계 인접 상황에서 프리뷰 깜빡임 최소화

완료 기준
- 프리뷰가 경계값에서 튀지 않고 안정적으로 표시
- 사용자가 드롭 전에 스냅 의도를 시각적으로 인지 가능

### 5. P2 invalid drop 롤백 + fallback 완성
- invalid 조건
  - stage 경계 밖
  - 점유 셀 충돌
- fallback 체인 적용
  1. `lastValidDock`
  2. nearest empty cell
  3. clamp position
- 각 결과에 `reason/strategy` 기록(디버깅/테스트 용)

완료 기준
- 무효 드롭에서도 노드 위치가 항상 결정됨(불확정 상태 없음)
- 정책 순서대로 fallback이 적용됨

### 6. 안정화 및 검증
- Unit(Vitest)
  - nearest snap, hysteresis 경계값, occupancy 충돌, fallback 체인
- Component(RTL)
  - drag-stop 스냅, 프리뷰 표시/해제, invalid drop 롤백
- 수동 시나리오
  - stage 확장과 M2 동작 동시 검증(회귀 확인)

완료 기준
- M2 체크리스트 전 항목 통과
- 기존 M1 동작(확장/가이드/연결) 회귀 없음

## 산출물
- M2 도메인 순수 함수 모듈(스냅/도킹/검증/fallback)
- 노드 도킹 상태 흐름(`freePosition`, `dockedCell`, `lastValidDock`)
- 드롭 시 nearest snap + 프리뷰/히스테리시스 UX
- invalid drop 롤백 정책 완성 및 테스트 세트

## 검증 체크리스트 (M2 기준)
- [ ] 순수 함수 기반으로 스냅/도킹/검증 로직이 분리됐다.
- [ ] `freePosition`, `dockedCell`, `lastValidDock` 상태 흐름이 동작한다.
- [ ] 자유 드래그 후 드롭 시 nearest snap이 적용된다.
- [ ] 스냅 프리뷰와 히스테리시스가 안정적으로 동작한다.
- [ ] invalid drop 시 fallback 우선순위대로 롤백된다.

## 리스크와 대응
- 리스크: UI 이벤트 핸들러에 도메인 로직이 다시 섞일 가능성
- 대응: 이벤트 핸들러는 "입력 수집/결과 반영"만 수행하도록 규칙화

- 리스크: 히스테리시스 임계값 튜닝 실패로 프리뷰 떨림 발생
- 대응: 임계값 상수 분리 + 경계값 테스트 케이스 고정

- 리스크: fallback 체인에서 예외 분기 누락
- 대응: `resolveDropPosition` 단일 진입점 강제 + reason 코드 기반 테스트
