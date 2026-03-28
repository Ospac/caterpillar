# Feature Reference

## 코드 위치 인덱스

| 역할 | 경로 |
|---|---|
| 캔버스 메인 오케스트레이터 | `src/features/diagram/ui/CanvasCore/CanvasCoreInner.tsx` |
| 그리드 유틸 | `src/features/diagram/lib/grid.ts` |
| 도킹 로직 | `src/features/diagram/lib/docking.ts` |
| 노드 스팬 | `src/features/diagram/lib/span.ts` |
| 런타임 타입 + 좌표 타입 | `src/features/diagram/lib/type.ts` |
| 런타임 상태 | `src/features/diagram/model/runtime.ts` |
| 블록 데이터 + 검증 | `src/features/diagram/model/block.ts` |
| 블록/노드 타입 정의 | `src/features/diagram/model/type.ts` |
| 문서 직렬화 | `src/features/diagram/model/document.ts` |
| 테스트 목 데이터 | `src/features/diagram/model/mock.ts` |
| 블록/캔버스 UI | `src/features/diagram/ui/CanvasCore/` |
| Tailwind 클래스 병합 | `src/shared/utils/cn.ts` |

---

## Canvas

**그리드 단계:** `4×4` → `7×7` → `10×10` (`GRID_STAGES`)
- `CELL_SIZE = 216px`
- 노드가 현재 가시 영역 밖으로 드래그되면 다음 단계로 자동 확장
- 그리드 가이드: 드래그 시작 시 표시, 드래그 종료 시 숨김
- `snapToGrid: false` — React Flow 자동 스냅 비활성화 필수

**드래그 라이프사이클:**
1. `onNodeDragStart` → `transitionDockedNodeState(..., { type: "dragStart" })` + 가이드 표시
2. `onNodeDrag` → `transitionDockedNodeState(..., { type: "dragMove" })` + stage 확장 체크
3. `onNodeDragStop` → `resolveDropPosition()` 호출 → 노드 좌표 반영 → `dragStop` 전이 → 가이드 숨김

**편집 중 드래그 비활성화:**
- `BlockNode` 컨테이너에 `isEditing` 시 `nodrag` 클래스 추가
- React Flow의 `noDragClassName`(기본값 `"nodrag"`)이 DOM 레벨에서 drag 감지를 차단
- prop 기반(`draggable: false`) 방식은 React 배칭 지연으로 무효 — 클래스 방식만 사용

**엣지:** React Flow 기본 drag 기반 연결/수정/재연결. 더블 클릭으로 삭제.

---

## Blocks

**구현된 타입 (M4 완료):** `text | image | link | music | game | movie | book` (7종 전부)

**노드 종류 — React Flow node type 기준:**
- `"menu"` 노드: 블록 타입 선택 UI. `MenuNodeData` — `BlockData`에 포함하지 않음
- `"block"` 노드: 실제 콘텐츠 블록. `BlockNodeData = BlockData + 런타임 콜백`

**생성 플로우:**
1. Add Node 버튼 → `"menu"` 노드 생성
2. 메뉴 노드에서 타입 선택 → `"block"` 노드 생성 + 메뉴 노드 제거
3. `initialEditing: true` 플래그로 생성 직후 편집 폼 즉시 진입

**BlockNodeData 런타임 콜백:**
```ts
type BlockNodeData = BlockData & {
  onDataChange?: (newData: BlockData) => void
  onEditStart?: () => void
  onEditEnd?: () => void
  initialEditing?: boolean
}
```

**타입별 편집:**
- `text`: textarea 인라인 편집
- `image`: URL 입력 + 캡션
- `link`: URL + 제목/설명 직접 입력 (OpenGraph 자동 채움은 M5)
- `music`/`game`/`movie`/`book`: 검색창 → mock 결과 선택 → 필드 반영 (실 API는 M5)

**NodeSpan — 블록 타입별 그리드 점유 크기:**
- `getNodeSpan(blockType)` → `NodeSpan { cols, rows }`
- 대부분 1×1, `link` 등 일부 타입은 1×2 (WIDE_SPAN)

**핵심 타입:** `BlockData` (판별 유니온), `validateBlockData()` → `ok | fallback | invalid`

---

## Data Model

**좌표 타입:**
- `XYPosition` — 픽셀 좌표 (React Flow)
- `CellCoord { col: number, row: number }` — 그리드 셀 좌표

**그리드:**
- `GridStage: 4 | 7 | 10`
- `GridOccupancy { occupiedCellCount, cellToNodeId: Map<string, string>, conflictedCellKeys: Set<string> }`

**노드:**
- `DiagramNode` — `Node<DiagramNodeData>` (React Flow 기반)
  - 주요 필드: `id`, `type`, `position`, `data`
- `DiagramNodeData = BlockNodeData | MenuNodeData`

**도킹 상태:**
- `DockedNodeState { freePosition, dockedCell, lastValidDock }`
- `RuntimeNodeDockingState: Record<string, DockedNodeState>`

**런타임 전체:**
- `CanvasRuntimeState { nodes, edges, visibleStage, nodeDockingState }`

**문서(직렬화 포맷):**
- `CanvasDocument { visibleStage, nodes: NodeItem[], edges: EdgeItem[] }`
- 임시 편집 상태 제외, `nodes/edges/visibleStage`만 저장

---

## Docking System

**상태 머신 (`transitionDockedNodeState`):**

| 이벤트 | 변경 필드 |
|---|---|
| `dragStart` | `freePosition` 갱신, `dockedCell`/`lastValidDock` 유지 |
| `dragMove` | `freePosition`만 갱신 |
| `dragStop` | `freePosition`, `dockedCell`, `lastValidDock` 모두 갱신 |
| `cancel` | `lastValidDock` 또는 `dockedCell` 기준으로 `freePosition` 복구 |

**핵심 함수:**
- `getNearestDockCell(position, stage)` — 픽셀 → 가장 가까운 `CellCoord`; stage 밖이면 `null`
- `isDockableCell(cell, occupancy, stage, ignoreNodeId?)` — stage 범위 + 점유 여부 검사
- `resolveDropPosition(input)` — 드롭 단일 진입점
- `createDockedNodeState(position, stage, span)` — 초기 상태 생성 (NodeSpan 포함)

**`resolveDropPosition` 처리 순서:**
1. stage 밖 → `outside-stage` → fallback
2. nearest cell 없음 → `no-nearest-cell` → fallback
3. nearest cell 점유 → `occupied-cell` → fallback
4. 모두 통과 → `valid-dock` → 해당 셀 스냅

**Fallback 체인 (`FALLBACK_STRATEGIES`):**
1. `last-valid-dock` — 마지막 유효 셀이 아직 비어 있으면 복귀
2. `nearest-empty-cell` — stage 전체 순회, 가장 가까운 빈 셀
3. `clamp` — 빈 셀 없을 때 좌표만 stage 안으로 보정

> 주의: 도킹 규칙은 `resolveDropPosition` 안에서만 계산. UI 이벤트 핸들러에서 중복 계산 금지.

---

## Search

**API 목록 (M5 구현 예정):**
- 음악: Last.fm API
- 게임: IGDB API
- 영화: TMDB API
- 책: Naver Book API / Google Books API

**현재 상태 (M4):** `model/mock.ts`의 mock 데이터로 동작. 실 API 연동은 M5.

**규칙:**
- 검색 결과 선택 시 표준 필드로 매핑: `title`, `description`, `image`, `originalLink`
- API 에러/빈 결과는 블록 단위로 처리 — 캔버스 전체 동작 영향 없음

---

## Persistence

**직렬화 경계:**
- 저장: `serializeCanvasDocument()` → `CanvasDocument` (nodes/edges/visibleStage만)
- 복원: `parseCanvasDocument()` → 런타임 상태 재구성
- 임시 상태(`nodeDockingState` 등) 제외

**구현 예정 (M6):** LocalStorage / 서버 저장 선택 UX, StorageAdapter 인터페이스 분리

---

## Testing

**계층별 전략:**
- Unit (Rstest): 도메인 규칙 — 스냅/도킹/검증 순수 함수
- Component (React Testing Library): 노드 생성/편집 UI (M7)
- E2E (Playwright): 드래그/도킹/연결/저장/복원 플로우 (M7)

**테스트 파일 위치:**
- `src/features/diagram/lib/__tests__/` — grid, docking 유틸
- `src/features/diagram/model/__tests__/` — block, document 검증
