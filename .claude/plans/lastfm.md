# Last.fm API 명세

## 개요

- **Base URL:** `http://ws.audioscrobbler.com/2.0/`
- **인증:** API key (쿼리 파라미터 `api_key`)
- **응답 형식:** `format=json` 파라미터로 JSON 지정
- **연동 블록:** `music`

---

## album.search

음악 앨범을 검색합니다. `MusicBlock` 검색 폼에서 사용.

**Method:** `GET`
**URL:** `http://ws.audioscrobbler.com/2.0/?method=album.search`

### 파라미터

| 파라미터 | 필수 | 타입 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `api_key` | ✅ | string | — | Last.fm API 키 |
| `album` | ✅ | string | — | 검색할 앨범명 |
| `limit` | | integer | 30 | 페이지당 결과 수 |
| `page` | | integer | 1 | 페이지 번호 |
| `format` | | string | xml | `json` 지정 권장 |

### 응답 주요 필드

```json
{
  "results": {
    "opensearch:totalResults": "123",
    "albummatches": {
      "album": [
        {
          "name": "앨범명",
          "artist": "아티스트명",
          "image": [
            { "#text": "https://...", "size": "small" },
            { "#text": "https://...", "size": "medium" },
            { "#text": "https://...", "size": "large" }
          ]
        }
      ]
    }
  }
}
```

### MusicBlockData 매핑

```
album.name   → MusicBlockData.title
album.artist → MusicBlockData.artist
album.image[size="medium"]["#text"] → MusicBlockData.image
```

### 예시 요청

```
GET https://ws.audioscrobbler.com/2.0/?method=album.search&album=believe&api_key=YOUR_KEY&format=json
```

---

## album.getInfo

앨범 상세 정보를 조회합니다. 선택한 앨범의 추가 정보가 필요할 때 사용.

**Method:** `GET`
**URL:** `http://ws.audioscrobbler.com/2.0/?method=album.getinfo`

### 파라미터

| 파라미터 | 필수 | 타입 | 설명 |
|----------|------|------|------|
| `api_key` | ✅ | string | Last.fm API 키 |
| `artist` | ✅* | string | 아티스트명 (`mbid` 없을 때 필수) |
| `album` | ✅* | string | 앨범명 (`mbid` 없을 때 필수) |
| `mbid` | | string | MusicBrainz ID (artist/album 대체 가능) |
| `autocorrect` | | 0\|1 | 오탈자 자동 교정 |
| `lang` | | string | 바이오 언어 (ISO 639-1, 예: `ko`, `en`) |
| `format` | | string | `json` 지정 권장 |

### 응답 주요 필드

```json
{
  "album": {
    "name": "앨범명",
    "artist": "아티스트명",
    "image": [...],
    "tracks": {
      "track": [
        { "name": "트랙명", "duration": "210", "@attr": { "rank": "1" } }
      ]
    },
    "tags": {
      "tag": [{ "name": "pop", "url": "https://..." }]
    }
  }
}
```

### 예시 요청

```
GET http://ws.audioscrobbler.com/2.0/?method=album.getinfo&artist=Cher&album=Believe&api_key=YOUR_KEY&format=json
```

---

## 환경 변수

```
LASTFM_API_KEY=your_api_key_here
```
