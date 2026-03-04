# Data

## Code Location
- `src/features/diagram/model`: 노드/그리드/엣지 타입 및 스키마
- `src/shared/types`: 전역 공용 타입(필요 시)

## Data Model (Suggested)
- `NodeItem`
  - `id`, `type`, `data`
  - `freePosition: { x, y }`
  - `dockedCell: { row, col } | null`
  - `lastValidDock: { row, col } | null`
- `GridState`
  - `rows`, `cols`, `cellSize`, `origin`
  - `occupied: Record<CellKey, nodeId>`
- `EdgeItem`
  - React Flow edge schema 준수

## Design Principles
- 캔버스 직렬화 스키마 버전을 유지해 마이그레이션과 하위 호환을 지원한다.
- 도메인 로직은 순수 함수로 분리해 테스트 가능성을 높인다.
