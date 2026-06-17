import { afterEach, beforeEach, describe, expect, it } from "@rstest/core";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useCanvasStore } from "../../model/canvasStore";
import Menu from ".";

function TestMenu() {
	return (
		<Menu
			occupiedCellCount={0}
			dockingCount={0}
			zoom={0.5}
			onZoomIn={() => {}}
			onZoomOut={() => {}}
			onZoomReset={() => {}}
		/>
	);
}

describe("Menu", () => {
	beforeEach(() => {
		const store = useCanvasStore.getState();
		store.loadDocument({ nodes: [], edges: [] });
		store.setMode("read");
	});

	afterEach(() => {
		cleanup();
	});

	it("read mode에서는 노드 추가 버튼을 비활성화한다", () => {
		render(<TestMenu />);

		expect((screen.getByText("Add Node") as HTMLButtonElement).disabled).toBe(
			true,
		);
	});

	it("edit mode에서는 노드를 추가한다", () => {
		const store = useCanvasStore.getState();
		store.setMode("edit");
		render(<TestMenu />);

		fireEvent.click(screen.getByText("Add Node"));

		expect(useCanvasStore.getState().nodes).toHaveLength(1);
	});

	it("zoom 버튼과 reset 버튼을 제공한다", () => {
		let zoomInCount = 0;
		let zoomOutCount = 0;
		let zoomResetCount = 0;

		render(
			<Menu
				occupiedCellCount={0}
				dockingCount={0}
				zoom={0.5}
				onZoomIn={() => zoomInCount++}
				onZoomOut={() => zoomOutCount++}
				onZoomReset={() => zoomResetCount++}
			/>,
		);

		expect(screen.getByText("50%")).toBeTruthy();
		fireEvent.click(screen.getByLabelText("Zoom in"));
		fireEvent.click(screen.getByLabelText("Zoom out"));
		fireEvent.click(screen.getByText("Reset"));

		expect(zoomInCount).toBe(1);
		expect(zoomOutCount).toBe(1);
		expect(zoomResetCount).toBe(1);
	});

	it("zoom 최소·최대에서는 해당 버튼을 비활성화한다", () => {
		const { rerender } = render(
			<Menu
				occupiedCellCount={0}
				dockingCount={0}
				zoom={0.2}
				onZoomIn={() => {}}
				onZoomOut={() => {}}
				onZoomReset={() => {}}
			/>,
		);

		expect(
			(screen.getByLabelText("Zoom out") as HTMLButtonElement).disabled,
		).toBe(true);

		rerender(
			<Menu
				occupiedCellCount={0}
				dockingCount={0}
				zoom={1}
				onZoomIn={() => {}}
				onZoomOut={() => {}}
				onZoomReset={() => {}}
			/>,
		);

		expect(
			(screen.getByLabelText("Zoom in") as HTMLButtonElement).disabled,
		).toBe(true);
	});
});
