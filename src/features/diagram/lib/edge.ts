import type { DiagramNode } from "../model/nodeTypes";
import { getNodeSpan } from "./blockSpan";
import { resolveDropPosition } from "./docking";
import type { GridOccupancy, GridStage, XYPosition } from "./geometry";
import { getNodeCenterPosition } from "./grid";

type ResolveMenuNodeDropPositionInput = {
	position: XYPosition;
	stage: GridStage;
	occupancy: GridOccupancy;
};

export type DirectionalHandleId = "top" | "bottom" | "left" | "right";

export function resolveEdgeDropPosition({
	position,
	stage,
	occupancy,
}: ResolveMenuNodeDropPositionInput): XYPosition | null {
	const resolution = resolveDropPosition({
		position,
		stage,
		occupancy,
		span: getNodeSpan("menu"),
		lastValidDock: null,
	});

	return resolution.cell ? resolution.position : null;
}

export function resolveEdgeDropTargetHandle(
	sourceNode: DiagramNode,
	targetPosition: XYPosition,
): DirectionalHandleId | null {
	const sourceCenter = getNodeCenterPosition(
		sourceNode.position,
		getNodeSpan(sourceNode.data.blockType),
	);
	const targetCenter = getNodeCenterPosition(
		targetPosition,
		getNodeSpan("menu"),
	);

	if (targetCenter.x > sourceCenter.x) return "left";
	if (targetCenter.x < sourceCenter.x) return "right";
	if (targetCenter.y > sourceCenter.y) return "top";
	if (targetCenter.y < sourceCenter.y) return "bottom";

	return null;
}

export function resolveEdgeDropConnectionHandles(
	sourceNode: DiagramNode,
	targetPosition: XYPosition,
	fallbackSourceHandle: string | null,
): {
	sourceHandle: string | null;
	targetHandle: DirectionalHandleId | null;
} {
	const sourceCenter = getNodeCenterPosition(
		sourceNode.position,
		getNodeSpan(sourceNode.data.blockType),
	);
	const targetCenter = getNodeCenterPosition(
		targetPosition,
		getNodeSpan("menu"),
	);

	if (targetCenter.x === sourceCenter.x && targetCenter.y > sourceCenter.y) {
		return { sourceHandle: "bottom", targetHandle: "top" };
	}

	if (targetCenter.x === sourceCenter.x && targetCenter.y < sourceCenter.y) {
		return { sourceHandle: "top", targetHandle: "bottom" };
	}

	return {
		sourceHandle: fallbackSourceHandle,
		targetHandle: resolveEdgeDropTargetHandle(sourceNode, targetPosition),
	};
}
