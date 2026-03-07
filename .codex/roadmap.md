# Roadmap

## TODO
- [ ] 캔버스 직렬화 스키마 버전 정책 확정(마이그레이션/하위 호환)
- [ ] 백엔드 후보와 인증/저장 전략 최종 확정(LocalStorage/server 선택 UX 포함)
- [ ] 공유 링크 협업 범위(읽기 전용/편집 권한) 정책 정의
- [ ] 외부 검색 API 키/쿼터/장애 대응 정책 확정

## Milestones
### M1. Canvas Core
- [x] React Flow 기반 캔버스/노드/엣지 기본 동작
- [x] 최대 `10x10` 기준 그리드 모델 및 점유 로직 구현
- [x] 가시 영역 단계 확장(`4x4 -> 7x7 -> 10x10`) 구현
- [x] 경계 밖 드래그 시 다음 단계로 자동 확장 UX 구현
- [x] 드래그 시작/종료에 따른 그리드 가이드 표시/숨김 처리

### M2. Drag, Snap, Docking
- [ ] 자유 드래그 이동 + 근접 셀 탐색 구현
- [ ] 스냅 프리뷰 및 히스테리시스(`snapInDistance`, `snapOutDistance`) 구현
- [ ] 드롭은 어디서든 허용하되, 가장 가까운 그리드 내부 도킹 확정
- [ ] 그리드 밖/점유 셀 드롭 시 `lastValidDock` 롤백 및 fallback 정책 구현

### M3. Data Model and Domain Rules
- [ ] `NodeItem`/`GridState`/`EdgeItem` 타입 정의 및 정규화
- [ ] `freePosition`, `dockedCell`, `lastValidDock` 상태 흐름 구현
- [ ] 캔버스 직렬화 스키마 버전 도입 및 마이그레이션 훅 구성
- [ ] 스냅/도킹/검증 도메인 로직을 순수 함수로 분리

### M4. Block System
- [ ] 블록 생성 플로우(메뉴에서 타입 선택 후 노드 생성) 구현
- [ ] 텍스트/이미지/링크 블록 편집 UX 구현
- [ ] 음악/게임/영화/책 블록 내부 검색 선택 UX 구현
- [ ] 선택/호버/도킹 가능 여부/스냅 프리뷰 시각 상태 정리

### M5. Search Integration
- [ ] Last.fm(음악), IGDB(게임), TMDB(영화), Naver/Google Books(책) 연동
- [ ] 검색 결과를 표준 필드(제목/설명/썸네일/원본 링크)로 매핑
- [ ] API 에러/빈 결과를 블록 단위로 처리(캔버스 동작 유지)

### M6. Persistence and Collaboration
- [ ] 생성 시 저장 방식 선택(LocalStorage/server) 구현
- [ ] 노드/엣지/좌표/도킹 상태 저장 및 복원 구현
- [ ] storage adapter/API client 분리 및 UI 계층과 저장 로직 분리
- [ ] Zustand(클라이언트) / TanStack Query(서버) 경계 정리
- [ ] 공유 링크 기반 협업 및 권한 정책 연결

### M7. Testing and Quality
- [ ] Unit(Vitest): 스냅/도킹/검증 도메인 규칙 테스트
- [ ] Component(RTL): 노드 생성/편집 UI 테스트
- [ ] API 연동: MSW 기반 mock 테스트 + 통합 테스트 분리
- [ ] E2E(Playwright): 드래그/도킹/연결/저장/복원 사용자 플로우 검증
