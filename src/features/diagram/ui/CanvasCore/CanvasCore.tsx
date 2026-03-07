import { ReactFlowProvider } from "@xyflow/react";
import { CanvasCoreInner } from "./CanvasCoreInner";

/**
 * Renders CanvasCoreInner wrapped with a React Flow provider so the inner canvas has access to React Flow context.
 *
 * @returns The JSX element containing a ReactFlowProvider that wraps CanvasCoreInner.
 */
export default function CanvasCore() {
	return (
		<ReactFlowProvider>
			<CanvasCoreInner />
		</ReactFlowProvider>
	);
}
