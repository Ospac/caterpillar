# Blocks

## Code Location
- `src/features/diagram/ui`: 블록 렌더링/편집 UI
- `src/features/diagram/model`: 블록 타입 규칙, 데이터 변환
- `src/shared/ui`: 전역 재사용 UI 컴포넌트

## Supported Types
- 텍스트
- 이미지
- 링크
- 음악
- 게임
- 영화
- 책

## Creation and Editing
- 기본 생성 플로우는 메뉴 블록에서 타입을 선택해 노드를 만든다.
- 텍스트 블록: 블록 클릭 시 인라인 편집
- 이미지 블록: 이미지 Drag and Drop 또는 이미지 URL 입력/붙여넣기로 수정
- 링크 블록: URL 입력 시 메타데이터(제목/설명/썸네일) 편집
- 음악/게임/영화/책 블록: 블록 내부 검색창에서 검색 후 선택

## Functional Scope
- 블록 생성: 타입별 노드 생성
- 블록 편집: 메타데이터 수정(제목, 설명, URL, 썸네일 등)
- 시각 상태: 선택, 호버, 도킹 가능/불가, 스냅 프리뷰 표시
