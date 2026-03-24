# M4 Block System 구현 계획

## Context

M3(데이터 모델 & 도메인 규칙)가 완료되어 `BlockData` 판별 유니온, `validateBlockData()`,
`CanvasDocument` 직렬화 기반이 확립됐다. M4는 그 위에 실제 사용자 인터랙션 계층을 얹는 단계다:
메뉴 노드에서 블록 타입을 선택하고, 타입별 인라인 편집 UX를 완성하는 것이 목표.

**진행 상황:** Step 1~3, Step 5 일부 완료. Step 4(BlockNode 편집), Step 5 나머지(editingNodeId), Step 6(시각 상태) 미완.

---

## 목표 및 범위

### In Scope

- `block.ts`: `music | game | movie | book` 타입 확장 (검색 기반 공통 필드 포함) ✅
- React Flow node type 분리: `"menu"` 노드 추가, 기존 `"square"` → `"block"` 리네임 ✅
- 메뉴 노드 UI (`MenuNode`): 블록 타입 7종 인라인 선택 ✅
- 블록 노드 UI (`BlockNode`): 타입별 편집 폼 (렌더 일부 완료, 편집 미구현)
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

### Step 1. 블록 타입 확장 (`model/block.ts`) ✅ 완료

검색 기반 4종 타입 추가:

```ts
type MusicBlockData  = BlockBase & { blockType: "music";  artist: string; albumArt?: string }
type GameBlockData   = BlockBase & { blockType: "game";   coverUrl?: string; releaseYear?: number }
type MovieBlockData  = BlockBase & { blockType: "movie";  posterUrl?: string; releaseYear?: number }
type BookBlockData   = BlockBase & { blockType: "book";   author: string; coverUrl?: string }

export type BlockData = TextBlockData | ImageBlockData | LinkBlockData
                      | MusicBlockData | GameBlockData | MovieBlockData | BookBlockData
```

- `BLOCK_TYPES`, `BlockType`, `validateBlockData()`, `createDefaultBlockData()` 동기화 완료
- 기존 테스트 통과 + 신규 타입 fallback 케이스 테스트 완료 (`block.test.ts` 16개 케이스)

### Step 2. Node Type 분리 및 등록 ✅ 완료

- `CanvasCoreInner.tsx`의 `nodeTypes`: `"menu"` → `MenuNode`, `"block"` → `BlockNode` 등록 완료
- `DiagramNode` type 필드: `"menu" | "block"` (`"square"` 제거 완료)
- `runtime.ts` 초기 노드: 빈 캔버스로 변경 완료
- `SquareNode.tsx` 제거 완료

### Step 3. MenuNode 컴포넌트 ✅ 완료

**파일:** `ui/CanvasCore/MenuNode.tsx`

- NODE_SIZE(216px) 기반 컨테이너, 7종 버튼 인라인 표시 (타입별 배경색)
- 타입 클릭 시 `data.onTypeSelect?.(blockType)` 콜백 호출
- `CanvasCoreInner`에서 처리: 해당 위치에 `"block"` 노드 생성 + `"menu"` 노드 제거 완료
- 메뉴 노드는 `BlockData`에 포함하지 않음 — 별도 `MenuNodeData`

### Step 4. BlockNode 컴포넌트 🔲 진행 중

**파일:** `ui/CanvasCore/BlockNode.tsx`

현재 상태: 렌더 전용(표시만), 편집 기능 없음.
- text, image, link, music: 렌더 레이아웃 구현 완료
- **game, movie, book: 렌더 미구현** (현재 blockType 텍스트 fallback만 표시)

구현 필요:
- `data: BlockData`를 받아 `blockType`에 따라 **편집 폼** 분기
- **React Hook Form** (`useForm<BlockData>`) 사용:
  - `defaultValues`: `data` prop으로 초기화
  - `Controller`의 `onChange`에서 직접 `data.onDataChange?.(newData)` 콜백 호출 (`watch` + `useEffect` 불필요)
  - `register` / `Controller`로 각 필드 등록
- 편집 시작: 클릭 → `isEditing: true` 로컬 상태 → `onEditStart(nodeId)` 콜백
- 편집 종료: 블러/포커스 아웃 → `onEditEnd(nodeId)` 콜백
- `CanvasCoreInner`에서 `editingNodeId` 상태로 편집 중 노드 추적

#### 폼 세부 구현

**TextBlock 폼:**
- `<Controller name="text">` → `<textarea>` onChange 시 `onDataChange({ ...data, text })` 호출

**ImageBlock 폼:**
- 드래그앤드롭 영역 + `<Controller name="imageUrl">` (`<input type="url">`)
- `imageUrl` 확정 시 `setValue("alt", 파일명)` + `onDataChange` 호출; figcaption 수정 시 동일
- 각 필드 `onChange`에서 직접 `onDataChange` 호출

**LinkBlock 폼:**
- `<Controller name="url">` → 붙여넣기/포커스 아웃 시 OpenGraph fetch stub → `setValue("title", ...)`, `setValue("description", ...)` 후 `onDataChange` 호출 (실 fetch는 M5)
- `title`, `description` 각 필드 `onChange`에서 `onDataChange` 호출

**검색 기반 폼 (music, game, movie, book) — 뼈대:**
- 검색창 + 결과 목록 영역 (로컬 상태: `empty | searching | filled`)
- 결과 선택 시 `setValue`로 공통 필드(`title`, `coverUrl` 등) 일괄 반영 후 `onDataChange` 호출
- API 없이 mock 데이터로 동작 확인, M5에서 실 연동

**`onDataChange` 연결 (`CanvasCoreInner`):**
```ts
const handleBlockDataChange = (nodeId: string, newData: BlockData) => {
  setNodes((curr) => curr.map((n) => n.id === nodeId ? { ...n, data: newData } : n));
};
// BlockNodeData에 onDataChange 콜백 포함, MenuNode의 onTypeSelect 패턴과 동일
```

### Step 5. CanvasCoreInner 연동 🔲 일부 완료

완료:
- `handleMenuTypeSelect(menuNodeId, blockType)`: 메뉴 노드 → 블록 노드 변환 완료
  1. 해당 메뉴 노드의 `position` 조회
  2. `createDefaultBlockData(blockType, ...)` 생성
  3. `"block"` 타입 노드 추가
  4. `"menu"` 노드 제거

미구현:
- 새 노드 즉시 편집 상태 진입 (step 5 완료 후 연동)
- `editingNodeId` 상태 추가
- `onNodeDragStart` 가드: `editingNodeId !== null`이면 드래그 이벤트 무시

### Step 6. 시각 상태 스타일 🔲 미구현

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

| 파일 | 변경 유형 | 상태 |
|---|---|---|
| `src/features/diagram/model/block.ts` | 4종 타입 추가, BLOCK_TYPES 확장 | ✅ 완료 |
| `src/features/diagram/model/runtime.ts` | 초기 노드 type 변경 | ✅ 완료 |
| `src/features/diagram/lib/type.ts` | DiagramNode type 필드 업데이트 | ✅ 완료 |
| `src/features/diagram/ui/CanvasCore/CanvasCoreInner.tsx` | nodeTypes 등록, 핸들러 추가 | 🔲 편집 연동 미완 |
| `src/features/diagram/ui/CanvasCore/MenuNode.tsx` | 신규 | ✅ 완료 |
| `src/features/diagram/ui/CanvasCore/BlockNode.tsx` | 신규 (SquareNode 대체) | 🔲 편집 폼 미완 |
| `src/features/diagram/ui/CanvasCore/SquareNode.tsx` | 제거 | ✅ 완료 |
| `src/features/diagram/model/__tests__/block.test.ts` | 신규 타입 테스트 추가 | ✅ 완료 |

---

## 검증 체크리스트

- [x] `BLOCK_TYPES` 7종 전부 `createDefaultBlockData()` 호출 가능
- [x] 메뉴 노드 클릭 → 타입 선택 → 블록 노드 생성 + 메뉴 노드 제거
- [ ] text 블록: 클릭 → text 편집 → 즉시 반영
- [ ] image 블록: URL 입력 → imageUrl 반영
- [ ] link 블록: URL 입력 → 필드 반영 (OpenGraph stub)
- [ ] 편집 중 노드 드래그 비활성화
- [ ] `pnpm lint` 오류 없음
- [ ] `pnpm build` 타입 오류 없음
- [ ] `pnpm test` 기존 테스트 전부 통과
