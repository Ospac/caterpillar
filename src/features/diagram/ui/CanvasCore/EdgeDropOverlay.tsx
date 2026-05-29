import { useConnection, ViewportPortal } from "@xyflow/react";
import { getNodeSpan } from "../../lib/blockSpan";
import { resolveEdgeDropPosition } from "../../lib/edge";
import { CELL_SIZE, type getGridOccupancy } from "../../lib/grid";
import type { DiagramNode } from "../../model/nodeTypes";
import type { CanvasRuntimeState } from "../../model/runtime";

export default function EdgeDropPreview({
	isEditMode,
	occupancy,
	visibleStage,
}: {
	isEditMode: boolean;
	occupancy: ReturnType<typeof getGridOccupancy>;
	visibleStage: CanvasRuntimeState["visibleStage"];
}) {
	const connection = useConnection<DiagramNode>();
	if (
		!isEditMode ||
		!connection.inProgress ||
		connection.isValid ||
		connection.toHandle
	) {
		return null;
	}

	const position = resolveEdgeDropPosition({
		position: connection.to,
		stage: visibleStage,
		occupancy,
	});
	if (!position) return null;

	const span = getNodeSpan("menu");

	return (
		<ViewportPortal>
			<div
				className="pointer-events-none absolute bg-purple-300/25"
				style={{
					width: span.cols * CELL_SIZE,
					height: span.rows * CELL_SIZE,
					transform: `translate(${position.x}px, ${position.y}px)`,
				}}
				aria-hidden="true"
			/>
		</ViewportPortal>
	);
}
