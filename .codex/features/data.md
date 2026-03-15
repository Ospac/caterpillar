# Data

## Code Location
- `src/features/diagram/lib/grid.ts`: `DiagramNode`, `CellCoord`, `GridStage`, `GridOccupancy`
- `@xyflow/react`: `DiagramNode`/edge의 기반 스키마(React Flow 타입)

## Data Model
- `CellCoord`
  - `col: number`
  - `row: number`
- `GridStage`
  - `4 | 7 | 10` (`GRID_STAGES` 기반)
- `DiagramNodeData`
  - `label: string`
- `DiagramNode`
  - React Flow `Node<DiagramNodeData>` 타입
  - Canvas Core에서 주로 사용하는 필드: `id`, `type`, `position`, `data.label`
  - `freePosition`/`dockedCell`/`lastValidDock` 필드는 현재 런타임 모델에 없음
- `GridOccupancy`
  - `occupiedCellCount: number`
  - `conflictCellCount: number`
  - `cellToNodeIds: Map<string, string[]>`
  - 점유 정보는 `Record`가 아니라 `Map` 기반으로 계산/보관됨
- `Edge`
  - 기존과 동일하게 React Flow edge schema 준수

## Design Principles
- 저장 포맷은 현재 필요한 구조만 유지하고, 스키마 버전과 마이그레이션은 실제 필요가 생길 때 도입한다.
- 도메인 로직은 순수 함수로 분리해 테스트 가능성을 높인다.
