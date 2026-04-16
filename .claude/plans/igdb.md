# IGDB API 명세

## 개요

- **Base URL:** `https://api.igdb.com/v4`
- **인증:** Twitch 기반 (Client-ID + Bearer token)
- **요청 방식:** POST body에 APIcalypse 쿼리 전송
- **연동 블록:** `game`

---

## 인증 헤더

```
Client-ID: YOUR_CLIENT_ID
Authorization: Bearer YOUR_ACCESS_TOKEN
Accept: application/json
```

> Twitch Developer Console에서 Client-ID와 Client-Secret을 발급받고,
> `https://id.twitch.tv/oauth2/token`에서 Bearer token을 획득.

---

## POST /v4/games

게임 목록을 조회/검색합니다. `GameBlock` 검색 폼에서 사용.

**Method:** `POST`
**URL:** `https://api.igdb.com/v4/games`

### APIcalypse 쿼리 문법

Body에 텍스트 형태로 쿼리를 전달합니다.

| 키워드 | 설명 | 예시 |
|--------|------|------|
| `fields` | 반환할 필드 목록 (쉼표 구분) | `fields name,cover,first_release_date;` |
| `search` | 이름 키워드 검색 | `search "zelda";` |
| `where` | 필터 조건 | `where rating > 80;` |
| `limit` | 결과 수 (기본 10, 최대 500) | `limit 10;` |
| `offset` | 페이지네이션 시작 위치 | `offset 0;` |
| `sort` | 정렬 | `sort rating desc;` |

### 키워드 검색 예시

```bash
curl 'https://api.igdb.com/v4/games' \
  -d 'search "The Legend of Zelda"; fields name,cover,first_release_date,rating,summary; limit 10;' \
  -H 'Client-ID: YOUR_CLIENT_ID' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Accept: application/json'
```

---

## 주요 필드 목록

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | Integer | 고유 ID |
| `name` | String | 게임 이름 |
| `cover` | Reference ID (Cover) | 커버 이미지 ID |
| `first_release_date` | Unix Timestamp | 최초 출시일 |
| `summary` | String | 게임 설명 |
| `storyline` | String | 스토리 설명 |
| `rating` | Double | IGDB 유저 평점 (0–100) |
| `rating_count` | Integer | 유저 평점 수 |
| `aggregated_rating` | Double | 외부 평론가 평점 |
| `total_rating` | Double | 유저 + 평론가 통합 평점 |
| `genres` | Array of Genre IDs | 장르 |
| `platforms` | Array of Platform IDs | 플랫폼 |
| `game_modes` | Array of Game Mode IDs | 싱글/멀티플레이어 등 |
| `involved_companies` | Array of Involved Company IDs | 개발/배급사 |
| `release_dates` | Array of Release Date IDs | 플랫폼별 출시일 |
| `screenshots` | Array of Screenshot IDs | 스크린샷 |
| `videos` | Array of Game Video IDs | 영상 |
| `websites` | Array of Website IDs | 관련 웹사이트 |
| `similar_games` | Array of Game IDs | 유사 게임 |
| `slug` | String | URL-safe 고유 이름 |
| `url` | String | IGDB 페이지 URL |
| `game_type` | Reference ID (Game Type) | 게임 유형 |
| `game_status` | Reference ID (Game Status) | 출시 상태 |

### Deprecated 필드 (사용 금지)

| 구 필드 | 대체 필드 |
|---------|----------|
| `category` | `game_type` |
| `collection` | `collections` |
| `status` | `game_status` |
| `follows` | — (제거 예정) |

---

## 커버 이미지 URL 구성

커버는 별도 엔드포인트에서 `image_id`를 조회 후 URL을 구성합니다.

```bash
# 1) cover ID로 image_id 조회
curl 'https://api.igdb.com/v4/covers' \
  -d 'fields image_id; where id = COVER_ID;' \
  -H 'Client-ID: ...' \
  -H 'Authorization: Bearer ...'

# 2) URL 구성
https://images.igdb.com/igdb/image/upload/t_{size}/{image_id}.jpg
```

### 주요 size 옵션

| size | 해상도 |
|------|--------|
| `cover_small` | 90×128 |
| `cover_big` | 264×374 |
| `thumb` | 90×90 |
| `screenshot_med` | 569×320 |
| `original` | 원본 |

---

## GameBlockData 매핑

```
game.name                                    → GameBlockData.title
game.first_release_date (Unix → 연도)         → GameBlockData.year
cover.image_id → t_cover_big URL             → GameBlockData.image
```

---

## 전체 필드 요청 예시 (참고용)

```bash
curl 'https://api.igdb.com/v4/games' \
  -d 'fields age_ratings,aggregated_rating,aggregated_rating_count,alternative_names,
artworks,bundles,checksum,collections,cover,created_at,dlcs,expanded_games,expansions,
external_games,first_release_date,forks,franchise,franchises,game_engines,
game_localizations,game_modes,game_status,game_type,genres,hypes,involved_companies,
keywords,language_supports,multiplayer_modes,name,parent_game,platforms,
player_perspectives,ports,rating,rating_count,release_dates,remakes,remasters,
screenshots,similar_games,slug,standalone_expansions,storyline,summary,tags,themes,
total_rating,total_rating_count,updated_at,url,version_parent,version_title,
videos,websites;' \
  -H 'Client-ID: YOUR_CLIENT_ID' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Accept: application/json'
```

---

## 환경 변수

```
IGDB_CLIENT_ID=your_client_id_here
IGDB_ACCESS_TOKEN=your_bearer_token_here
```

> **주의:** IGDB는 서버사이드 프록시 없이 브라우저에서 직접 호출 시 CORS 문제가 발생합니다.
> Vite dev proxy 또는 백엔드 API route를 통해 요청을 중계하는 구조가 필요합니다.
