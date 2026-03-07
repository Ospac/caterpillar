# Persistence

## Code Location
- `src/features/diagram/model`: 저장/복원 정책 및 상태 흐름
- `src/features/diagram/lib`: storage adapter, API 호출 유틸
- `src/shared/lib`: 전역 공통 직렬화/파싱 유틸

## Storage Options
- 캔버스 생성 시 `LocalStorage` 또는 `server` 저장 방식을 선택한다.
- 노드/엣지/좌표/도킹 상태를 저장하고 복원한다.

## Collaboration
- 링크 공유 기반으로 캔버스를 함께 확인/편집하는 협업 기능을 제공한다.
- 권한 범위(읽기 전용/편집)는 정책으로 분리해 관리한다.

## Architecture Notes
- UI 계층과 저장 로직을 분리한다.
- 클라이언트 상태(Zustand)와 서버 상태(TanStack Query) 경계를 명확히 유지한다.
