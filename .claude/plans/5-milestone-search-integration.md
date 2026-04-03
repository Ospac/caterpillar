# M5 Search Integration 구현 계획

## Context

M4(Block System)가 완료되어 7종 블록 타입별 편집 UI와 `SearchBlockForm` 제네릭 컴포넌트가
mock 데이터 기반으로 동작한다. M5는 mock 데이터를 실제 외부 API로 교체하는 단계다.

**보안 원칙:** 모든 API 키/토큰은 Netlify Functions를 통해 서버사이드에서만 사용한다.
브라우저에서 외부 API를 직접 호출하지 않으며, 클라이언트는 `/api/*` 경로의
Netlify Functions만 호출한다.

### API 명세 참조

- [Last.fm API](./lastfm.md) — music 블록 (album.search)
- [IGDB API](./igdb.md) — game 블록 (POST /v4/games + /v4/covers)
- [TMDB API](./tmdb.md) — movie 블록 (GET /search/movie)
- [Google Books API](./google-books.md) — book 블록 (GET /volumes)

---

## 아키텍처

```text
[브라우저]                         [Netlify Functions]              [외부 API]
                                   (서버사이드)
SearchBlockForm
  └─ useSearchQuery(query)
       └─ fetch("/api/search-music")  → /api/search-music.ts     → Last.fm
       └─ fetch("/api/search-game")   → /api/search-game.ts      → IGDB
       └─ fetch("/api/search-movie")  → /api/search-movie.ts     → TMDB
       └─ fetch("/api/search-book")   → /api/search-book.ts      → Google Books
```

### 디렉토리 구조

```text
netlify/
  functions/
    search-music.ts          # Last.fm 프록시
    search-game.ts           # IGDB 프록시 (인증 + 커버 이미지 조회 포함)
    search-movie.ts          # TMDB 프록시
    search-book.ts           # Google Books 프록시

src/features/diagram/
  lib/api/
    types.ts                 # SearchResult 공통 타입
    searchMusic.ts           # /api/search-music 호출 + 응답 정규화
    searchGame.ts            # /api/search-game 호출 + 응답 정규화
    searchMovie.ts           # /api/search-movie 호출 + 응답 정규화
    searchBook.ts            # /api/search-book 호출 + 응답 정규화
    queries.ts               # queryOptions 기반 쿼리 팩토리
  lib/hooks/
    useDebouncedValue.ts     # 디바운스 훅
```

---

## 구현 단계

### Step 1. 공통 타입 및 검색 훅

**파일:** `src/features/diagram/lib/api/types.ts`

```ts
interface SearchResult {
  title: string
  secondary: string        // artist, author 등
  year?: string            // 출시 연도, 출판 연도 등
  image?: string
}
```

- 모든 API 클라이언트가 `SearchResult[]`를 반환하도록 통일
- 기존 `BlockData` 필드(`MusicBlockData.artist`, `GameBlockData.releaseYear` 등)와 매핑은
  클라이언트 함수 내부에서 처리

**파일:** `src/features/diagram/lib/api/queries.ts`

- `queryOptions` API 기반 쿼리 팩토리 — 쿼리 키·함수·옵션을 하나의 객체로 결합
- 블록 타입별 팩토리 함수: `searchQueries.music(query)`, `.game()`, `.movie()`, `.book()`
- `enabled: query.length >= 2` — 최소 2자 이상일 때만 요청
- `staleTime: 5분` — 동일 검색어 재요청 방지

**파일:** `src/features/diagram/lib/hooks/useDebouncedValue.ts`

- 입력값 디바운스(300ms) — 타이핑 중 불필요한 쿼리 실행 방지
- 컴포넌트에서 `useDebouncedValue(query, 300)` → `debouncedQuery`를 쿼리 팩토리에 전달

### Step 2. Netlify Functions — 서버사이드 프록시

각 function은 동일한 패턴을 따른다:

1. 쿼리 파라미터(`q`)에서 검색어 수신
2. 환경 변수에서 API 키/토큰 읽기
3. 외부 API 호출
4. 응답을 `SearchResult[]` 형태로 정규화하여 반환
5. 에러 시 적절한 HTTP 상태 코드 + 에러 메시지 반환

#### 2-1. search-music (Last.fm)

**파일:** `netlify/functions/search-music.ts`

- 외부 호출: `GET https://ws.audioscrobbler.com/2.0/?method=album.search&album={q}&api_key={LASTFM_API_KEY}&format=json&limit=10`
- 환경 변수: `LASTFM_API_KEY`
- 매핑:
  ```
  album.name   → title
  album.artist → secondary
  album.image[size="large"]["#text"] → image
  ```

#### 2-2. search-game (IGDB)

**파일:** `netlify/functions/search-game.ts`

- **2단계 호출** 필요:
  1. `POST https://api.igdb.com/v4/games` — 게임 검색
     - body: `search "{q}"; fields name,cover,first_release_date; limit 10;`
     - headers: `Client-ID: {IGDB_CLIENT_ID}`, `Accept: application/json`
  2. `POST https://api.igdb.com/v4/covers` — 커버 이미지 ID 일괄 조회
     - body: `fields image_id; where id = (id1,id2,...); limit 10;`
     - headers: `Client-ID: {IGDB_CLIENT_ID}`, `Content-Type: text/plain`
- 환경 변수: `IGDB_CLIENT_ID`, `IGDB_ACCESS_TOKEN`
  - Access token은 60일마다 만료됨. 갱신 필요 시 `POST https://id.twitch.tv/oauth2/token?client_id={IGDB_CLIENT_ID}&client_secret={IGDB_SECRET}&grant_type=client_credentials` 호출
- 이미지 URL 구성: `https://images.igdb.com/igdb/image/upload/t_cover_big/{image_id}.jpg`
- 매핑:
  ```
  game.name                             → title
  game.first_release_date (Unix → 연도)  → secondary
  cover URL                             → image
  ```

#### 2-3. search-movie (TMDB)

**파일:** `netlify/functions/search-movie.ts`

- 외부 호출: `GET https://api.themoviedb.org/3/search/movie?query={q}&language=ko-KR&page=1`
- headers: `Authorization: Bearer {TMDB_ACCESS_TOKEN}`, `Accept: application/json`
- 환경 변수: `TMDB_ACCESS_TOKEN`
- 매핑:
  ```
  result.title        → title
  result.release_date → secondary (연도 추출)
  "https://image.tmdb.org/t/p/w500" + result.poster_path → image
  ```
- `poster_path`가 `null`이면 `image: undefined`

#### 2-4. search-book (Google Books)

**파일:** `netlify/functions/search-book.ts`

- 외부 호출: `GET https://www.googleapis.com/books/v1/volumes?q={q}&maxResults=10&langRestrict=ko&key={GOOGLE_BOOKS_API_KEY}`
- headers: `Referer: https://ctpr.netlify.app/` (API 키 HTTP 리퍼러 제한 대응)
- 환경 변수: `GOOGLE_BOOKS_API_KEY`
- 매핑:
  ```
  volumeInfo.title      → title
  volumeInfo.authors[0] → secondary
  volumeInfo.imageLinks.thumbnail → image (http:// → https:// 교체)
  ```
- `imageLinks` 없으면 `image: undefined`, `authors` 없으면 `secondary: ""`
- `thumbnail` 없으면 `smallThumbnail` 폴백

### Step 3. 클라이언트 API 함수

**위치:** `src/features/diagram/lib/api/`

각 함수는 Netlify Function 엔드포인트를 호출하고 응답을 `SearchResult[]`로 반환한다:

HTTP 클라이언트는 `axios`를 사용한다 (`pnpm add axios`).

```ts
// types.ts
import { z } from "zod/v4"

export const SearchResultSchema = z.object({
  title: z.string(),
  secondary: z.string(),
  year: z.string().optional(),
  image: z.string().optional(),
})

export type SearchResult = z.infer<typeof SearchResultSchema>

const SearchResultArraySchema = z.array(SearchResultSchema)

/** axios 응답을 Zod로 검증하여 SearchResult[]를 반환 */
export function parseSearchResults(data: unknown): SearchResult[] {
  return SearchResultArraySchema.parse(data)
}
```

```ts
// searchMusic.ts
import axios from "axios"
import { parseSearchResults } from "./types"

export async function searchMusic(query: string) {
  const { data } = await axios.get("/api/search-music", {
    params: { q: query },
  })
  return parseSearchResults(data)
}
```

4개 함수 모두 동일 패턴. axios는 non-2xx 응답 시 자동으로 에러를 throw하고,
응답 데이터는 `parseSearchResults()`로 Zod 검증을 거쳐 타입 안전성을 보장한다.
스키마 불일치 시 ZodError가 throw되며, TanStack Query의 에러 핸들링으로 전파된다.

### Step 4. SearchBlockForm 연동

**파일:** `src/features/diagram/ui/CanvasCore/BlockEditForm.tsx`

기존 mock 기반 `items` + `filterFn` 구조를 TanStack Query 기반으로 교체한다.

#### 쿼리 팩토리 패턴

`queryOptions` API를 사용해 쿼리 키·함수·옵션을 하나의 팩토리 객체로 관리한다:

**파일:** `src/features/diagram/lib/api/queries.ts`

```ts
import { queryOptions } from "@tanstack/react-query"

export const searchQueries = {
  music: (query: string) =>
    queryOptions({
      queryKey: ["search", "music", query],
      queryFn: () => searchMusic(query),
      enabled: query.length >= 2,
      staleTime: 1000 * 60 * 5,
    }),
  game: (query: string) =>
    queryOptions({
      queryKey: ["search", "game", query],
      queryFn: () => searchGame(query),
      enabled: query.length >= 2,
      staleTime: 1000 * 60 * 5,
    }),
  movie: (query: string) =>
    queryOptions({
      queryKey: ["search", "movie", query],
      queryFn: () => searchMovie(query),
      enabled: query.length >= 2,
      staleTime: 1000 * 60 * 5,
    }),
  book: (query: string) =>
    queryOptions({
      queryKey: ["search", "book", query],
      queryFn: () => searchBook(query),
      enabled: query.length >= 2,
      staleTime: 1000 * 60 * 5,
    }),
}
```

#### 컴포넌트 연동

**변경 전:**
```tsx
<SearchBlockForm
  items={MOCK_RESULTS.music}
  filterFn={(item, q) => item.title.includes(q)}
  ...
/>
```

**변경 후:**
```tsx
// MusicBlockForm 내부
const [debouncedQuery] = useDebouncedValue(query, 300)
const { data, isLoading, isError } = useQuery(
  searchQueries.music(debouncedQuery),
)

<SearchBlockForm
  items={data ?? []}
  isLoading={isLoading}
  isError={isError}
  ...
/>
```

- 디바운스는 `useDebouncedValue` 훅으로 처리 (`lib/hooks/useDebouncedValue.ts`)
- `queryOptions`의 `enabled` 조건이 최소 글자수 제어

**SearchBlockForm 변경사항:**
- `filterFn` prop 제거 (서버에서 이미 필터링됨)
- `isLoading` prop 추가 → 로딩 스피너/텍스트 표시
- `isError` prop 추가 → 에러 메시지 + 재시도 버튼 표시
- 빈 결과 → "결과 없음" 상태 표시
- 기존 클라이언트 필터링 로직 제거

### Step 5. BlockData 매핑

검색 결과 선택 시 `SearchResult` → `BlockData` 필드 매핑:

| SearchResult | MusicBlockData | GameBlockData | MovieBlockData | BookBlockData |
|---|---|---|---|---|
| `title` | `title` | `title` | `title` | `title` |
| `secondary` | `artist` | — | — | `author` |
| `year` | — | `releaseYear` (number 변환) | `releaseYear` (number 변환) | — |
| `image` | `image` | `image` | `image` | `image` |

이 매핑은 각 블록 폼의 `onSelect` 콜백에서 수행.

### Step 6. 개발 환경 설정

**파일:** `netlify.toml` (프로젝트 루트)

```toml
[build]
  command = "pnpm build"
  publish = "dist"
  functions = "netlify/functions"

[dev]
  command = "pnpm dev"
  targetPort = 3000
  port = 8888
  autoLaunch = false

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```


- 로컬 개발: `netlify dev` 명령으로 Functions + 프론트엔드 동시 실행
- 프로덕션: Netlify 대시보드에서 환경 변수 설정

### Step 7. mock 제거 및 정리

- `model/mock.ts`에서 검색 관련 mock 데이터 제거
- `BlockEditForm.tsx`에서 mock import 제거
- mock이 테스트에서 사용되는 경우 테스트용 fixture로 이동

---

## 에러 처리 전략

| 상황 | 사용자에게 표시 | 동작 |
|---|---|---|
| 네트워크 오류 | "검색 중 오류가 발생했습니다" + 재시도 버튼 | TanStack Query `retry: 1` |
| API 키 미설정/인증 실패 | "API 설정을 확인해주세요" | HTTP 401/403 → 에러 메시지 |
| 쿼터 초과 | "요청 한도를 초과했습니다" | HTTP 429 → 에러 메시지 |
| 빈 결과 | "결과 없음" | 정상 빈 배열 |
| 외부 API 응답 파싱 실패 | "검색 중 오류가 발생했습니다" | function 내부 catch → 500 |

**핵심 원칙:** 검색 에러는 해당 블록 폼 안에서만 표시. 캔버스 노드/엣지/도킹 상태에 영향 없음.


## 검증 체크리스트

- [ ] Netlify Functions 4종 로컬(`netlify dev`)에서 정상 응답
- [ ] music 블록: 검색 → 결과 목록 표시 → 선택 → `MusicBlockData` 반영
- [ ] game 블록: 검색 → 결과 + 커버 이미지 표시 → 선택 → `GameBlockData` 반영
- [ ] movie 블록: 검색 → 포스터 포함 결과 표시 → 선택 → `MovieBlockData` 반영
- [ ] book 블록: 검색 → 결과 표시 → 선택 → `BookBlockData` 반영
- [ ] 네트워크 오류 시 블록 폼 내 에러 메시지 + 재시도 동작
- [ ] 빈 결과 시 "결과 없음" 표시
- [ ] API 키 없이 빌드/실행 시 캔버스 기본 동작 정상 (에러가 캔버스에 전파되지 않음)
- [ ] `model/mock.ts` 검색 mock 데이터 제거 완료
- [ ] `pnpm lint` 오류 없음
- [ ] `pnpm build` 타입 오류 없음
- [ ] `pnpm test` 기존 테스트 전부 통과
