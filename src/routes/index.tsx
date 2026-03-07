import { createFileRoute } from "@tanstack/react-router";
import CanvasCore from "../features/diagram/ui/CanvasCore/CanvasCore";

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

/**
 * Renders the main diagram canvas inside a full-height, padded container.
 *
 * The container fills the viewport height minus 56px and applies consistent padding,
 * hosting the CanvasCore component.
 *
 * @returns The JSX element containing CanvasCore within the height-calculated, padded container.
 */
function HomeComponent() {
	return (
		<div className="h-[calc(100vh-56px)] p-3">
			<CanvasCore />
		</div>
	);
}
