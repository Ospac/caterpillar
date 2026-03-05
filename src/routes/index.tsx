import { createFileRoute } from "@tanstack/react-router";
import { ReactFlowProvider } from "@xyflow/react";
import { DiagramCanvas } from "../features/diagram/ui";

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

function HomeComponent() {
	return (
		<div className="h-[calc(100vh-56px)] p-3">
			<ReactFlowProvider>
				<DiagramCanvas />
			</ReactFlowProvider>
		</div>
	);
}
