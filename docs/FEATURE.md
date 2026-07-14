# Feature Reference

현재 diagram 기능의 코드 위치와 핵심 계약을 빠르게 확인하기 위한 문서입니다.

## 코드 위치 인덱스

| 역할                  | 경로                                                |
| --------------------- | --------------------------------------------------- |
| 캔버스 오케스트레이터 | `src/diagram/ui/CanvasCore/CanvasCore.tsx`          |
| 전역 문서 상태        | `src/diagram/model/canvasStore.ts`                  |
| 런타임 도킹 상태      | `src/diagram/model/runtime.ts`                      |
| 블록 데이터와 검증    | `src/diagram/model/blockTypes.ts`, `model/block.ts` |
| 노드 타입             | `src/diagram/model/nodeTypes.ts`                    |
| 문서 파싱과 직렬화    | `src/diagram/model/document.ts`                     |
| 그리드와 점유 계산    | `src/diagram/lib/grid.ts`                           |
| 좌표와 도킹 타입      | `src/diagram/lib/geometry.ts`                       |
| 도킹 해석             | `src/diagram/lib/docking.ts`                        |
| 블록별 span           | `src/diagram/lib/blockSpan.ts`                      |
| 런타임 리듀서         | `src/diagram/lib/canvasRuntimeReducer.ts`           |
| 노드 이벤트 hook      | `src/diagram/hooks/useCanvasNodes.ts`               |
| 엣지 이벤트 hook      | `src/diagram/hooks/useCanvasEdges.ts`               |
| 줌 hook과 순수 계산   | `src/diagram/hooks/useCanvasZoom.ts`, `lib/zoom.ts` |
| 검색 클라이언트       | `src/diagram/api/`                                  |
| 캔버스 노드 UI        | `src/diagram/ui/CanvasNode/`                        |
| 캔버스 오버레이 UI    | `src/diagram/ui/CanvasOverlay/`                     |
| 캔버스 메뉴           | `src/diagram/ui/Menu/`                              |

## Canvas

- 고정 크기: `30×15` cells (`DEFAULT_GRID_DIMENSIONS`)
- `CELL_SIZE = 106px`, 논리 크기 `3180×1590px`
- React Flow 자동 스냅은 끄고(`snapToGrid={false}`) 드롭 종료 시 도킹 로직을 적용
- React Flow pan/zoom, 노드·연결 auto-pan은 비활성화
- 바깥 컨테이너의 native scroll로 캔버스를 이동
- `read` 모드에서는 노드·엣지 변경 명령과 추가/삭제를 차단

`CanvasCoreInner`는 store 상태를 구독하고 occupancy를 계산한 뒤 노드, 엣지, 줌 hook을
React Flow에 연결합니다. 그리드 가이드는 노드 드래그, 엣지 드래그 또는 줌 중에 표시됩니다.

### 노드 드래그

드래그 중 위치의 source of truth는 React Flow node position입니다. 종료 시에만 다음 흐름으로
store와 런타임 도킹 상태를 확정합니다.

```text
onNodeDragStop
  -> getNodeSpan(blockType)
  -> resolveDropPosition()
  -> commitNodePosition()
  -> nodeDropCommitted reducer action
```

노드 목록이 바뀌면 `nodesSynced` action이 `nodeDockingState`를 추가·정리합니다. 드래그 여부는
React Flow의 `nodeLookup`에서 계산하며 별도 drag start/move 상태 머신은 없습니다.

### 엣지

- 일반 연결: `onConnect -> connectEdge()`
- 빈 공간에 연결 드롭: 위치를 flow 좌표로 변환하고 빈 2×2 영역이면 menu 노드와 엣지 생성
- 생성되는 엣지: `smoothstep`, 끝 marker는 `ArrowClosed`
- edit 모드에서 더블 클릭하거나 Delete/Backspace로 삭제
- read 모드에서는 연결, 변경, 삭제 불가

## Grid And Docking

두 좌표계를 사용합니다.

- `XYPosition { x, y }`: React Flow 픽셀 좌표
- `CellCoord { col, row }`: 도킹 anchor cell

`GridOccupancy`는 각 노드 span을 sub-cell로 펼쳐 `occupiedCellCount`, `cellToNodeId`,
`conflictedCellKeys`를 계산합니다. 충돌 셀은 도킹할 수 없습니다.

### Node Span

| 블록                                     | span |
| ---------------------------------------- | ---- |
| `text`, `image`, `link`, `music`, `menu` | 2×2  |
| `game`, `movie`, `book`                  | 1×2  |

검색형 블록은 편집하는 동안 UI만 2×4로 커집니다. 영속적인 점유와 도킹 계산에는
`getNodeSpan()`의 기본 span을 사용합니다.

### Drop Resolution

`resolveDropPosition()`은 다음 순서로 드롭을 해석합니다.

1. 노드 좌상단 또는 중심이 grid 밖이면 `outside-stage`
2. anchor cell을 계산할 수 없으면 `no-nearest-cell`
3. span 전체가 비어 있지 않으면 `occupied-cell`
4. 통과하면 `valid-dock`으로 cell 좌표에 snap

실패 시 fallback 순서는 다음과 같습니다.

1. `last-valid-dock`: 이전 유효 cell의 span이 아직 비어 있으면 복귀
2. `nearest-empty-cell`: Manhattan distance가 가장 가까운 빈 span 탐색
3. 빈 위치가 없으면 현재 position을 유지하고 `cell: null` 반환

`DockedNodeState`는 `dockedCell`과 `lastValidDock`만 저장합니다. 드롭 성공 후
`commitDockedNodeState()`는 현재 cell을 갱신하고, `null` 드롭은 마지막 유효 cell을 보존합니다.

## Zoom

줌은 React Flow의 내장 입력 제스처가 아니라, viewport에 보이는 grid column 수를 바꾸는
방식입니다. 자세한 계약은 `docs/diagram-zoom.md`를 참고합니다.

```text
visible cell count 변경
  -> gridZoom 파생
  -> canvas wrapper 크기와 React Flow viewport 반영
  -> anchor 기준 native scroll offset 복원
```

- `gridZoom`은 상태로 저장하지 않는 파생값
- 수동 조작 전에는 container 폭에 맞는 반응형 visible cell count 사용
- 실제 배율 범위는 `0.2`에서 `1`
- 버튼은 중앙 anchor를 기준으로 visible columns를 2칸씩 변경
- `Ctrl/Cmd + wheel`은 pointer anchor를 기준으로 1칸씩 변경
- modifier 없는 wheel은 native scroll 유지
- Reset은 100%가 아니라 수동값을 제거하고 반응형 기본값으로 복귀
- zoom 후 `useLayoutEffect`에서 scroll을 cell 경계에 맞춰 복원
- zoom guide는 마지막 줌 입력 후 600ms 동안 표시
- 메뉴 퍼센트는 raw 배율이 아니라 현재 viewport의 조작 가능 범위를 0~100%로 정규화

`CanvasCore`는 wrapper를 `renderedGridSize`로 렌더링하고 React Flow의 `viewport.zoom`,
`minZoom`, `maxZoom`을 모두 현재 `gridZoom`에 고정합니다. React Flow의 scroll, pinch,
double-click zoom은 계속 비활성화해야 합니다.

## Blocks

블록 타입은 `text | image | link | music | game | movie | book` 7종입니다.

- `menu`: 타입 선택용 임시 node type, `BlockData`에 포함되지 않음
- `block`: 실제 콘텐츠 node type
- `BlockNodeData = BlockData & { initialEditing?: boolean }`

생성 흐름:

```text
Add Node 또는 edge 빈 공간 드롭
  -> menu 노드 생성
  -> block type 선택
  -> 같은 id와 position의 block 노드로 교체
  -> initialEditing: true로 편집 시작
```

`BlockData`의 공통 필드는 `blockType`, `title`, `secondary`, 선택 필드 `image`, `year`입니다.
`validateBlockData()`는 Zod로 shape를 확인하고 `ok | fallback | invalid`를 반환합니다. 유효한
block type에서 빈 title은 block type 문자열로 보정됩니다.

직접 입력 폼은 `text`, `image`, `link`이고 검색 폼은 `music`, `game`, `movie`, `book`입니다.
read 모드로 바뀌면 열려 있던 편집 폼을 닫습니다.

## Search

검색 UI는 300ms debounce 후 검색어가 2자 이상일 때 TanStack Query를 실행하고 결과를 5분간
fresh 상태로 둡니다. API 응답은 Zod로 다음 공통 shape를 검증합니다.

```ts
type SearchResult = {
	title: string;
	secondary: string;
	year?: string;
	image?: string;
};
```

| 블록    | 내부 엔드포인트     | 공급자       |
| ------- | ------------------- | ------------ |
| `music` | `/api/search-music` | Last.fm      |
| `game`  | `/api/search-game`  | IGDB         |
| `movie` | `/api/search-movie` | TMDB         |
| `book`  | `/api/search-book`  | Google Books |

Netlify Functions가 비밀 값을 보유하고 외부 API를 호출합니다. 세부 환경 변수, 필드 매핑과 오류
계약은 `docs/API.md`를 참고합니다. UI는 loading, empty, error와 수동 재시도 상태를 제공합니다.

## State And Persistence

`useCanvasStore`가 문서 상태와 명령을 소유합니다.

- 상태: `mode`, `nodes`, `edges`, `dirty`, `lastSavedAt`, `saveStatus`, `nextNodeIndex`
- 문서 변경 action은 edit 모드에서만 동작
- `persist` middleware가 `localStorage["canvas-store"]`에 직렬화한 `nodes`, `edges`만 저장
- 복원 시 `parseCanvasDocument()`로 검증하고 다음 node index를 다시 계산
- 런타임 값인 mode, 저장 상태, node index, `nodeDockingState`, 편집 상태는 저장하지 않음

`CanvasDocument`는 `nodes`와 `edges`만 포함합니다. `visibleStage`나 zoom 상태는 문서 포맷에
포함되지 않습니다. `initialEditing` 같은 런타임 데이터도 직렬화 과정에서 제거됩니다.

## Testing

- `lib/__tests__/grid.test.ts`: span, 경계, occupancy
- `lib/__tests__/docking.test.ts`: 도킹 상태, 충돌, fallback
- `lib/__tests__/edge.test.ts`: 빈 공간 menu 생성 위치와 handle
- `lib/__tests__/zoom.test.ts`: visible cell, 배율, wheel, anchor offset
- `model/__tests__/block.test.ts`: 블록 검증과 fallback
- `model/__tests__/document.test.ts`: 파싱과 직렬화 경계
- `model/__tests__/canvasStore.test.ts`: mode guard, 변경 명령, persist shape
- `ui/Menu/Menu.test.tsx`: 메뉴 명령과 줌 표시

현재 별도 E2E 테스트와 `useCanvasZoom` hook 전용 테스트는 없습니다.
