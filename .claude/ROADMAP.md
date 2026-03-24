# Roadmap

## TODO (미확정)
- 백엔드 후보와 인증/저장 전략 최종 확정 (LocalStorage / server 선택 UX 포함)
- 공유 링크 협업 범위 (읽기 전용 / 편집 권한) 정책 정의
- 외부 검색 API 키 / 쿼터 / 장애 대응 정책 확정

---

## Milestones

### M1. Canvas Core ✅
- React Flow 기반 캔버스/노드/엣지 기본 동작
- 최대 `10x10` 기준 그리드 모델 및 점유 로직 구현
- 가시 영역 단계 확장 (`4x4 → 7x7 → 10x10`)
- 경계 밖 드래그 시 다음 단계로 자동 확장 UX
- 드래그 시작/종료에 따른 그리드 가이드 표시/숨김

### M2. Drag, Snap, Docking ✅
- 스냅/도킹/검증 도메인 로직 순수 함수 분리
- `freePosition`, `dockedCell`, `lastValidDock` 상태 흐름 구현
- 자유 드래그 이동 + 드롭 시 nearest snap
- 스냅 프리뷰 및 히스테리시스 (`snapInDistance`, `snapOutDistance`)
- 그리드 밖/점유 셀 드롭 시 `lastValidDock` 롤백 및 fallback 체인

### M3. Data Model and Domain Rules ✅
- 런타임 상태 ↔ 저장 모델 경계 분리
- `BlockData` 판별 유니온 + `validateBlockData()` 구현
- `CanvasDocument` shape 정의 + `parse` / `serialize` 진입점

---

### M4. Block System

#### 목표
사용자가 메뉴 블록 내부에서 타입을 선택해 노드를 생성하고, 타입별 인라인 편집 UX를 완성한다.

#### 구현 항목

**[P0] 블록 생성 플로우**
- 메뉴 노드(`type: "menu"`) 클릭 → 노드 내부에 타입 목록 표시 (팝업 아님)
- 타입 선택 시 해당 위치에 블록 노드(`type: "block"`) 생성, 메뉴 노드 제거
- 생성 즉시 편집 상태 진입 (text / image / link)

**[P0] 직접 입력 블록 편집 UI**
- 모든 블록 form은 React Hook Form 사용
- 편집은 항상 즉시 반영 — "임시 상태" / "저장 확정" 개념 없음
- `text`: 블록 클릭 → 인라인 textarea 편집
- `image`: 드래그앤드롭 또는 URL 입력/붙여넣기
- `link`: URL 입력 또는 붙여넣기 → OpenGraph에서 title / description / thumbnail 자동 채움; 각 필드는 직접 수정 가능

**[P1] 검색 기반 블록 편집 UI**
- `music` / `game` / `movie` / `book`: 블록 내부 검색창 → 결과 선택 → 표준 필드 채움
- 검색 결과 선택 전 상태(`empty`) / 선택 후 상태(`filled`) 구분

**[P1] 시각 상태 정리**
- 선택 / 호버 / 도킹 가능 / 도킹 불가 / 스냅 프리뷰 — 각각 고유 스타일 적용
- 편집 중 블록은 도킹 인터랙션 비활성화

#### 완료 기준
- 모든 7가지 블록 타입을 생성·편집할 수 있음
- 편집 중 캔버스 도킹 동작 영향 없음

---

### M5. Search Integration

#### 목표
music / game / movie / book 블록에서 외부 API 검색을 연동한다.
API 에러는 블록 단위로 처리하며 캔버스 전체 동작에 영향을 주지 않는다.

#### API 목록
| 블록 | API |
|---|---|
| music | Last.fm API |
| game | IGDB API |
| movie | TMDB API |
| book | Naver Book API / Google Books API |

#### 구현 항목

**[P0] API 클라이언트 분리**
- 각 API별 클라이언트를 `src/features/diagram/lib/api/` 아래에 독립 모듈로 작성
- 공통 인터페이스: `search(query: string): Promise<SearchResult[]>`
- `SearchResult`: `{ title, description, thumbnail, originalLink }` 표준 필드

**[P0] 검색 결과 → 블록 매핑**
- API 응답을 `SearchResult` 표준 필드로 정규화 (매핑 함수 단위 테스트 필수)
- 선택 시 `BlockData`의 해당 타입 필드로 반영

**[P1] 에러 / 빈 결과 처리**
- 네트워크 오류 → 블록 내부에 오류 메시지 표시 (캔버스 동작 유지)
- 빈 결과 → "결과 없음" 상태 표시
- 재시도 가능 UX 제공

**[P2] 환경 설정**
- API 키는 환경 변수(`.env.local`)로 관리, 코드에 하드코딩 금지
- 쿼터 초과 / 인증 실패 → 사용자에게 명확한 메시지

#### 완료 기준
- 4종 블록 모두에서 검색 → 선택 → 블록 반영 플로우 동작
- API 오류 시 캔버스 노드/엣지/도킹 상태 영향 없음

---

### M6. Persistence and Collaboration

#### 목표
캔버스 상태를 저장·복원하고, 서버 저장 방식과 공유 링크 협업을 지원한다.

#### 구현 항목

**[P0] 저장 방식 선택 UX**
- 캔버스 생성 시 `LocalStorage` 또는 `server` 선택
- 선택 결과를 `CanvasDocument` 메타데이터에 기록

**[P0] 저장 / 복원 구현**
- 저장: `serializeCanvasDocument()` → `nodes / edges / visibleStage` 직렬화
- 복원: `parseCanvasDocument()` → 런타임 상태 재구성
- 임시 상태(`nodeDockingState`, 편집 중 상태) 제외

**[P0] Storage Adapter 분리**
- `StorageAdapter` 인터페이스: `save(doc) / load(id) / delete(id)`
- `LocalStorageAdapter` / `ServerAdapter` 두 구현체
- UI 계층에서 어댑터 구현체 직접 import 금지 — 의존성 주입

**[P1] 서버 저장 연동**
- API 클라이언트: `src/features/diagram/lib/api/storage.ts`
- Zustand: 클라이언트 런타임 상태 관리
- TanStack Query: 서버 저장/조회 요청 캐시·동기화

**[P2] 공유 링크 협업**
- 고유 URL 생성 → 링크 공유
- 읽기 전용 / 편집 권한 정책 (TODO 확정 후 구현)
- 권한 없는 사용자의 편집 시도 → 명확한 안내

#### 완료 기준
- LocalStorage 저장/복원 왕복이 손실 없이 동작
- 서버 저장 시 새로고침 후 동일 캔버스 복원
- Storage Adapter 교체 시 UI 코드 변경 없음

---

### M7. Testing and Quality

#### 목표
전 계층에 걸쳐 회귀를 방지하는 테스트 스위트를 완성한다.

#### 구현 항목
- **Unit (Rstest):** 스냅/도킹/검증 도메인 순수 함수, 검색 결과 매핑 함수
- **Component (RTL):** 블록 생성/편집 UI, 저장 방식 선택 UX
- **API 연동 (MSW):** 검색 API mock + 에러 케이스, 저장 API mock + 통합 테스트
- **E2E (Playwright):** 드래그/도킹/연결/저장/복원 사용자 플로우 전체

#### 완료 기준
- 도메인 규칙 전체 Unit 커버리지
- E2E 시나리오: 노드 생성 → 편집 → 도킹 → 저장 → 복원 왕복 통과
