# Block Graph Project Guide

## Project Summary
텍스트, 사진, 링크, 음악, 게임, 영화, 책을 블록 단위로 저장하고 연결하며 재연결하는 웹사이트를 만든다.  
제품 방향은 `topsters`와 `are.na`의 사용 경험에서 영향을 받는다.

## Product Vision
- 다양한 미디어를 같은 단위(블록)로 다룬다.
- 블록은 시각적으로 배치되고, 선으로 연결되며, 언제든 재배치/재연결된다.
- 자유로운 탐색감과 구조화된 도킹 경험(그리드)을 함께 제공한다.

## Technical Stack
- Frontend: React + TypeScript
- Canvas/Graph: React Flow
- State: Zustand (Client State), TanStack Query (Server State)
- Routing: TanStack Router
- Styling: Tailwind CSS
- Build: Rsbuild
- Package Manager: pnpm
- Lint/Format: Biome

## Folder Structure
```txt
src/
  app/                         # 앱 진입점, 전역 provider, 라우팅 설정
    providers/
    routes/
  features/
    diagram/                   # 다이어그램 기능(캔버스/노드/엣지/그리드/저장/검색)
      model/                   # 상태, 타입, 비즈니스 규칙
      ui/                      # React 컴포넌트, 화면 조합
      lib/                     # feature 내부 유틸리티
  shared/                      # 전역 공통 모듈만 유지
    ui/
    lib/
    types/
    constants/
  testing/
    fixtures/
    mocks/
```

## Documents
- [canvas.md](./canvas.md): 캔버스 상호작용 규칙(드래그/스냅/도킹/엣지)
- [blocks.md](./blocks.md): 블록 타입과 생성/편집 규칙
- [search.md](./search.md): 외부 검색 API 및 연동 규칙
- [data.md](./data.md): 데이터 모델과 직렬화 정책
- [persistence.md](./persistence.md): LocalStorage/Server 저장 및 공유 정책
- [testing.md](./testing.md): 테스트 범위와 전략
- [roadmap.md](./roadmap.md): TODO와 마일스톤

## Setup commands
### 1. App scripts
- 개발 서버 실행: `pnpm dev`
- 프로덕션 빌드 + 타입체크: `pnpm build`
- 빌드 결과 미리보기: `pnpm preview`
- 린트 실행: `pnpm lint`
- 코드 포맷: `pnpm format`
- 코드 점검(포맷+린트): `pnpm check`
- Biome 요약 리포트: `pnpm reporter`

### 2. Dependency management (pnpm)
- 의존성 설치(잠금파일 기준): `pnpm install`
- 일반 의존성 추가: `pnpm add <package>`
- 개발 의존성 추가: `pnpm add -D <package>`
- 의존성 제거: `pnpm remove <package>`

## Working process
1. 구현
- 관련 문서(`.codex/plans`, `.codex/features`)를 먼저 확인하고 범위를 확정한다.
- 기능 구현 시 `features` 단위로 역할을 분리하고, 타입/상태/UI 책임을 나눠 작성한다.

2. 검증
- 구현 후 `pnpm lint`를 실행해 정적 점검을 통과한다.
- `pnpm build`를 실행해 빌드/타입체크를 통과한다.
- 필요 시 `pnpm dev`로 수동 상호작용을 확인한다.

3. Git workflow 적용
- 변경 파일 범위를 점검하고 무관한 변경이 포함되지 않았는지 확인한다.
- 커밋 메시지는 `type(scope): summary` 형식을 사용하고, 고유명사를 제외하면 한글로 작성한다.
- 명시적 요청이 없으면 `--amend`, 강제 푸시, `reset --hard`는 사용하지 않는다.

## Git workflow
- 커밋 시점: 작업 단위가 완료된 후에만 커밋한다.
- 커밋 범위: 현재 작업과 관련된 파일만 포함하고, 무관한 변경은 제외한다.
- 커밋 메시지 형식: `type(scope): summary`를 사용한다.
- 커밋 메시지 언어: 컴포넌트 이름, 변수 이름 같은 고유명사를 제외하고 되도록 한글로 작성한다.
- 금지 사항: 명시적 요청이 없으면 `git commit --amend`, 강제 푸시(`git push --force`), `git reset --hard`를 사용하지 않는다.
- 커밋 전 확인: 가능하면 `pnpm lint`와 `pnpm build`를 실행해 기본 검증을 완료한다.
