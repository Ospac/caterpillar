# M1-1: SVG Grid Guide Overlay

## 배경
`GridGuideOverlay`가 CSS `backgroundImage` 반복 패턴으로 격자를 렌더링하는데,
셀 단위 `margin`, `dashed border`, `gradient fill`을 제어하기 어려운 구조적 제약이 있다.
SVG `<pattern>` 기반으로 전환해 셀 단위 스타일 자유도를 확보한다.

## 범위

**In Scope**
- `GridGuideOverlay` 렌더러: CSS 배경 → SVG 패턴 전환
- 셀 단위 `margin`, `gradient`, `dashed stroke` 적용
- `handleNodeDrag`의 stage 확장 로직을 함수형 업데이트로 안정화
- `visibleStage` 변경 시 오버레이 크기 즉시 동기화

**Out of Scope**
- 도킹 히스테리시스/`lastValidDock` 개선 (M2)
- Zoom 정책 재설계
- 새 노드 타입/편집 UX

## 구현 단계

### 1. Overlay API 정리
- `GridGuideOverlay` 입력값(`stage`) 및 렌더 책임 명확화
- 셀 스타일 상수 정의: `CELL_MARGIN`, dash, color stop 초깃값

### 2. SVG Pattern 전환
```tsx
<svg>
  <defs>
    <pattern id="grid-pattern" ...>
      <rect fill="url(#gradient)" stroke="dashed" ... />
    </pattern>
  </defs>
  <rect fill="url(#grid-pattern)" width={stageWidth} height={stageHeight} />
</svg>
```
- 위치/레이어: `absolute`, `pointer-events-none` 유지

### 3. Drag 확장 로직 통합
```ts
setVisibleStage((prev) => {
  if (isNodeOutsideStage(node.position, prev)) return getNextStage(prev);
  return prev;
});
```
- `prev` 기준 조건 판정으로 중복 업데이트 방지

### 4. 경계 시나리오 검증
- 빠른 연속 드래그 시 가이드 깜빡임/끊김 확인
- 최대 stage 이후 불필요한 업데이트 여부 확인
- drag stop 후 클램프/가이드 숨김 회귀 점검

### 5. 빌드 검증
- `pnpm build` 통과

## 검증 체크리스트
- [ ] 드래그 중에만 가이드가 표시된다
- [ ] 경계 밖 드래그 시 다음 stage로 자동 확장된다
- [ ] stage 확장 시 오버레이 크기가 지연 없이 동기화된다
- [ ] 셀별 margin/gradient/dashed 스타일이 적용된다
- [ ] `pnpm build` 통과
