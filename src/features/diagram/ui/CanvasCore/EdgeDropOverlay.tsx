import { useConnection } from "@xyflow/react";
import { getNodeSpan } from "../../lib/blockSpan";
import { resolveEdgeDropPosition } from "../../lib/edge";
import { DEFAULT_GRID_DIMENSIONS, type getGridOccupancy } from "../../lib/grid";
import type { DiagramNode } from "../../model/nodeTypes";
import DropPreviewBox from "./DropPreviewBox";

export default function EdgeDropPreview({
	isEditMode,
	occupancy,
}: {
	isEditMode: boolean;
	occupancy: ReturnType<typeof getGridOccupancy>;
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
		gridDimensions: DEFAULT_GRID_DIMENSIONS,
		occupancy,
	});
	if (!position) return null;

	return <DropPreviewBox position={position} span={getNodeSpan("menu")} />;
}
