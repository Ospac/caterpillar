# TMDB API 명세

## 개요

- **Base URL:** `https://api.themoviedb.org/3`
- **인증:** Bearer token (Authorization 헤더)
- **이미지 Base URL:** `https://image.tmdb.org/t/p/w500{poster_path}`
- **연동 블록:** `movie`

---

## 영화 검색

키워드로 영화를 검색합니다. `MovieBlock` 검색 폼에서 사용.

---

### GET /search/movie *(키워드 검색 — 권장)*

**Method:** `GET`
**URL:** `https://api.themoviedb.org/3/search/movie`

#### 파라미터

| 파라미터 | 필수 | 타입 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `query` | ✅ | string | — | 검색 키워드 |
| `language` | | string | `en-US` | 결과 언어 |
| `page` | | integer | 1 | 페이지 번호 |
| `include_adult` | | boolean | false | 성인 콘텐츠 포함 여부 |


---

### 응답 주요 필드

```json
{
  "page": 1,
  "total_results": 100,
  "total_pages": 5,
  "results": [
    {
      "id": 12345,
      "title": "영화 제목",
      "original_title": "Original Title",
      "poster_path": "/abc123.jpg",
      "backdrop_path": "/xyz789.jpg",
      "release_date": "2024-06-15",
      "overview": "줄거리...",
      "vote_average": 7.5,
      "vote_count": 1234,
      "genre_ids": [28, 12],
      "popularity": 89.3
    }
  ]
}
```

### MovieBlockData 매핑

```
results[n].title        → MovieBlockData.title
results[n].release_date → MovieBlockData.releaseYear  (slice 0..4)
results[n].poster_path  → MovieBlockData.image  ("https://image.tmdb.org/t/p/w500" + poster_path)
```

### 예시 요청

```
GET https://api.themoviedb.org/3/search/movie?query=inception&language=ko-KR&page=1
Authorization: Bearer YOUR_BEARER_TOKEN
```

---

## TV 프로그램 검색

### GET /search/tv *(키워드 검색 — 권장)*

**Method:** `GET`
**URL:** `https://api.themoviedb.org/3/search/tv`

#### 파라미터

| 파라미터 | 필수 | 타입 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `query` | ✅ | string | — | 검색 키워드 |
| `language` | | string | `en-US` | 결과 언어 |
| `page` | | integer | 1 | 페이지 번호 |

### 응답 주요 필드

```json
{
  "results": [
    {
      "id": 67890,
      "name": "시리즈 제목",
      "original_name": "Original Name",
      "poster_path": "/def456.jpg",
      "first_air_date": "2022-01-15",
      "overview": "줄거리...",
      "vote_average": 8.1
    }
  ]
}
```

> TV 결과는 `name` / `first_air_date` 필드 사용 (`title` / `release_date` 아님).

---

## 인증 헤더

```
Authorization: Bearer YOUR_BEARER_TOKEN
Content-Type: application/json
```

## 환경 변수

```
TMDB_BEARER_TOKEN=your_bearer_token_here
```
