# CLAUDE.md

이 파일은 저장소에서 작업할 때 Claude Code(claude.ai/code)에 제공하는 가이드입니다.

## 프로젝트 개요

사용자가 미디어(텍스트, 사진, 링크, 음악, 게임, 영화, 책)를 블록으로 그리드 캔버스에 저장하고 연결하는 비주얼 블록 기반 콘텐츠 관리 도구. 로컬 우선 방식.

## 명령어

```bash
pnpm dev              # 개발 서버 (포트 3000)
pnpm build            # 프로덕션 빌드 + TypeScript 타입 검사
pnpm test             # 전체 테스트 실행
pnpm test:watch       # 워치 모드
pnpm lint             # Biome 린터
pnpm format           # Biome 포매터
pnpm check            # 포맷 + 린트 함께 실행
```

단일 테스트 파일 실행: `pnpm test -- <경로-또는-패턴>`

**구현 후 매번:** `pnpm lint` 실행 후 `pnpm build`로 검증합니다.

## 아키텍처

### 기능 구조

```text
src/
  features/diagram/     # 주요 기능 — 캔버스, 노드, 엣지, 그리드, 검색
    model/              # 상태, 타입, 비즈니스 규칙
    ui/                 # React 컴포넌트
    lib/                # 기능 내부 유틸리티
  shared/               # 전역 유틸리티 전용 (ui, lib, types, constants)
  routes/               # TanStack Router 파일 기반 라우트
```

### 4계층 모델 (diagram 기능)

**1. Block 데이터 모델** (`model/block.ts`)
- `BlockData`: `text | image | link | music | game | movie | book`에 대한 판별 유니온
- 직접 입력 타입: text, image, link / 검색 타입: music, game, movie, book
- 유효성 검사는 `validateBlockData()`를 통해 `ok | fallback | invalid` 반환

**2. 런타임 타입** (`model/runtime.ts`, `lib/type.ts`)
- `DiagramNode`: block 또는 menu 데이터를 가진 캔버스 노드
- `DockedNodeState`: `freePosition`(드래그 중), `dockedCell`(스냅됨), `lastValidDock`(롤백) 추적
- 두 가지 좌표계: `XYPosition`(픽셀) ↔ `CellCoord`(그리드 col/row)

**3. 영속성 모델** (`model/document.ts`)
- `CanvasDocument`: 직렬화 가능한 포맷 (visibleStage, nodes, edges만 포함)
- `parseCanvasDocument()` / `serializeCanvasDocument()`로 왕복 처리

**4. UI** (`ui/CanvasCore/CanvasCoreInner.tsx`)
- 메인 오케스트레이터 (~1100줄); React hooks를 통해 모든 계층 연결
- React Flow의 `useNodesState` / `useEdgesState` 사용

### 그리드 & 도킹 시스템 (`lib/grid.ts`, `lib/docking.ts`)

- 그리드 단계: 4×4, 7×7, 10×10 (NODE_SIZE = 215px)
- 드래그 상태 머신: `dragStart` → `dragMove` → `dragStop`(가장 가까운 셀에 스냅) 또는 `dragCancel`(`lastValidDock` 복원)
- 드롭 해결 우선순위: 유효한 dock → lastValidDock 폴백 → 가장 가까운 빈 셀 → 현재 위치 유지

### 기술 스택

- React 19, TypeScript, Rsbuild/Rspack
- React Flow (XYFlow) — 캔버스 렌더링
- TanStack Router (파일 기반 라우팅)
- Tailwind CSS 4 + PostCSS
- Biome — 린트/포맷 (tabs, double quote)
- Rstest + Testing Library — 테스트

## Git 워크플로우

- 커밋 메시지 형식: `type(scope): 요약` — 고유명사(컴포넌트명, 변수명)를 제외하고 한국어 사용
- 현재 작업과 관련된 파일만 커밋
- 명시적으로 요청받지 않는 한 `--amend`, force push, `reset --hard` 사용 금지

## 참고 문서

### Claude 작업용 (빠른 참조)
- `.claude/FEATURE.md` — 코드 위치 인덱스, 핵심 타입/함수/규칙 요약
- `.claude/plans/` — 마일스톤별 구현 스펙

### 상세 스펙 원본
- `.codex/features/` — canvas, blocks, data, search, docking_guide, persistence, testing
- `.codex/roadmap.md` — 마일스톤 및 TODO
