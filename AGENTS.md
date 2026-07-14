# AGENTS.md

이 파일은 저장소에서 작업할 때 Codex(Codex.ai/code)에 제공하는 가이드입니다.

## 프로젝트 개요

사용자가 미디어(텍스트, 사진, 링크, 음악, 게임, 영화, 책)를 블록으로 그리드 캔버스에 저장하고 연결하는 비주얼 블록 기반 콘텐츠 관리 도구. 로컬 우선 방식.

## 명령어

```bash
pnpm dev              # 개발 서버 (포트 3000)
pnpm build            # 프로덕션 빌드 + TypeScript 타입 검사
pnpm preview          # 프로덕션 빌드 로컬 미리보기
pnpm netlify:dev      # Netlify 로컬 개발 환경
pnpm netlify:prod     # Netlify production 컨텍스트 로컬 실행
pnpm test             # 전체 테스트 실행
pnpm test:watch       # 테스트 워치 모드
pnpm lint             # Oxlint 린트 검사
pnpm lint:fix         # Oxlint 자동 수정
pnpm fmt              # Oxfmt 포맷 적용
pnpm fmt:check        # Oxfmt 포맷 검사
```

단일 테스트 파일 실행: `pnpm test -- <경로-또는-패턴>`

**구현 후 매번:** `pnpm lint` 실행 후 `pnpm build`로 검증합니다.

## 아키텍처

### 기능 구조

```text
src/
  diagram/              # 캔버스 핵심 도메인
    api/                 # 검색 API 클라이언트, TanStack Query 옵션, 응답 계약
    hooks/               # 노드·엣지·줌 상호작용 React hooks
    lib/                 # 도킹, 그리드, 엣지, 줌 등 순수 로직
    model/               # 블록 타입, Zustand store, 문서·런타임 모델
    ui/
      CanvasCore/        # React Flow 오케스트레이터
      CanvasNode/        # BlockNode, MenuNode와 연결 핸들
      CanvasOverlay/     # 그리드·노드·엣지 드롭 가이드
      Menu/              # 모드·추가·줌 조작 패널
  routes/                # TanStack Router 파일 기반 라우트
  shared/                # 공용 UI와 유틸리티
functions/               # Netlify 검색 Functions와 공용 서버 유틸
```

`src/routeTree.gen.ts`는 TanStack Router가 생성하는 파일이므로 직접 수정하지 않습니다.

### 블록과 노드 모델 (`model/block.ts`, `model/blockTypes.ts`, `model/nodeTypes.ts`)

- `BlockData`: `text | image | link | music | game | movie | book`에 대한 판별 유니온
- 직접 입력 타입: text, image, link / 검색 타입: music, game, movie, book
- 공통 데이터: `blockType`, `title`, `secondary`, 선택 필드 `image`, `year`
- `validateBlockData()`는 Zod 검증 후 `ok | fallback | invalid` 반환. 빈 title은 block type 문자열로 보정
- 노드 타입은 `block | menu`; menu는 타입 선택용 임시 노드이며 `BlockData`에 포함되지 않음
- `BlockNodeData = BlockData & { initialEditing? }`; `initialEditing`은 런타임 전용

### 상태와 영속성 (`model/canvasStore.ts`, `model/document.ts`)

- `useCanvasStore`가 mode, nodes, edges, dirty/save 상태, 다음 node index와 문서 변경 명령을 소유
- 문서 변경 action은 `edit` 모드에서만 동작하며 `read` 모드에서는 추가·편집·연결·삭제 차단
- Zustand `persist`가 `localStorage["canvas-store"]`에 직렬화한 nodes와 edges만 저장
- `CanvasDocument`는 nodes와 edges만 포함. mode, zoom, 저장 상태, 도킹 상태, `initialEditing`은 영속화하지 않음
- `parseCanvasDocument()` / `serializeCanvasDocument()`로 저장 경계를 검증하고 런타임 필드를 제거
- menu 선택 시 같은 id와 position을 유지한 block 노드로 교체하고 `initialEditing: true`로 시작

### 런타임과 도킹 (`model/runtime.ts`, `lib/canvasRuntimeReducer.ts`, `lib/docking.ts`)

- 영속 store와 별도로 `nodeDockingState`가 각 노드의 `dockedCell`과 `lastValidDock`을 추적
- 드래그 중 좌표의 source of truth는 React Flow node position이며, 드래그 종료 시 store 위치와 도킹 상태를 커밋
- `nodesSynced` reducer action으로 노드 추가·삭제에 맞춰 런타임 도킹 상태 동기화
- 좌표계는 `XYPosition`(픽셀)과 `CellCoord`(grid col/row), 크기는 `NodeSpan { cols, rows }`

### 캔버스 UI (`ui/CanvasCore/index.tsx`)

- `CanvasCoreInner`가 Zustand store와 occupancy를 구독하고 `useCanvasNodes`, `useCanvasEdges`, `useCanvasZoom`을 React Flow에 연결
- React Flow의 자동 snap, pan, zoom, auto-pan은 비활성화. 캔버스 이동은 바깥 컨테이너의 native scroll 사용
- 그리드 가이드는 노드 드래그, 엣지 드래그 또는 줌 중 표시
- `CanvasNode/`는 노드 UI, `CanvasOverlay/`는 드롭·그리드 가이드, `Menu/`는 모드·추가·줌 조작 담당

### 그리드, 도킹과 줌 (`lib/grid.ts`, `lib/docking.ts`, `lib/blockSpan.ts`, `lib/zoom.ts`)

- 고정 그리드: 30×15 cells, `CELL_SIZE = 106px` (논리 크기 3180×1590px)
- span: text/image/link/music/menu는 2×2, game/movie/book은 1×2
- `GridOccupancy`가 span을 sub-cell로 펼쳐 점유와 충돌을 계산; 충돌 셀은 도킹 불가
- 드롭 순서: 유효 dock → lastValidDock → Manhattan distance 기준 가장 가까운 빈 span → 현재 위치 유지
- 줌은 React Flow 제스처가 아니라 viewport에 보이는 grid column 수와 wrapper 크기를 변경하는 방식
- zoom 배율은 0.2~1 범위의 파생값이며, `Ctrl/Cmd + wheel` 또는 메뉴 버튼으로 조작. 일반 wheel은 native scroll 유지

### 엣지와 검색

- 엣지는 `smoothstep`과 `ArrowClosed` marker 사용. edit 모드에서 더블 클릭 또는 Delete/Backspace로 삭제
- 빈 공간에 연결을 놓으면 빈 2×2 영역에 menu 노드와 연결 엣지를 함께 생성
- 검색형 블록은 300ms debounce 후 2자 이상일 때 TanStack Query로 내부 `/api/search-*` 엔드포인트 호출
- Netlify Functions가 Last.fm, IGDB, TMDB, Google Books 연동과 비밀 값 관리를 담당

### 기술 스택

- React 19, TypeScript, React Compiler, Rsbuild/Rspack
- React Flow (XYFlow), Zustand + persist
- TanStack Router(파일 기반 라우팅), TanStack Query
- Tailwind CSS 4, Radix UI, class-variance-authority
- Axios, Zod, Netlify Functions
- Oxlint, Oxfmt (tabs, double quotes)
- Rstest, Testing Library, happy-dom

## Git 워크플로우

- 커밋 메시지 형식: `type(scope): 요약` — 고유명사(컴포넌트명, 변수명)를 제외하고 한국어 사용
- 현재 작업과 관련된 파일만 커밋
- 명시적으로 요청받지 않는 한 `--amend`, force push, `reset --hard` 사용 금지

## 참고 문서

### Codex 작업용 (빠른 참조)

- `docs/FEATURE.md` — 코드 위치 인덱스와 핵심 계약
- `docs/code-onboarding.md` — diagram 코드 읽기 순서와 계층별 설명
- `docs/API.md` — 검색 API 환경 변수, 공급자 매핑과 오류 계약
