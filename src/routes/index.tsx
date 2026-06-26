import { createFileRoute } from "@tanstack/react-router";
import { CanvasCore } from "@/features/diagram/ui/CanvasCore";

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

function HomeComponent() {
	return (
		<main className="h-full">
			<CanvasCore />
		</main>
	);
}
