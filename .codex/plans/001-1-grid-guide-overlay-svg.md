# Milestone 1-1 Plan (SVG Grid Guide Overlay Integration)

## 배경
현재 `GridGuideOverlay`는 CSS `backgroundImage` 기반 반복 패턴으로 격자를 렌더링한다.  
이 방식은 전체 배경 패턴 표현에는 단순하고 빠르지만, 다음 요구를 셀 단위로 제어하기에는 구조적 제약이 있다.
- 각 정사각형 셀마다 독립적인 `margin` 적용
- 셀별/선별 `dashed border` 스타일 정교화
- 셀 내부 `gradient fill` 적용 및 향후 스타일 확장

또한 `CanvasCoreInner`의 `handleNodeDrag`에서 `isNodeOutsideStage`가 `true`일 때 `visibleStage`를 확장하는 로직과, 가이드 오버레이의 렌더 범위가 항상 정확히 동기화되어야 한다.

## 목적
- 그리드 가이드를 `SVG pattern` 기반으로 전환하여 셀 단위 스타일 자유도를 확보한다.
- 드래그 중 stage 확장 로직과 오버레이 렌더 범위를 일관되게 통합한다.
- 기존 Canvas Core 상호작용(드래그, 스냅, 클램프, 엣지 연결)을 깨지 않고 확장 가능한 구조를 만든다.

## 범위 (In Scope)
- `GridGuideOverlay` 렌더러를 CSS 배경 방식에서 SVG 패턴 방식으로 전환
- 셀 단위 `margin`, `gradient`, `dashed stroke` 적용
- `handleNodeDrag`의 stage 확장 로직을 함수형 업데이트 기반으로 안정화
- `visibleStage` 변경 시 오버레이 크기 즉시 동기화
- 타입/빌드 검증 및 수동 동작 검증

## 범위 (Out of Scope)
- 도킹 히스테리시스, `lastValidDock` 등 M2 범위 개선
- Zoom 정책(`minZoom`, `maxZoom`) 재설계
- 새로운 노드 타입/편집 UX 추가

## 구현 단계

### 1. Overlay API 정리
- `GridGuideOverlay` 입력값(`stage`)과 렌더 책임 명확화
- 셀 스타일 상수(`CELL_MARGIN`, dash, color stop 등) 초깃값 정의

완료 기준
- 오버레이 컴포넌트 단독으로 stage 크기 기반 렌더가 가능

### 2. SVG Pattern 전환
- `<svg><defs><pattern/></defs></svg>` 구조 도입
- 패턴 타일 내부에 셀 `rect`를 그리고 `gradient fill + dashed stroke` 적용
- 전체 stage 영역은 패턴 채움 `rect`로 렌더

완료 기준
- 드래그 가이드가 기존 위치/레이어(`absolute`, `pointer-events-none`)에서 동일하게 표시
- 셀 단위 스타일(마진/그라디언트/대시)이 시각적으로 확인

### 3. Drag 확장 로직 통합
- `handleNodeDrag`를 `setVisibleStage((prev) => ...)` 형태로 변경
- `isNodeOutsideStage(node.position, prev)` 기준으로 다음 stage 결정
- stage 역행/중복 업데이트가 없도록 `getNextStage` 특성 확인

완료 기준
- 경계 밖 드래그 시 stage가 `4x4 -> 7x7 -> 10x10`으로만 확장
- 확장 중 가이드 오버레이 크기가 즉시 따라옴

### 4. 경계 시나리오 검증
- 빠른 연속 드래그에서 가이드 깜빡임/끊김 여부 확인
- 최대 stage 도달 이후 불필요한 업데이트 여부 확인
- drag stop 시 클램프/가이드 숨김 동작 회귀 점검

완료 기준
- 기존 노드 이동/스냅/클램프 UX 회귀 없음

### 5. 빌드 및 완료 체크
- `pnpm build`로 타입체크 포함 검증
- 변경 파일 최소화 및 코드 리뷰 포인트 정리

완료 기준
- 빌드 통과, 핵심 수동 시나리오 통과

## 검증 체크리스트
- [ ] 드래그 중에만 가이드가 표시된다.
- [ ] 경계 밖 드래그 시 다음 stage로 자동 확장된다.
- [ ] stage 확장 시 오버레이 크기가 지연 없이 동기화된다.
- [ ] 셀별 margin/gradient/dashed 스타일이 적용된다.
- [ ] `pnpm build`가 통과한다.

## 리스크와 대응
- 리스크: SVG 패턴 렌더로 인한 성능 저하 가능성
- 대응: 패턴 타일을 단순 도형 1개 기준으로 유지하고 불필요한 DOM 증가를 방지

- 리스크: 드래그 이벤트 타이밍과 stage state의 불일치
- 대응: 함수형 state 업데이트 사용, 조건 판정은 항상 최신 `prev` 기준으로 계산

- 리스크: 시각 스타일 변경으로 기존 UX 대비 대비감/가독성 저하
- 대응: 색상/투명도/대시 길이를 상수화하고 빠르게 튜닝 가능하게 구성
