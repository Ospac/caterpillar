# Search Integration

## Code Location
- `src/features/diagram/model`: 검색 요청/응답 매핑 규칙
- `src/features/diagram/lib`: API 클라이언트 유틸
- `src/features/diagram/ui`: 블록 내부 검색 UI

## APIs
- 음악: Last.fm API
- 게임: IGDB API
- 영화: TMDB API
- 책: Naver Book API, Google Books API

## Rules
- 음악/게임/영화/책 블록은 블록 내부 검색창을 통해 데이터를 검색하고 선택한다.
- 검색 결과 선택 시 블록 데이터 모델에 맞게 표준 필드(제목, 설명, 썸네일, 원본 링크)를 매핑한다.
- API 에러나 빈 결과는 블록 단위로 처리하고, 캔버스 전체 동작은 유지한다.
