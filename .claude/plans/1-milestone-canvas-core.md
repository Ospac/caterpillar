# M1: Canvas Core

## 목표
- React Flow 기반 캔버스/노드/엣지 기본 동작
- 최대 `10×10` 그리드 모델 + 점유 로직
- 가시 영역 단계 확장: `4×4 → 7×7 → 10×10`
- 경계 밖 드래그 시 다음 단계 자동 확장
- 드래그 시작/종료 시 그리드 가이드 표시/숨김

## 범위

**In Scope**
- React Flow 캔버스 초기화, 노드/엣지 상태 훅, 연결/삭제 이벤트
- 셀 점유 맵 (`GridOccupancy`), 이동 시 재계산
- 단계 확장 트리거 및 뷰 갱신 (`GRID_STAGES: 4 | 7 | 10`)
- 경계 초과 드래그 감지 → 자동 확장
- `onNodeDragStart`/`onNodeDragStop`에서 가이드 오버레이 표시/숨김

**Out of Scope**
- 스냅 히스테리시스/`lastValidDock` (M2)
- 블록 타입별 편집 UX (M4)
- 저장/복원/협업 (M6)

## 구현 단계

### 1. Canvas Baseline
- React Flow 캔버스 초기화, 노드/엣지 기본 이벤트 연결
- 확대/축소: 버튼 기반, 미니맵 제외

### 2. Grid Model
- `CellCoord { col, row }`, `GridOccupancy` 타입 정의
- `XYPosition → CellCoord` 변환 유틸, 점유/경계 체크 순수 함수화

### 3. Stage Expansion
- 초기 `4×4`, 조건 충족 시 `7×7` → `10×10` 단방향 확장
- 단계별 렌더링 범위와 가이드 범위 동기화

### 4. Auto Expand on Boundary Drag
- 드래그 중 현재 가시 경계 초과 감지 → 다음 단계 트리거
- 확장 직후 드래그 흐름이 끊기지 않게 이벤트 처리

### 5. Grid Guide Visibility
- `onNodeDragStart` → 가이드 표시
- `onNodeDragStop` / 취소 → 가이드 숨김
- 가이드 범위를 현재 `visibleStage` 크기와 동기화

### 6. 안정화
- 상태 책임 분리: UI 이벤트 vs 도메인 계산
- 핵심 계산 Unit 테스트 (점유/경계/단계 전환)
- `pnpm build` 통과

## 검증 체크리스트
- [ ] React Flow 기반 캔버스/노드/엣지 기본 동작
- [ ] 최대 `10×10` 그리드 모델 + 점유 로직
- [ ] 가시 영역 단계 확장 (`4×4 → 7×7 → 10×10`)
- [ ] 경계 밖 드래그 시 다음 단계 자동 확장
- [ ] 드래그 시작/종료에 따라 가이드 표시/숨김
