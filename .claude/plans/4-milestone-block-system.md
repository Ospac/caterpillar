# M4 Block System 구현 계획

## Context

M3(데이터 모델 & 도메인 규칙)가 완료되어 `BlockData` 판별 유니온, `validateBlockData()`,
`CanvasDocument` 직렬화 기반이 확립됐다. M4는 그 위에 실제 사용자 인터랙션 계층을 얹는 단계다:
메뉴 노드에서 블록 타입을 선택하고, 타입별 인라인 편집 UX를 완성하는 것이 목표.

---

## 구현 단계

### Step 1. 블록 타입 확장 (`model/block.ts`) ✅ 완료

검색 기반 4종 타입 추가 완료. `BLOCK_TYPES`, `BlockType`, `validateBlockData()` 동기화 완료.
(`block.test.ts` — 신규 타입 fallback 케이스 포함 16개 케이스 통과)

### Step 2. Node Type 분리 및 등록 ✅ 완료

- `CanvasCoreInner.tsx`의 `nodeTypes`: `"menu"` → `MenuNode`, `"block"` → `BlockNode` 등록
- `DiagramNode` type 필드: `"menu" | "block"` (`"square"` 제거)
- `SquareNode.tsx` 제거, `runtime.ts` 초기 노드 빈 캔버스로 변경

### Step 3. MenuNode 컴포넌트 ✅ 완료

- `ui/CanvasCore/MenuNode.tsx`: 7종 타입 선택 버튼, `data.onTypeSelect?.(blockType)` 콜백
- `CanvasCoreInner`에서 처리: 해당 위치에 `"block"` 노드 생성 + `"menu"` 노드 제거

### Step 4. BlockNode 컴포넌트 ✅ 완료

- `BlockNode.tsx`: 클릭 → `BlockEditForm` 진입, 편집 종료(포커스 아웃) → `BlockView` 복귀
- `BlockEditForm.tsx`: 타입별 편집 폼 구현
  - 직접 입력 3종 (text, image, link): 필드 직접 입력
  - 검색 기반 4종 (music, game, movie, book): `SearchBlockForm` 공통 레이아웃 + mock 데이터 동작
- `Input.tsx`: 공통 input 컴포넌트 (HTML input attributes 상속, `twMerge`/`clsx`)
- `createDefaultBlockData` 유틸 제거 — 노드 생성 시 `{ blockType }` 최소값만 사용

### Step 5. CanvasCoreInner 연동 ✅ 완료

- 새 노드 생성 즉시 편집 상태 진입: `initialEditing: true` 플래그로 `BlockNode` 초기 상태 제어

### Step 6. 편집 중 드래그 비활성화 ✅ 완료

- `BlockNode` 컨테이너에 `isEditing` 시 `nodrag` 클래스 조건부 적용
- React Flow의 `noDragClassName`(기본값 `"nodrag"`) — DOM 레벨에서 즉시 drag 차단

---

## 미구현 (M5 이후)

- **시각 상태**: 선택/호버/도킹 가능/불가 스타일 고유화
- **검색 실 API 연동**: 현재 `model/mock.ts` mock 데이터로 동작, M5에서 실 연동
- **OpenGraph 자동 채움**: link 블록 URL 입력 시 제목/설명 자동 채움 (현재 수동 입력)

---

## 검증 체크리스트

- [x] `BLOCK_TYPES` 7종 전부 생성 가능
- [x] 메뉴 노드 클릭 → 타입 선택 → 블록 노드 생성 + 메뉴 노드 제거
- [x] 노드 생성 직후 즉시 편집 폼 진입
- [x] text/image/link 블록: 입력 → 즉시 반영
- [x] music/game/movie/book 블록: mock 검색 → 선택 → 필드 반영
- [x] 편집 중 노드 드래그 비활성화
- [x] `pnpm lint` 오류 없음
- [x] `pnpm build` 타입 오류 없음
- [x] `pnpm test` 기존 테스트 전부 통과
