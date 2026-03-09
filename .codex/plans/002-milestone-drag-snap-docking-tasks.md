# Milestone 2 Task Breakdown (Executable Checklist)

## 사용 방법
- 각 항목은 독립 PR 단위로 쪼갤 수 있도록 작성했다.
- 의존성이 있는 항목은 선행 태스크 완료 후 진행한다.
- 모든 태스크는 "완료 기준(DoD)" 충족 시 완료 처리한다.

## P0 (Foundation)

### T1. 도메인 타입/상수 정의
- [ ] `snapInDistance`, `snapOutDistance`, fallback strategy enum 상수 정의
- [ ] drop 판정 결과 타입(`reason`, `usedFallback`, `strategy`) 정의
- [ ] 기존 grid 타입과 충돌 없는지 타입 정합성 점검

의존성
- 없음

완료 기준(DoD)
- 타입 에러 0건
- 상수/타입이 후속 함수에서 재사용 가능

### T2. 순수 함수: nearest snap 계산
- [ ] `getNearestDockCell(position, stage)` 구현
- [ ] stage 경계 내/외 케이스 처리
- [ ] 동률/경계값 tie-break 규칙 고정

의존성
- T1

완료 기준(DoD)
- 동일 입력 -> 동일 출력 보장
- 경계값 케이스 테스트 통과

### T3. 순수 함수: 도킹 가능성 검증
- [ ] `isDockableCell(cell, occupancy, stage)` 구현
- [ ] 점유 셀 충돌 판정
- [ ] stage 범위 검증

의존성
- T1

완료 기준(DoD)
- 점유/비점유/범위 밖 케이스 테스트 통과

### T4. 순수 함수: fallback 체인
- [ ] `applyFallback(input)` 구현
- [ ] 우선순위 적용: `lastValidDock -> nearest empty cell -> clamp`
- [ ] 선택된 전략(`strategy`) 반환

의존성
- T2, T3

완료 기준(DoD)
- invalid drop 입력에서 항상 최종 위치 반환
- 전략 로그가 기대 우선순위와 일치

### T5. 순수 함수: drop 해결기
- [ ] `resolveDropPosition(input)` 구현
- [ ] valid drop 시 nearest snap 반영
- [ ] invalid drop 시 fallback 위임

의존성
- T2, T3, T4

완료 기준(DoD)
- 단일 진입점으로 모든 drop 시나리오 처리
- `reason/usedFallback` 결과가 테스트와 일치

### T6. 상태 모델 도입
- [ ] 노드 상태에 `freePosition`, `dockedCell`, `lastValidDock` 반영
- [ ] drag 이벤트별 상태 전이표 문서화
- [ ] 상태 갱신 책임 분리(UI 이벤트 vs 도메인 함수)

의존성
- T5

완료 기준(DoD)
- dragStart/dragMove/dragStop/cancel 전이 일관성 확보
- `lastValidDock` 누락 케이스 없음

## P1 (Core Interaction)

### T7. 자유 드래그 + 드롭 시점 스냅
- [ ] 드래그 중 자유 이동 유지 (`snapToGrid` 비활성 유지 확인)
- [ ] `onNodeDragStop`에서 `resolveDropPosition` 호출
- [ ] 최종 좌표 반영 및 상태 동기화

의존성
- T6

완료 기준(DoD)
- 드롭 순간에만 스냅 적용
- 기존 M1 stage 확장 동작 회귀 없음

### T8. 스냅 프리뷰 표시
- [ ] 프리뷰 셀 계산/표시 로직 추가
- [ ] 프리뷰와 확정 도킹 상태 분리
- [ ] 빠른 드래그 시 렌더 과다 갱신 최소화

의존성
- T7

완료 기준(DoD)
- 프리뷰가 드래그 맥락에 맞게 정확히 표시
- 드롭 확정 전에는 실제 위치 변경 없음

### T9. 히스테리시스 적용
- [ ] `snapInDistance` 진입 규칙 구현
- [ ] `snapOutDistance` 유지/해제 규칙 구현
- [ ] 경계값 떨림 방지(진입/이탈 분리)

의존성
- T8

완료 기준(DoD)
- 경계 부근에서 프리뷰 깜빡임 최소화
- 임계값 변경 시 동작 예측 가능

## P2 (Recovery/Policy)

### T10. invalid drop 정책 연결
- [ ] 경계 밖/점유 셀 드롭 시 invalid 처리
- [ ] `lastValidDock` 롤백 동작 연결
- [ ] fallback 체인 UI 반영

의존성
- T9

완료 기준(DoD)
- invalid drop에서도 최종 위치 미결정 상태 없음
- 우선순위 정책이 실제 동작과 일치

### T11. 관측성/디버깅 보강
- [ ] `reason`, `strategy`를 개발용 로그/디버그 패널에 노출(개발 모드)
- [ ] 주요 실패 케이스 재현용 시나리오 문서화

의존성
- T10

완료 기준(DoD)
- 이슈 재현 시 fallback 결정 경로 추적 가능

## 테스트 태스크

### T12. Unit (Vitest)
- [ ] nearest snap 계산 테스트
- [ ] occupancy/경계 검증 테스트
- [ ] fallback 체인 우선순위 테스트
- [ ] hysteresis 경계값 테스트

의존성
- T5, T9

완료 기준(DoD)
- 핵심 순수 함수 분기 커버

### T13. Component (RTL)
- [ ] drag-stop 시 snap 반영 테스트
- [ ] 프리뷰 표시/해제 테스트
- [ ] invalid drop 롤백 테스트

의존성
- T10

완료 기준(DoD)
- 주요 사용자 플로우 회귀 방지 가능

### T14. 수동 회귀 점검
- [ ] M1: stage 확장(4->7->10) 동작 확인
- [ ] M1: 가이드 표시/숨김 동작 확인
- [ ] M2: snap/preview/rollback 동작 확인

의존성
- T13

완료 기준(DoD)
- 체크리스트 전 항목 통과

## 권장 실행 순서 (PR 단위: 2개)
1. PR-1: T1~T7 (P0 전부 + P1 핵심 snap + 순수 함수/핵심 경로 Unit)
2. PR-2: T8~T11, T12~T14 (프리뷰/히스테리시스 + rollback/fallback + 컴포넌트/회귀 검증)
