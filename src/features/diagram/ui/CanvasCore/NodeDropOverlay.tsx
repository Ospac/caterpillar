import { useStore } from "@xyflow/react";
import { getNodeSpan } from "../../lib/blockSpan";
import { resolveDropPosition } from "../../lib/docking";
import type { getGridOccupancy } from "../../lib/grid";
import type { DiagramNode } from "../../model/nodeTypes";
import type {
	CanvasRuntimeState,
	RuntimeNodeDockingState,
} from "../../model/runtime";
import DropPreviewBox from "./DropPreviewBox";

export default function NodeDropOverlay({
	isEditMode,
	nodeDockingState,
	occupancy,
	visibleStage,
}: {
	isEditMode: boolean;
	nodeDockingState: RuntimeNodeDockingState;
	occupancy: ReturnType<typeof getGridOccupancy>;
	visibleStage: CanvasRuntimeState["visibleStage"];
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
		stage: visibleStage,
		occupancy,
		span,
		ignoreNodeId: draggingNode.id,
		lastValidDock: nodeDockingState[draggingNode.id]?.lastValidDock ?? null,
	});

	return <DropPreviewBox position={resolution.position} span={span} />;
}
