import { useConnection } from "@xyflow/react";
import { getNodeSpan } from "../../lib/blockSpan";
import { resolveEdgeDropPosition } from "../../lib/edge";
import type { getGridOccupancy } from "../../lib/grid";
import type { DiagramNode } from "../../model/nodeTypes";
import type { CanvasRuntimeState } from "../../model/runtime";
import DropPreviewBox from "./DropPreviewBox";

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

	return <DropPreviewBox position={position} span={getNodeSpan("menu")} />;
}
