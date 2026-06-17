import { useStore } from "@xyflow/react";
import { getNodeSpan } from "../../lib/blockSpan";
import { resolveDropPosition } from "../../lib/docking";
import { DEFAULT_GRID_DIMENSIONS, type getGridOccupancy } from "../../lib/grid";
import type { DiagramNode } from "../../model/nodeTypes";
import type { RuntimeNodeDockingState } from "../../model/runtime";
import DropPreviewBox from "./DropPreviewBox";

export default function NodeDropOverlay({
	isEditMode,
	nodeDockingState,
	occupancy,
}: {
	isEditMode: boolean;
	nodeDockingState: RuntimeNodeDockingState;
	occupancy: ReturnType<typeof getGridOccupancy>;
}) {
	const draggingNode = useStore((state) => {
		for (const node of state.nodeLookup.values()) {
			if (node.dragging) {
				return node as unknown as DiagramNode;
			}
		}
		return null;
	});

	if (!isEditMode || !draggingNode) {
		return null;
	}

	const span = getNodeSpan(draggingNode.data.blockType);
	const resolution = resolveDropPosition({
		position: draggingNode.position,
		gridDimensions: DEFAULT_GRID_DIMENSIONS,
		occupancy,
		span,
		ignoreNodeId: draggingNode.id,
		lastValidDock: nodeDockingState[draggingNode.id]?.lastValidDock ?? null,
	});

	return <DropPreviewBox position={resolution.position} span={span} />;
}
