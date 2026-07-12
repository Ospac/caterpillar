# 검색 API 연동

이 문서는 검색형 블록(`music`, `game`, `movie`, `book`)의 현재 구현 계약을 설명합니다.
외부 API의 전체 명세가 아니라, 프로젝트가 실제로 호출하고 변환하는 필드만 다룹니다.

최종 확인일: 2026-07-12

## 요청 흐름

```text
SearchBlockForm
  -> TanStack Query (검색어 2자 이상, staleTime 5분)
  -> GET /api/search-{type}?q={query}
  -> Netlify Function
  -> 외부 API
  -> SearchResult[]
```

브라우저는 공급자 API를 직접 호출하지 않습니다. `netlify.toml`이 `/api/*`를
`/.netlify/functions/:splat`으로 프록시하며, 각 함수가 비밀 키와 토큰을 서버에서 읽습니다.
모든 외부 요청은 Axios를 사용하고 제한 시간은 10초입니다.

로컬에서 함수까지 포함해 확인할 때는 프런트엔드 개발 서버(`pnpm dev`, 포트 3000)가 아니라
Netlify Dev(포트 8888)를 진입점으로 사용해야 합니다.

## 내부 API 계약

| 블록 | 내부 엔드포인트               | Netlify Function             | 공급자       |
| ---- | ----------------------------- | ---------------------------- | ------------ |
| 음악 | `GET /api/search-music?q=...` | `functions/search-music.mts` | Last.fm      |
| 게임 | `GET /api/search-game?q=...`  | `functions/search-game.mts`  | IGDB         |
| 영화 | `GET /api/search-movie?q=...` | `functions/search-movie.mts` | TMDB         |
| 책   | `GET /api/search-book?q=...`  | `functions/search-book.mts`  | Google Books |

`q`가 없거나 빈 문자열이면 모든 엔드포인트가 `400`과 다음 응답을 반환합니다.

```json
{ "error": "Missing query parameter" }
```

성공 응답은 다음 스키마의 배열이며 클라이언트에서 Zod로 검증합니다.

```ts
type SearchResult = {
	title: string;
	secondary: string;
	year?: string;
	image?: string;
};
```

외부 API 오류는 해당 상태 코드를 유지합니다. 프로덕션에서는 공급자 응답을 숨기고 일반화된
`{ "error": "..." }` 메시지를 반환하며, 네트워크 오류는 `502`로 변환합니다.

## 환경 변수

모든 값은 브라우저 번들용 `VITE_*` 변수가 아니라 Netlify Functions 런타임 비밀 값입니다.

```dotenv
LASTFM_API_KEY=...
IGDB_CLIENT_ID=...
IGDB_SECRET=...
TMDB_API_ACCESS_TOKEN=...
GOOGLE_BOOKS_API_KEY=...
PRODUCTION_DOMAIN=https://ctpr.netlify.app/
```

| 변수                    | 사용처 | 설명                                                    |
| ----------------------- | ------ | ------------------------------------------------------- |
| `LASTFM_API_KEY`        | 음악   | Last.fm API key                                         |
| `IGDB_CLIENT_ID`        | 게임   | Twitch Developer 앱 Client ID                           |
| `IGDB_SECRET`           | 게임   | Twitch Developer 앱 Client Secret                       |
| `TMDB_API_ACCESS_TOKEN` | 영화   | TMDB API Read Access Token                              |
| `GOOGLE_BOOKS_API_KEY`  | 책     | Google Books API key                                    |
| `PRODUCTION_DOMAIN`     | 책     | Google API key의 HTTP referrer 제한과 맞출 `Referer` 값 |

비밀 값은 저장소나 클라이언트 환경 변수에 커밋하지 않습니다. Google Cloud에서는 Books API를
활성화하고 API key 제한을 `PRODUCTION_DOMAIN`과 일치시켜야 합니다.

## Last.fm: 음악 검색

- 외부 요청: `GET https://ws.audioscrobbler.com/2.0/`
- 메서드: `album.search`
- 고정 파라미터: `format=json`, `limit=10`
- 동적 파라미터: `album={q}`, `api_key={LASTFM_API_KEY}`

공식 문서상 `album.search` 자체는 사용자 세션 인증이 필요하지 않지만 API key는 필수입니다.
결과는 관련도순으로 반환됩니다.

| Last.fm 응답              | `SearchResult` |
| ------------------------- | -------------- |
| `album.name`              | `title`        |
| `album.artist`            | `secondary`    |
| `album.image[*]["#text"]` | `image`        |

이미지는 현재 구현의 배열 위치 우선순위 `2 -> 3 -> 1 -> 0`으로 첫 번째 비어 있지 않은 URL을
사용합니다. Last.fm 응답에 `year`가 없어 설정하지 않습니다. 결과 경로가 없으면 빈 배열을 반환합니다.

공식 문서: [Last.fm album.search](https://www.last.fm/api/show/album.search)

## IGDB: 게임 검색

### 인증과 토큰

IGDB는 Twitch Developer 앱의 Client Credentials 흐름을 사용합니다.

```http
POST https://id.twitch.tv/oauth2/token
Content-Type: application/x-www-form-urlencoded

client_id=...&client_secret=...&grant_type=client_credentials
```

발급된 앱 액세스 토큰은 Netlify Blobs의 `tokens/access_token`에 저장합니다. 저장된 토큰으로
IGDB 요청이 `401`을 반환하면 토큰을 다시 발급하고 요청을 한 번 재시도합니다. Client Secret과
액세스 토큰을 브라우저에 노출하지 않습니다.

### 검색과 커버

게임 검색은 APIcalypse 본문을 사용하는 `POST https://api.igdb.com/v4/games` 요청입니다.

```text
search "{escaped query}"; fields name,cover,first_release_date; limit 10;
```

요청 헤더는 `Client-ID`, `Authorization: Bearer ...`, `Content-Type: text/plain`입니다. 검색어의
역슬래시와 큰따옴표는 이스케이프하고 세미콜론은 공백으로 바꿉니다.

커버 ID가 있으면 한 번의 `POST /v4/covers` 요청으로 `image_id`를 조회합니다.

```text
fields image_id; where id = (1,2,3); limit 10;
```

| IGDB 응답                          | `SearchResult`                         |
| ---------------------------------- | -------------------------------------- |
| `game.name`                        | `title`                                |
| 고정값 `""`                        | `secondary`                            |
| `game.first_release_date`(Unix 초) | `year`(UTC 연도 문자열)                |
| `cover.image_id`                   | `image` (`t_cover_big/{image_id}.jpg`) |

커버 조회가 실패해도 게임 검색은 성공으로 처리하고 `image`만 생략합니다. 공식 제한은 초당
4요청, 동시에 열린 요청 최대 8개이며 초과 시 `429`가 반환됩니다.

공식 문서: [IGDB API](https://api-docs.igdb.com/#getting-started),
[IGDB 이미지](https://api-docs.igdb.com/#images)

## TMDB: 영화 검색

- 외부 요청: `GET https://api.themoviedb.org/3/search/movie`
- 인증: `Authorization: Bearer {TMDB_API_ACCESS_TOKEN}`
- 고정 파라미터: `language=ko-KR`, `page=1`
- 동적 파라미터: `query={q}`

현재 구현은 영화만 검색하며 TV 검색(`/search/tv`)은 사용하지 않습니다. TMDB의
`include_adult`는 보내지 않으므로 공급자 기본값 `false`가 적용됩니다.

| TMDB 응답                              | `SearchResult`                                     |
| -------------------------------------- | -------------------------------------------------- |
| `result.title`                         | `title`                                            |
| `result.release_date` 앞 4자 또는 `""` | `secondary`                                        |
| `result.release_date` 앞 4자           | `year`                                             |
| `result.poster_path`                   | `image` (`https://image.tmdb.org/t/p/w500/{path}`) |

`poster_path`가 `null`이거나 없으면 `image`를 생략합니다. `results`가 없으면 빈 배열을 반환합니다.

공식 문서: [TMDB Search Movies](https://developer.themoviedb.org/reference/search-movie),
[TMDB 인증](https://developer.themoviedb.org/docs/authentication-application)

## Google Books: 책 검색

- 외부 요청: `GET https://www.googleapis.com/books/v1/volumes`
- 고정 파라미터: `maxResults=10`, `langRestrict=ko`
- 동적 파라미터: `q={q}`, `key={GOOGLE_BOOKS_API_KEY}`
- 추가 헤더: `Referer: {PRODUCTION_DOMAIN}`

Google Books의 공개 volume 검색은 OAuth 사용자 인증 없이 사용할 수 있지만, 프로젝트는 요청
식별과 할당량 관리를 위해 API key를 필수 설정으로 취급합니다. 공식 API의 `maxResults` 허용
최대값은 40이며 현재 구현은 첫 10건만 요청하고 페이지네이션하지 않습니다.

| Google Books 응답                      | `SearchResult` |
| -------------------------------------- | -------------- |
| `volumeInfo.title`                     | `title`        |
| `volumeInfo.authors[0]` 또는 `""`      | `secondary`    |
| `volumeInfo.publishedDate` 앞 4자      | `year`         |
| `volumeInfo.imageLinks.thumbnail`      | `image`        |
| `volumeInfo.imageLinks.smallThumbnail` | `image` 폴백   |

이미지 URL이 `http://`로 시작하면 `https://`로 바꿉니다. `items`가 없으면 빈 배열을 반환합니다.
Google Books가 지원하는 `intitle:`, `inauthor:`, `inpublisher:`, `subject:`, `isbn:`, `lccn:`,
`oclc:` 검색 연산자는 `q`에 그대로 전달되어 사용할 수 있습니다.

공식 문서: [Google Books API 사용법](https://developers.google.com/books/docs/v1/using),
[Volumes 리소스](https://developers.google.com/books/docs/v1/reference/volumes)

## 관련 코드

- 클라이언트 요청: `src/features/diagram/lib/api/searchApi.ts`
- TanStack Query 설정: `src/features/diagram/lib/api/searchQueries.ts`
- 응답 스키마: `src/features/diagram/lib/api/types.ts`
- 공통 함수 유틸리티와 외부 URL: `functions/_shared.ts`
- 공급자별 함수: `functions/search-{music,game,movie,book}.mts`
- Netlify 프록시: `netlify.toml`
