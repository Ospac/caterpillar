import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

function HomeComponent() {
	return (
		<div className="h-[calc(100vh-56px)] p-3">
			{/* <ReactFlowProvider></ReactFlowProvider> */}
		</div>
	);
}
