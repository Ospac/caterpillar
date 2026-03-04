# Canvas

## Code Location
- `src/features/diagram/ui`: 캔버스 화면, React Flow 컴포넌트
- `src/features/diagram/model`: 드래그/스냅/도킹 규칙
- `src/features/diagram/lib`: 캔버스 보조 유틸

## Core Requirements
### Drag and Movement
- 드래그는 자유 이동으로 동작한다 (`snapToGrid` 사용 금지).
- 노드를 이동할 때 가까운 그리드 셀 또는 인접 셀에 접근하면 자석처럼 스냅 프리뷰를 보여준다.
- 스냅이 한 번 활성화되면 짧은 히스테리시스를 적용해 덜컥거림을 줄인다.

### Drop and Docking
- 드롭 자체는 어디서든 허용한다.
- 최종 착지(도킹)는 그리드 내부에서만 확정한다.
- 그리드 밖 또는 점유된 셀에 드롭하면 마지막 유효 도킹 위치로 롤백한다.

### Connections
- React Flow 기본 기능을 사용해 노드 간 선 연결(edge)을 지원한다.
- 연결은 드래그 기반으로 생성/수정/재연결 가능해야 한다.

## Interaction Design Rules
### Drag Lifecycle
1. `onNodeDragStart`: 드래그 세션 시작, 기준 좌표 저장
2. `onNodeDrag`: 자유 이동 유지 + 근접 셀 탐색 + 스냅 프리뷰 계산
3. `onNodeDragStop`: 도킹 유효성 검사 후 확정/롤백

### Snap Preview + Hysteresis
- 진입 임계값(`snapInDistance`)과 이탈 임계값(`snapOutDistance`)을 분리한다.
- `snapOutDistance`를 더 크게 두어 스냅 상태가 잠깐 유지되게 만든다.
- 프리뷰는 시각 신호만 제공하고, 실제 확정은 드롭 시점에만 수행한다.

### Dock Validation
- 유효 조건:
  - 그리드 영역 내부
  - 대상 셀 미점유
- 실패 시:
  - `lastValidDock`로 롤백
  - 롤백 불가능하면 최초 생성 기본 셀 또는 정책 기반 fallback 사용
