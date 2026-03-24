# 계획: 서브셀 그리드 + 가변 스팬 노드

## Context

현재 모든 노드는 216×216px 정사각형(1 grid cell)으로 고정되어 있다.
`movie | book | game` 노드는 세로형 포스터/커버 아트에 어울리는 **1×2 세로 직사각형** (108×216px)으로 바꾸고 싶다.
이를 지원하려면 기존 1 cell을 2×2 sub-cell로 세분화해야 한다.

결과:
- 정사각형 노드 (text, image, link, music): 2×2 sub-cells = 216×216px (동일)
- 세로 직사각형 노드 (movie, book, game): 1×2 sub-cells = 108×216px

---

## 핵심 상수 변화

| 항목 | 변경 전 | 변경 후 |
|---|---|---|
| 원자 그리드 단위 | `NODE_SIZE = 216` | `CELL_SIZE = NODE_SIZE / 2 = 108` |
| GRID_STAGES | `[4, 7, 10]` | `[8, 14, 20]` (같은 픽셀 크기, 2× 세분화) |
| 정사각형 노드 스팬 | 1×1 cell | 2×2 sub-cells |
| 직사각형 노드 스팬 | - | 1×2 sub-cells |

`GRID_STAGES` 배가: 4×4 → 8×8 sub-cells (픽셀 캔버스 동일, `4 × 216 = 8 × 108 = 860px`)


---

## 구현 단계

### Step 1 — 타입 추가 (`lib/type.ts`)

```typescript
export type NodeSpan = { cols: number; rows: number };
```

`DockingInput`에 `span: NodeSpan` 필드 추가:
```typescript
export type DockingInput = {
  position: XYPosition;
  stage: GridStage;
  occupancy: GridOccupancy;
  span: NodeSpan;          // ← 추가
  ignoreNodeId?: string;
  lastValidDock: CellCoord | null;
};
```

---

### Step 2 — 스팬 유틸리티 (`model/type.ts`)

```typescript
export const WIDE_SPAN: NodeSpan = { cols: 2, rows: 2 };
export const TALL_SPAN: NodeSpan = { cols: 1, rows: 2 };

export function getNodeSpan(blockType: BlockType | "menu"): NodeSpan {
  switch (blockType) {
    case "movie":
    case "book":
    case "game":
      return TALL_SPAN;
    default:
      return WIDE_SPAN;
  }
}
```

---

### Step 3 — 그리드 상수 + 함수 (`lib/grid.ts`)

**상수:**
```typescript
export const CELL_SIZE = NODE_SIZE / 2; // 108
export const GRID_STAGES = [8, 14, 20] as const;
```

**변경 함수:**

| 함수 | 변경 내용 |
|---|---|
| `getStagePixelSize` | `stage * CELL_SIZE` |
| `positionToNearestCellCoord` | `CELL_SIZE` 기준으로 계산, `span` 인자 추가(center bias 계산용) |
| `cellCoordToPosition` | `col * CELL_SIZE, row * CELL_SIZE` |
| `isNodeCenterOutsideStage` | `span` 인자 추가 → center = `pos + (span.cols/2 * CELL_SIZE, span.rows/2 * CELL_SIZE)` |
| `clampPositionToStage` | `span` 인자 추가 → `max_x = (stage-span.cols)*CELL_SIZE`, `max_y = (stage-span.rows)*CELL_SIZE` |
| `isCellCoordInsideMaxGrid` | 변경 없음 (MAX_GRID_STAGE가 20으로 자동 변경됨) |

**신규 함수:**
```typescript
// 앵커 셀 기준으로 노드가 점유하는 모든 sub-cell 목록 반환
export function getNodeCells(anchor: CellCoord, span: NodeSpan): CellCoord[]
```

**`getGridOccupancy` 내부 변경** (시그니처 동일 유지):
- 각 노드의 blockType → `getNodeSpan()` → `getNodeCells(anchor, span)`으로 모든 점유 셀 등록
- `cellToNodeId`에 각 sub-cell마다 nodeId 등록

---

### Step 4 — 도킹 로직 (`lib/docking.ts`)

**신규 함수:**
```typescript
// anchor에 span을 전개했을 때 모든 셀이 도킹 가능한지 검사
export function isDockableForSpan(
  anchor: CellCoord,
  span: NodeSpan,
  occupancy: GridOccupancy,
  stage: GridStage,
  ignoreNodeId?: string,
): boolean
```

**변경 함수:**

| 함수 | 변경 내용 |
|---|---|
| `isDockableCell` | 변경 없음 (단일 셀 검사 — `isDockableForSpan`의 내부에서 사용) |
| `getNearestEmptyCell` | 후보 앵커마다 `isDockableForSpan` 사용 |
| `resolveDropPosition` | `input.span` 사용해 `isDockableForSpan` 호출 |
| `applyFallback` | 자동 반영 (DockingInput에 span 포함) |
| `createDockedNodeState` | `span` 인자 추가 → `positionToNearestCellCoord(position, stage, span)` |

---

### Step 5 — UI (`ui/CanvasCore/BlockNode.tsx`)

```tsx
import { CELL_SIZE } from "../../lib/grid";
import { getNodeSpan } from "../../model/type";

// BlockNode 내부
const span = getNodeSpan(data.blockType);
<div
  style={{ width: span.cols * CELL_SIZE, height: span.rows * CELL_SIZE }}
  ...
>
```

---

### Step 6 — 오케스트레이터 (`ui/CanvasCore/CanvasCoreInner.tsx`)

변경 위치:
1. `handleNodeDrag` → `isNodeCenterOutsideStage(node.position, stage, getNodeSpan(blockType))`
   - `node.data`에서 blockType 추출 (타입 가드 필요)
2. `handleNodeDragStop` → `resolveDropPosition({ ..., span: getNodeSpan(blockType) })`
3. `handleAddNode` 초기 위치 → `clampPositionToStage(pos, stage, span)`

---

### Step 7 — 테스트 업데이트

**`lib/__tests__/grid.test.ts`:**
- `CELL_SIZE`, `GRID_STAGES` 상수 검증 업데이트
- `getNodeCells` 유닛 테스트 추가
- `getGridOccupancy`: 2×2 노드 → 4 sub-cells 등록 검증
- `getGridOccupancy`: 1×2 노드 → 2 sub-cells 등록 검증
- 충돌: 두 노드의 sub-cell이 겹칠 때 `conflictedCellKeys` 검증

**`lib/__tests__/docking.test.ts`:**
- `isDockableForSpan` 유닛 테스트
- `resolveDropPosition`: 2×2 / 1×2 노드 스팬 점유 검증
- fallback: 스팬 충돌 시 `nearest-empty-cell` 탐색 검증

---

## 수정 대상 파일

| 파일 | 변경 유형 |
|---|---|
| `src/features/diagram/lib/type.ts` | `NodeSpan` 타입, `DockingInput.span` 추가 |
| `src/features/diagram/lib/grid.ts` | `CELL_SIZE`, `GRID_STAGES`, 그리드 함수 전면 수정 |
| `src/features/diagram/lib/docking.ts` | `isDockableForSpan` 추가, 기존 함수 span 적용 |
| `src/features/diagram/model/type.ts` | `getNodeSpan()`, `WIDE_SPAN`, `TALL_SPAN` 추가 |
| `src/features/diagram/ui/CanvasCore/BlockNode.tsx` | 동적 width/height |
| `src/features/diagram/ui/CanvasCore/CanvasCoreInner.tsx` | span 전달, blockType 타입 가드 |
| `src/features/diagram/lib/__tests__/grid.test.ts` | 상수 + 신규 케이스 |
| `src/features/diagram/lib/__tests__/docking.test.ts` | span 인자 + 신규 케이스 |

---

## 검증

```bash
pnpm test              # 유닛 테스트 통과
pnpm lint              # Biome 린트 통과
pnpm build             # TypeScript 컴파일 에러 없음
```

런타임 확인:
1. 정사각형 노드(text/image/link/music)가 216×216px로 그리드에 스냅됨
2. movie/book/game 노드가 ~108×216px 세로 직사각형으로 렌더링됨
3. 두 1×2 노드가 같은 열, 인접 행에 나란히 도킹 가능
4. 2×2 노드와 1×2 노드가 겹치지 않고 도킹
5. 스테이지 확장(8→14→20 sub-cells)이 기존과 동일하게 작동
