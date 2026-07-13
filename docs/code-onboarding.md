# Diagram 코드 온보딩

이 문서는 현재 프로젝트의 핵심 기능을 코드 단위로 빠르게 읽기 위한 안내서입니다. 전체 기능은 React Flow 캔버스 위에 블록 노드를 만들고, 편집하고, 연결하고, 로컬에 저장하는 흐름으로 이해하면 됩니다.

## 1. 데이터 모델

출발점은 `src/diagram/model/blockTypes.ts`입니다.

블록 타입은 7개입니다.

```ts
text | image | link | music | game | movie | book;
```

현재 모든 블록은 공통 필드 구조를 공유합니다.

```ts
blockType
title
secondary
image?
year?
```

`src/diagram/model/block.ts`의 `validateBlockData()`는 저장소나 localStorage에서 복원한 값이 실제 블록으로 쓸 수 있는지 검증하는 관문입니다.

## 2. 문서와 저장 모델

저장 가능한 캔버스 구조는 `src/diagram/model/document.ts`의 `CanvasDocument`입니다.

핵심 함수는 다음과 같습니다.

- `parseCanvasDocument()`: 외부/저장 데이터를 런타임 노드와 엣지로 복원합니다.
- `serializeCanvasDocument()`: 현재 캔버스를 저장 가능한 JSON 형태로 바꿉니다.
- `addNode()`: 메뉴 노드를 만듭니다.
- `makeBlockNodeWhenMenuTypeSelect()`: 메뉴 선택 시 실제 블록 노드로 바꿉니다.

주요 생성 흐름은 다음과 같습니다.

```text
빈 위치에 메뉴 노드 생성
-> 메뉴에서 blockType 선택
-> 같은 id/position을 가진 block 노드로 교체
-> initialEditing: true로 바로 편집 모드 진입
```

## 3. 전역 캔버스 상태

상태의 중심은 `src/diagram/model/canvasStore.ts`의 `useCanvasStore`입니다.

이 store는 앱의 명령 API 역할을 합니다.

- `addMenuNode()`: 새 메뉴 노드 추가
- `selectMenuType()`: 메뉴 노드를 블록 노드로 변환
- `updateBlockData()`: 블록 편집 결과 저장
- `connectEdge()` / `removeEdge()`: 연결선 추가/삭제
- `commitNodePosition()`: 드래그 종료 후 스냅된 위치 확정
- `serializeDocument()` / `loadDocument()`: 저장/복원

`zustand`의 `persist` middleware를 사용하며, `localStorage`의 `"canvas-store"`에 `nodes`, `edges`만 저장합니다. `mode`, `dirty`, `saveStatus` 같은 값은 문서 데이터라기보다 런타임 UI 상태에 가깝습니다.

## 4. 메인 화면 오케스트레이터

실제 화면의 중심은 `src/diagram/ui/CanvasCore/index.tsx`입니다.

이 컴포넌트의 책임은 다음과 같습니다.

```text
store에서 nodes/edges/mode 읽기
-> grid occupancy 계산
-> node hook, edge hook, zoom hook 연결
-> ReactFlow에 nodes/edges/event handlers 주입
-> overlay 렌더링
```

특히 다음 부분을 먼저 보면 전체 흐름이 잡힙니다.

- store 상태 구독: `CanvasCoreInner`
- 현재 그리드 점유 상태 계산: `getGridOccupancy(nodes)`
- 노드 드래그/도킹 hook: `useCanvasNodes`
- 엣지 연결/드롭 hook: `useCanvasEdges`
- 줌 hook: `useCanvasZoom`

`CanvasCore` 자체는 비즈니스 로직을 깊게 갖지 않고, React Flow 이벤트를 hook과 순수 함수로 넘기는 역할에 가깝습니다.

## 5. 그리드와 줌

캔버스의 논리 grid는 `src/diagram/lib/grid.ts`에 정의된 30×15 cells이며,
cell 하나는 106px입니다. grid 크기는 고정이고, 화면에 보이는 크기만 줌에 따라 달라집니다.

줌은 React Flow 내장 zoom을 직접 조작하지 않습니다. `useCanvasZoom()`이 viewport에 보이는
column 수를 관리하고 `gridZoom`과 렌더링 크기를 파생합니다.

```text
사용자 입력
-> visible cell count 변경
-> gridZoom 계산
-> canvas wrapper와 React Flow viewport 크기 반영
-> anchor 기준 scroll offset 복원
```

수동 줌 전에는 container 폭에 맞는 반응형 visible cell count를 사용합니다. 버튼은 viewport
중앙을 기준으로 2 cells씩, `Ctrl/Cmd + wheel`은 pointer를 기준으로 1 cell씩 변경합니다.
일반 wheel은 native scroll로 남습니다. Reset은 절대 100%가 아니라 수동 설정을 제거하고
현재 폭의 반응형 기본값으로 돌아갑니다.

줌 직전 `useCanvasZoom`은 anchor 아래의 flow 좌표와 viewport 내부 위치를 저장합니다. 배율이
바뀐 뒤 `useLayoutEffect`에서 scroll offset을 grid cell 경계에 맞춰 복원하므로 중앙이나 pointer
아래에서 보고 있던 canvas 위치가 유지됩니다. 메뉴의 퍼센트는 raw 배율이 아니라 현재 viewport의
최소·최대 조작 범위를 0~100%로 정규화한 값입니다.

책임 경계는 다음과 같습니다.

- `lib/hooks/useCanvasZoom.ts`: DOM ref, width 관찰, 수동 visible cells, wheel listener, anchor와 scroll 복원
- `lib/zoom.ts`: visible cell 범위, 배율, step, modifier 판정, cell-aligned offset 순수 계산
- `ui/CanvasCore/index.tsx`: hook 결과를 wrapper 크기, React Flow viewport와 grid guide에 연결
- `ui/Menu/index.tsx`: zoom in/out/reset 명령과 정규화된 퍼센트 표시

React Flow의 pan과 scroll/pinch/double-click zoom은 비활성화되어 있습니다. 자세한 불변 조건과
테스트 계약은 `docs/diagram-zoom.md`를 참고합니다.

## 6. 노드 드래그와 도킹

노드 드래그 흐름은 `src/diagram/hooks/useCanvasNodes.ts`에서 시작합니다.

드래그 중에는 React Flow의 node position을 그대로 사용하고, 드래그가 끝나는 순간에만 도킹 규칙을 적용합니다.

```text
onNodeDragStop
-> getNodeSpan(blockType)
-> resolveDropPosition()
-> commitNodePosition()
-> runtime docking state 갱신
```

도킹 계산 자체는 `src/diagram/lib/docking.ts`에 있습니다.

`resolveDropPosition()`의 판단 순서는 다음과 같습니다.

```text
1. 그리드 밖인가?
2. 가장 가까운 anchor cell을 찾을 수 있는가?
3. 해당 cell/span이 비어 있는가?
4. 실패하면 lastValidDock 또는 nearestEmptyCell로 fallback
```

그리드 좌표 변환은 `src/diagram/lib/grid.ts`가 담당합니다. 여기서 `XYPosition` 픽셀 좌표와 `CellCoord` 그리드 좌표가 서로 변환됩니다.

## 7. 엣지 연결

엣지는 `src/diagram/hooks/useCanvasEdges.ts`를 보면 됩니다.

일반 연결은 단순합니다.

```text
onConnect -> connectEdge()
```

빈 공간에 엣지를 드롭했을 때는 새 메뉴 노드가 만들어집니다.

```text
onConnectEnd
-> 드롭 위치를 flow position으로 변환
-> resolveEdgeDropPosition()
-> addMenuNode()
-> connectEdge(source -> 새 menu node)
```

즉, 사용자가 어떤 노드에서 선을 끌어 빈 공간에 놓으면 그 자리에 새 메뉴 노드가 생기고 기존 노드와 연결됩니다.

좌표와 핸들 계산은 `src/diagram/lib/edge.ts`에 분리되어 있습니다.

## 8. 블록 UI와 편집

블록 렌더링은 `src/diagram/ui/CanvasCore/BlockNode.tsx`가 담당합니다.

이 컴포넌트는 두 모드로 나뉩니다.

```text
읽기 모드: BlockView
편집 모드: BlockEditForm
```

읽기 UI는 `BlockView()`의 `switch (data.blockType)`에서 타입별로 갈라집니다.

편집 UI는 `src/diagram/ui/CanvasCore/BlockEditForm.tsx`에서 갈라집니다.

- `text`, `image`, `link`: 직접 입력 폼
- `music`, `game`, `movie`, `book`: 검색 폼

검색형 블록은 `src/diagram/ui/CanvasCore/SearchBlockForm.tsx`에서 TanStack Query를 사용합니다. 실제 요청은 `src/diagram/api/searchApi.ts`, 쿼리 옵션은 `src/diagram/api/searchQueries.ts`에 있습니다.

## 9. 추천 읽기 순서

처음 코드를 읽는다면 다음 순서를 추천합니다.

1. `src/diagram/model/blockTypes.ts`
   - 데이터가 무엇인지 확인합니다.
2. `src/diagram/model/canvasStore.ts`
   - 사용자 행동이 어떤 상태 변경으로 이어지는지 확인합니다.
3. `src/diagram/ui/CanvasCore/index.tsx`
   - React Flow에 무엇을 연결하는지 확인합니다.
4. `src/diagram/hooks/useCanvasZoom.ts`
   - visible cell 기반 zoom과 anchor scroll 복원을 확인합니다.
5. `src/diagram/lib/zoom.ts`
   - zoom의 순수 계산과 범위 제한을 확인합니다.
6. `src/diagram/hooks/useCanvasNodes.ts`
   - 노드 드래그 종료 이벤트가 어떻게 처리되는지 확인합니다.
7. `src/diagram/lib/docking.ts`
   - 도킹 성공/실패/fallback 규칙을 확인합니다.
8. `src/diagram/hooks/useCanvasEdges.ts`
   - 연결선 생성과 빈 공간 드롭 동작을 확인합니다.
9. `src/diagram/ui/CanvasCore/BlockNode.tsx`
   - 블록이 어떻게 보이고 편집 모드로 전환되는지 확인합니다.
10. `src/diagram/ui/CanvasCore/BlockEditForm.tsx`

- 타입별 편집 폼이 어떻게 연결되는지 확인합니다.

## 10. 학습 관점에서 볼 질문

코드를 읽을 때 다음 질문을 스스로 던지면 구조를 더 빨리 이해할 수 있습니다.

- 이 데이터는 저장 가능한 데이터인가, 런타임 전용 상태인가?
- 이 함수는 React 컴포넌트 상태를 바꾸는가, 아니면 순수 계산만 하는가?
- React Flow 이벤트는 어느 hook에서 store action으로 변환되는가?
- 노드 위치는 드래그 중과 드래그 종료 후에 각각 누가 source of truth인가?
- 줌에서 저장하는 상태와 container 폭에서 파생하는 값은 각각 무엇인가?
- 줌 전 anchor 캡처와 줌 후 layout effect가 어떤 좌표를 보존하는가?
- 새 블록 타입을 추가한다면 model, store, UI, span, search API 중 어디를 고쳐야 하는가?
