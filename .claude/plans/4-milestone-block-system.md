# M4 Block System 구현 계획

## Context

M3(데이터 모델 & 도메인 규칙)가 완료되어 `BlockData` 판별 유니온, `validateBlockData()`,
`CanvasDocument` 직렬화 기반이 확립됐다. M4는 그 위에 실제 사용자 인터랙션 계층을 얹는 단계다:
메뉴 노드에서 블록 타입을 선택하고, 타입별 인라인 편집 UX를 완성하는 것이 목표.

현재 UI는 `"square"` 노드 타입 하나만 있고, 편집 UI·메뉴 노드·React Hook Form이 전혀 없다.

---

## 목표 및 범위

### In Scope

- `block.ts`: `music | game | movie | book` 타입 확장 (검색 기반 공통 필드 포함)
- React Flow node type 분리: `"menu"` 노드 추가, 기존 `"square"` → `"block"` 리네임
- 메뉴 노드 UI (`MenuNode`): 블록 타입 7종 인라인 선택
- 블록 노드 UI (`BlockNode`): 타입별 편집 폼
- 직접 입력 3종: `text` (textarea), `image` (drag-drop + URL), `link` (URL + OpenGraph 자동 채움)
- 검색 기반 4종 UI 뼈대: `music | game | movie | book` (검색 입력 → 결과 선택 → 표준 필드 반영)
- 편집 중 도킹 인터랙션 비활성화 (`isEditing` 플래그)
- 시각 상태: 선택·호버·편집 중·도킹 가능/불가 스타일 분리

### Out of Scope

- 실제 외부 API 연동 (M5)
- 저장/복원 (M6)
- E2E 테스트 (M7)

---

## 구현 단계

### Step 1. 블록 타입 확장 (`model/block.ts`)

검색 기반 4종 타입 추가:

```ts
type MusicBlockData  = BlockBase & { blockType: "music";  artist: string; albumArt?: string }
type GameBlockData   = BlockBase & { blockType: "game";   coverUrl?: string; releaseYear?: number }
type MovieBlockData  = BlockBase & { blockType: "movie";  posterUrl?: string; releaseYear?: number }
type BookBlockData   = BlockBase & { blockType: "book";   author: string; coverUrl?: string }

export type BlockData = TextBlockData | ImageBlockData | LinkBlockData
                      | MusicBlockData | GameBlockData | MovieBlockData | BookBlockData
```

- `BLOCK_TYPES`, `BlockType`, `validateBlockData()`, `createDefaultBlockData()` 동기화
- 기존 테스트 통과 유지 + 신규 타입 fallback 케이스 테스트 추가

### Step 2. Node Type 분리 및 등록

- `CanvasCoreInner.tsx`의 `nodeTypes` 재정의:
  - `"menu"` → `MenuNode` (새 컴포넌트)
  - `"block"` → `BlockNode` (기존 `SquareNode` 대체)
- `DiagramNode` type 필드: `"menu" | "block"` (현재 `"square"` 제거)
- `runtime.ts` 초기 노드: `type: "menu"` 또는 빈 캔버스로 변경

### Step 3. MenuNode 컴포넌트

**파일:** `ui/CanvasCore/MenuNode.tsx`

- 168×168px 컨테이너, 타입 목록 인라인 표시 (7종 아이콘 + 레이블)
- 타입 클릭 시 `onTypeSelect(blockType)` 콜백 호출 (React Flow `data` prop 경유)
- `CanvasCoreInner`에서 처리: 해당 위치에 `"block"` 노드 생성 + `"menu"` 노드 제거
- 메뉴 노드는 `BlockData`에 포함하지 않음 — `data: { type: "menu" }` 별도 `MenuNodeData`

### Step 4. BlockNode 컴포넌트

**파일:** `ui/CanvasCore/BlockNode.tsx`

- `data: BlockData`를 받아 `blockType`에 따라 폼 분기
- React Hook Form 사용, 즉시 반영 (`onChange` 시 `updateNodeData` 호출)
- 편집 시작: 클릭 → `isEditing: true` 로컬 상태 → `onEditStart(nodeId)` 콜백
- 편집 종료: 블러/포커스 아웃 → `onEditEnd(nodeId)` 콜백
- `CanvasCoreInner`에서 `editingNodeId` 상태로 편집 중 노드 추적

#### 폼 세부 구현

**TextBlock 폼:**
- textarea 인라인 (자동 높이 조절)
- `text` 필드 `onChange` → `setNodes` 업데이트

**ImageBlock 폼:**
- 드래그앤드롭 영역 + `<input type="url">` 병렬 제공
- `imageUrl` 확정 시 `alt` 자동 채움 (파일명 기반)

**LinkBlock 폼:**
- `<input type="url">` → 포커스 아웃 시 OpenGraph fetch (M4에서 stub만, 실 fetch는 M5)
- `title`, `description` 각 필드 직접 수정 가능

**검색 기반 폼 (music, game, movie, book) — 뼈대:**
- 검색창 + 결과 목록 영역 (상태: `empty | searching | filled`)
- API 없이 mock 데이터로 동작 확인, M5에서 실 연동

### Step 5. CanvasCoreInner 연동

- `handleMenuTypeSelect(menuNodeId, blockType)`:
  1. 해당 메뉴 노드의 `position` 조회
  2. `createDefaultBlockData(blockType, ...)` 생성
  3. `"block"` 타입 노드 추가
  4. `"menu"` 노드 제거
  5. 새 노드 즉시 편집 상태 진입
- `editingNodeId` 상태 추가
- `onNodeDragStart` 가드: `editingNodeId !== null`이면 드래그 이벤트 무시

### Step 6. 시각 상태 스타일

| 상태 | 적용 조건 | 스타일 |
|---|---|---|
| 기본 | - | 현재 `bg-green border-gray-700` |
| 호버 | `hover:` | 테두리 강조 |
| 선택 | React Flow `selected` prop | 링 또는 그림자 |
| 편집 중 | `editingNodeId === node.id` | 배경색 구분, 도킹 핸들 숨김 |
| 도킹 가능 | 드래그 중 nearest cell 유효 | 프리뷰 셀 하이라이트 |
| 도킹 불가 | 드래그 중 nearest cell 점유 | 붉은 색조 |

---

## 수정 파일 목록

| 파일 | 변경 유형 |
|---|---|
| `src/features/diagram/model/block.ts` | 4종 타입 추가, BLOCK_TYPES 확장 |
| `src/features/diagram/model/runtime.ts` | 초기 노드 type 변경 |
| `src/features/diagram/lib/type.ts` | DiagramNode type 필드 업데이트 |
| `src/features/diagram/ui/CanvasCore/CanvasCoreInner.tsx` | nodeTypes 등록, 핸들러 추가 |
| `src/features/diagram/ui/CanvasCore/MenuNode.tsx` | **신규** |
| `src/features/diagram/ui/CanvasCore/BlockNode.tsx` | **신규** (SquareNode 대체) |
| `src/features/diagram/ui/CanvasCore/SquareNode.tsx` | 제거 또는 BlockNode로 대체 |
| `src/features/diagram/model/__tests__/block.test.ts` | 신규 타입 테스트 추가 |

---

## 검증 체크리스트

- [ ] `BLOCK_TYPES` 7종 전부 `createDefaultBlockData()` 호출 가능
- [ ] 메뉴 노드 클릭 → 타입 선택 → 블록 노드 생성 + 메뉴 노드 제거
- [ ] 블록 노드 생성 즉시 편집 상태 진입
- [ ] text 블록: 클릭 → textarea 편집 → 즉시 반영
- [ ] image 블록: URL 입력 → imageUrl 반영
- [ ] link 블록: URL 입력 → 필드 반영 (OpenGraph stub)
- [ ] 편집 중 노드 드래그 비활성화
- [ ] `pnpm lint` 오류 없음
- [ ] `pnpm build` 타입 오류 없음
- [ ] `pnpm test` 기존 테스트 전부 통과
