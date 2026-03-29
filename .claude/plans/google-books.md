# Google Books API 명세

## 개요

- **Base URL:** `https://www.googleapis.com/books/v1`
- **인증:** API key (선택적, 쿼리 파라미터 `key`) — 미인증 시 할당량 제한 낮음
- **연동 블록:** `book`

---

## GET /volumes

키워드로 도서를 검색합니다. `BookBlock` 검색 폼에서 사용.

**Method:** `GET`
**URL:** `https://www.googleapis.com/books/v1/volumes`

### 파라미터

| 파라미터 | 필수 | 타입 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `q` | ✅ | string | — | 검색어. 특수 키워드 지원 |
| `maxResults` | | integer | 10 | 최대 결과 수 (최대 40) |
| `startIndex` | | integer | 0 | 페이지네이션 시작 인덱스 |
| `orderBy` | | string | `relevance` | `relevance` \| `newest` |
| `langRestrict` | | string | — | 언어 제한 (ISO 639-1, 예: `ko`) |
| `printType` | | string | `all` | `all` \| `books` \| `magazines` |
| `projection` | | string | `full` | `full` \| `lite` (반환 필드 축소) |
| `key` | | string | — | Google API 키 |

### `q` 특수 키워드

| 키워드 | 예시 | 설명 |
|--------|------|------|
| `intitle:` | `intitle:해리포터` | 제목 검색 |
| `inauthor:` | `inauthor:김영하` | 저자 검색 |
| `inpublisher:` | `inpublisher:문학동네` | 출판사 검색 |
| `subject:` | `subject:소설` | 주제 검색 |
| `isbn:` | `isbn:9791162540` | ISBN 검색 |

### 응답 주요 필드

```json
{
  "kind": "books#volumes",
  "totalItems": 42,
  "items": [
    {
      "kind": "books#volume",
      "id": "volume_id_string",
      "volumeInfo": {
        "title": "도서 제목",
        "authors": ["저자명"],
        "publisher": "출판사",
        "publishedDate": "2023-05-01",
        "description": "책 소개...",
        "pageCount": 320,
        "categories": ["Fiction"],
        "imageLinks": {
          "smallThumbnail": "https://books.google.com/books/...",
          "thumbnail": "https://books.google.com/books/..."
        },
        "language": "ko"
      },
      "saleInfo": {
        "country": "KR",
        "saleability": "FOR_SALE",
        "isEbook": false
      },
      "accessInfo": {
        "pdf": { "isAvailable": false },
        "epub": { "isAvailable": true }
      }
    }
  ]
}
```

### BookBlockData 매핑

```
items[n].volumeInfo.title          → BookBlockData.title
items[n].volumeInfo.authors[0]     → BookBlockData.author
items[n].volumeInfo.imageLinks.thumbnail → BookBlockData.image
```

> `imageLinks`가 없는 경우 `undefined` 처리 필요. `thumbnail`이 없으면 `smallThumbnail` 폴백.

### 예시 요청

```
GET https://www.googleapis.com/books/v1/volumes?q=intitle:채식주의자+inauthor:한강&maxResults=10&langRestrict=ko&key=YOUR_KEY
```

### 예시 응답

```json
{
  "kind": "books#volumes",
  "totalItems": 3,
  "items": [
    {
      "id": "_ojXNuzgHRcC",
      "volumeInfo": {
        "title": "채식주의자",
        "authors": ["한강"],
        "publishedDate": "2007",
        "imageLinks": {
          "thumbnail": "https://books.google.com/books/content?id=..."
        }
      }
    }
  ]
}
```

---

## 환경 변수

```
GOOGLE_BOOKS_API_KEY=your_api_key_here
```

## 주의사항

- API key 없이도 동작하지만 일일 할당량이 낮음 (약 1,000 요청/일)
- API key 사용 시 Google Cloud Console에서 Books API 활성화 필요
- `thumbnail` URL은 `http://`로 시작할 수 있으므로 `https://`로 교체 권장
