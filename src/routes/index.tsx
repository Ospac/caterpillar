import { createFileRoute } from "@tanstack/react-router";
import CanvasCore from "../features/diagram/ui/CanvasCore/CanvasCore";

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

function HomeComponent() {
	return (
		<div className="h-[calc(100vh-56px)] p-3">
			<CanvasCore />
		</div>
	);
}
