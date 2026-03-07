import { ReactFlowProvider } from "@xyflow/react";
import { CanvasCoreInner } from "./CanvasCoreInner";

export default function CanvasCore() {
	return (
		<ReactFlowProvider>
			<CanvasCoreInner />
		</ReactFlowProvider>
	);
}
