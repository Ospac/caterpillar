# Diagram Zoom

## 개요

diagram canvas의 zoom은 React Flow 내장 zoom이 아니라, 화면에 표시할 grid
column 수를 변경하는 방식으로 동작한다.

```text
사용자 입력
  -> visible cell count 변경
  -> gridZoom 계산
  -> canvas 렌더링 크기 변경
  -> 기준점에 맞춰 scroll offset 복원
```

`gridZoom`은 상태로 저장하지 않는 파생값이다. 수동 조작이 없으면 container
폭에 맞는 반응형 cell count를 사용하고, 사용자가 zoom을 조작한 뒤에는 수동 cell
count를 사용한다.

## 코드 책임

### `lib/hooks/useCanvasZoom.ts`

zoom 상태와 브라우저 부수효과를 소유하는 hook이다.

관리하는 항목:

- scroll container DOM ref
- container width
- 수동 visible cell count
- zoom 중 grid guide 표시 상태
- wheel listener와 `ResizeObserver`
- zoom 전 anchor 캡처
- zoom 후 scroll offset 복원

반환값:

```ts
{
	scrollContainerRef,
	gridZoom,
	minGridZoom,
	maxGridZoom,
	renderedGridSize,
	isZooming,
	zoomIn,
	zoomOut,
	resetZoom,
}
```

`CanvasCore` 외부에 raw visible cell count나 anchor ref를 노출하지 않는다. UI는
계산 결과와 명령형 handler만 사용한다.

### `lib/zoom.ts`

zoom에 필요한 순수 계산을 담당한다.

- `getVisibleCellCountBounds`: 현재 폭에서 허용할 visible cell 범위
- `getClampedVisibleCellCount`: 요청한 cell count를 허용 범위로 제한
- `getResponsiveGridVisibleCellCount`: 수동 zoom이 없을 때의 기본값
- `getGridZoomForVisibleCells`: visible cell count를 실제 배율로 변환
- `getNextGridVisibleCellCount`: 버튼 입력의 다음 cell count 계산
- `getWheelGridVisibleCellCount`: wheel 방향을 1셀 증감으로 변환
- `isGridZoomWheelEvent`: `Ctrl/Cmd + wheel`만 zoom으로 분류
- `getCellAlignedAnchoredScrollOffset`: anchor를 보존하면서 cell 경계에 scroll 정렬

배율을 다시 visible cell count로 변환하는 구 API와 중앙 전용 scroll 계산 함수는
제거했다. zoom 흐름은 visible cell count 기반 API만 사용한다.

### `ui/CanvasCore/index.tsx`

zoom 계산을 직접 수행하지 않는다. `useCanvasZoom` 반환값을 다음 위치에 연결한다.

- scroll container의 `ref`
- Menu의 zoom 표시 범위와 버튼 handler
- canvas wrapper의 width와 height
- React Flow의 viewport, `minZoom`, `maxZoom`
- zoom 중 `GridGuideOverlay` 표시 조건

React Flow 내장 zoom과 pan은 계속 비활성화되어 있다.

## 입력별 동작

### 버튼

`zoomIn`과 `zoomOut`은 한 번에 visible column을 2셀씩 변경한다.

버튼 zoom은 viewport 중앙을 anchor로 사용한다. 확대 또는 축소 후에도 사용자가
보던 중앙 영역이 유지되도록 `scrollLeft`와 `scrollTop`을 보정한다.

### Wheel

일반 wheel은 scroll container의 기본 스크롤로 남긴다. `Ctrl` 또는 `Cmd`가 함께
입력된 wheel만 zoom으로 처리하고 기본 동작을 막는다.

wheel zoom은 한 번에 visible column을 1셀씩 변경한다. 이벤트의 client 좌표를
container 내부 좌표로 변환해 anchor로 저장하므로, 확대 또는 축소 후에도 마우스
아래의 canvas 위치가 유지된다.

### Reset

Reset은 절대 배율 `100%`로 이동하는 기능이 아니다.

수동 visible cell count를 제거하고 현재 container width에 맞는 반응형 기본값으로
돌아간다. 실제 배율이 바뀌는 경우 viewport 중앙을 anchor로 scroll을 보정한다.

## Anchor와 Scroll 복원

zoom 직전에 다음 값을 저장한다.

```ts
interface ZoomAnchor {
	flowX: number;
	flowY: number;
	anchorX: number;
	anchorY: number;
}
```

- `flowX`, `flowY`: zoom 전 anchor 아래의 canvas 논리 좌표
- `anchorX`, `anchorY`: viewport 내부에서 해당 좌표가 유지될 위치

상태 변경으로 `gridZoom`이 다시 계산되면 `useLayoutEffect`가 anchor를 소비한다.
paint 전에 scroll을 복원하므로 중간 프레임에서 canvas가 튀는 현상을 방지한다.

가로는 `GRID_COLUMN_COUNT`, 세로는 `GRID_ROW_COUNT`를 경계로 사용한다. 계산된
offset은 grid 범위로 제한한 뒤 렌더링된 cell 크기 단위로 정렬한다.

## 표시 배율

Menu의 퍼센트는 raw `gridZoom * 100`이 아니다.

현재 container에서 조작 가능한 최소 배율을 `0%`, 최대 배율을 `100%`로 정규화한
상대값이다. 따라서 viewport 폭이 달라지면 같은 raw zoom도 다른 퍼센트로 표시될
수 있다.

## 테스트 계약

`useCanvasZoom.test.tsx`:

- 버튼이 visible column을 2셀씩 변경
- wheel이 visible column을 1셀씩 변경
- wheel zoom이 포인터 anchor 기준으로 scroll 복원
- modifier 없는 wheel은 zoom하지 않음
- Reset이 반응형 기본값으로 복귀
- 최대 zoom 이후 추가 변경 없음
- timer, wheel listener, `ResizeObserver` 정리

`lib/__tests__/zoom.test.ts`:

- visible cell 범위와 clamp
- visible cell count와 배율 변환
- 버튼과 wheel step
- modifier wheel 판정
- cell-aligned anchored scroll 계산

`Menu/Menu.test.tsx`:

- zoom 버튼 callback
- 최소/최대에서 버튼 비활성화
- 표시 퍼센트 정규화

## 변경 시 지켜야 할 규칙

- `gridZoom`을 별도 상태로 추가하지 않는다.
- 버튼과 wheel의 다음 단계는 visible cell count로 계산한다.
- wheel anchor는 event client 좌표를 container 기준으로 변환한다.
- scroll 복원은 zoom 상태 변경 전 anchor 캡처, 변경 후 layout effect 순서를 지킨다.
- `passive: false` wheel listener를 유지해 zoom gesture에서 `preventDefault()`가
  동작하게 한다.
- React Flow 내장 zoom을 함께 활성화하지 않는다.
