import { afterEach, describe, expect, it, rstest } from "@rstest/core";
import { cleanup, render, screen } from "@testing-library/react";
import GridGuideOverlay from "./GridGuideOverlay";

rstest.mock("@xyflow/react", () => ({
	ViewportPortal: ({ children }: { children: React.ReactNode }) => children,
}));

describe("GridGuideOverlay", () => {
	afterEach(() => {
		cleanup();
	});

	it("visible=false면 grid guide를 렌더하지 않는다", () => {
		render(<GridGuideOverlay visible={false} />);

		expect(screen.queryByTestId("grid-guide-overlay")).toBeNull();
	});

	it("visible=true면 grid guide를 렌더한다", () => {
		render(<GridGuideOverlay visible={true} />);

		expect(screen.getByTestId("grid-guide-overlay")).toBeTruthy();
	});
});
