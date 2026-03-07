# Testing

## Code Location
- `src/testing/fixtures`: 테스트 데이터
- `src/testing/mocks`: MSW 핸들러 및 테스트 목
- `src/features/diagram/*`: 기능 테스트 대상 모듈

## Scope
- Unit: Vitest
- Component: React Testing Library
- E2E: Playwright
- API 연동 테스트

## Strategy
- 핵심 도메인 규칙(스냅/도킹/검증)은 Unit 테스트로 검증한다.
- 노드 생성/편집 UI는 Component 테스트로 검증한다.
- 사용자 플로우(드래그/도킹/연결/저장/복원)는 E2E 테스트로 검증한다.
- 외부 API 연동은 mock(MSW) 기반 테스트와 통합 테스트를 분리한다.
