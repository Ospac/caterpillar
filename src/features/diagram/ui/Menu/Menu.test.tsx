import { afterEach, beforeEach, describe, expect, it } from "@rstest/core";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { CELL_SIZE } from "../../lib/grid";
import { useCanvasStore } from "../../model/canvasStore";
import Menu from ".";

function TestMenu() {
	const visibleStage = useCanvasStore((state) => state.visibleStage);

	return (
		<Menu visibleStage={visibleStage} occupiedCellCount={0} dockingCount={0} />
	);
}

describe("Menu", () => {
	beforeEach(() => {
		const store = useCanvasStore.getState();
		store.loadDocument({ visibleStage: 12, nodes: [], edges: [] });
		store.setMode("read");
	});

	afterEach(() => {
		cleanup();
	});

	it("read mode에서는 stage 변경 버튼을 비활성화한다", () => {
		render(<TestMenu />);

		expect(
			(screen.getByLabelText("18 by 18 stage") as HTMLButtonElement).disabled,
		).toBe(true);
	});

	it("edit mode에서는 큰 stage를 즉시 적용한다", () => {
		const store = useCanvasStore.getState();
		store.setMode("edit");
		render(<TestMenu />);

		fireEvent.click(screen.getByLabelText("18 by 18 stage"));

		expect(useCanvasStore.getState().visibleStage).toBe(18);
	});

	it("축소로 노드가 삭제되면 확인 후 적용한다", () => {
		const store = useCanvasStore.getState();
		store.loadDocument({
			visibleStage: 24,
			nodes: [
				{
					id: "outside",
					type: "block",
					position: { x: 12 * CELL_SIZE, y: 0 },
					data: { blockType: "text", text: "outside" },
				},
			],
			edges: [],
		});
		store.setMode("edit");
		render(<TestMenu />);

		fireEvent.click(screen.getByLabelText("12 by 12 stage"));

		expect(screen.getByText("스테이지를 축소할까요?")).toBeTruthy();
		expect(screen.getByText(/1개의 노드가 삭제됩니다/)).toBeTruthy();
		expect(useCanvasStore.getState().visibleStage).toBe(24);

		fireEvent.click(screen.getByText("취소"));
		expect(useCanvasStore.getState().visibleStage).toBe(24);

		fireEvent.click(screen.getByLabelText("12 by 12 stage"));
		fireEvent.click(screen.getByText("삭제 후 축소"));

		expect(useCanvasStore.getState().visibleStage).toBe(12);
		expect(useCanvasStore.getState().nodes).toEqual([]);
	});
});
