# Data

## Code Location
- `src/features/diagram/lib/type.ts`: 런타임 좌표, 그리드, 도킹 관련 타입
- `src/features/diagram/model/runtime.ts`: `CanvasRuntimeState`, `RuntimeNodeDockingState`
- `src/features/diagram/model/block.ts`: 최소 블록 데이터 구조, 기본값, validation
- `src/features/diagram/model/document.ts`: `CanvasDocument`, parse/serialize 진입점
- `@xyflow/react`: `DiagramNode`/edge의 기반 스키마(React Flow 타입)

## Data Model
- `CellCoord`
  - `col: number`
  - `row: number`
- `GridStage`
  - `4 | 7 | 10` (`GRID_STAGES` 기반)
- `DiagramNodeData`
  - `text` | `image` | `link` 블록 union
  - 공통 필드: `blockType`, `title`
- `DiagramNode`
  - React Flow `Node<DiagramNodeData>` 타입
  - Canvas Core에서 주로 사용하는 필드: `id`, `type`, `position`, `data`
- `RuntimeNodeDockingState`
  - `Record<string, DockedNodeState>`
- `CanvasRuntimeState`
  - `nodes`, `edges`, `visibleStage`, `nodeDockingState`
- `GridOccupancy`
  - `occupiedCellCount: number`
  - `cellToNodeId: Map<string, string>`
  - `conflictedCellKeys: Set<string>`
- `CanvasDocument`
  - `visibleStage`
  - `nodes: NodeItem[]`
  - `edges: EdgeItem[]`

## Design Principles
- 저장 포맷은 현재 필요한 구조만 유지하고, 스키마 버전과 마이그레이션은 실제 필요가 생길 때 도입한다.
- document는 `nodes`, `edges`, `visibleStage`만 저장하고 임시 편집 상태는 제외한다.
- 도메인 로직은 순수 함수로 분리해 테스트 가능성을 높인다.
