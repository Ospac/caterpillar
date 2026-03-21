# M3: Data Model and Domain Rules

## 목표
런타임 상태와 저장 모델의 경계를 명확히 분리하고,
M4에 필요한 최소 블록 데이터 구조와 document shape를 정의한다.
과도한 일반화/버전 관리/마이그레이션은 도입하지 않는다.

## 범위

**In Scope**
- React Flow 런타임 상태 ↔ 저장 대상 필드 분리
- `node.data` 블록 타입별 최소 구조 정의
- 저장/복원용 `CanvasDocument` shape 정의
- 기본값 보정 수준의 간단 validation

**Out of Scope**
- 스키마 버전 관리, 마이그레이션 체인
- 실제 블록 편집 UI (M4)
- 저장 어댑터 구현 (M6)

## 구현 단계

### 1. 데이터 경계 정리
저장 대상: `nodes`, `edges`, `visibleStage`
제외 대상: `nodeDockingState`, 임시 편집 상태, viewport

완료 기준
- `CanvasCore`가 들고 있는 상태 중 저장 대상이 명확히 분리됨

### 2. 최소 블록 데이터 구조
```ts
// 공통
type BlockBase = { blockType: BlockType; title: string }

// 타입별 확장
type TextBlock = BlockBase & { content: string }
type ImageBlock = BlockBase & { url: string }
type LinkBlock = BlockBase & { url: string; description?: string; thumbnail?: string }
// music | game | movie | book: title + 표준 필드 추가
```
- `validateBlockData()` → `ok | fallback | invalid`

완료 기준
- 텍스트/이미지/링크 블록이 같은 규칙으로 표현됨
- M4 편집 UI가 기대할 필드를 바로 알 수 있음

### 3. Document Shape
```ts
type CanvasDocument = {
  visibleStage: GridStage
  nodes: NodeItem[]
  edges: EdgeItem[]
}
```
- `parseCanvasDocument()` / `serializeCanvasDocument()` 진입점
- 버전 필드/마이그레이션 없이 단순 유지

완료 기준
- 현재 shape만으로 캔버스 복원 가능

### 4. 기본 Validation
- 타입별 필수 필드 정의
- 누락 데이터: 기본값 보정 또는 로드 거부
- 복잡한 validation 상태 모델 도입 금지

완료 기준
- 저장 데이터 복원 실패 케이스가 예측 가능함

## 검증 체크리스트
- [x] 런타임 상태 ↔ 저장 모델 경계 분리
- [x] M4에 필요한 최소 블록 데이터 구조 정의
- [x] 저장/복원 가능한 `CanvasDocument` shape 정리
- [x] 기본 validation 규칙 구현
