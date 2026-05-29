import type { DiagramNode } from "../model/nodeTypes";
import { getNodeSpan } from "./blockSpan";
import { DROP_REASONS, resolveDropPosition } from "./docking";
import type { GridOccupancy, GridStage, XYPosition } from "./geometry";
import { getNodeCenterPosition } from "./grid";

type ResolveMenuNodeDropPositionInput = {
	position: XYPosition;
	stage: GridStage;
	occupancy: GridOccupancy;
};

export type DirectionalHandleId = "top" | "bottom" | "left" | "right";

export function getClientPosition(event: MouseEvent | TouchEvent) {
	if ("changedTouches" in event) {
		const touch = event.changedTouches[0];
		return touch ? { x: touch.clientX, y: touch.clientY } : null;
	}

	return { x: event.clientX, y: event.clientY };
}

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

	if (resolution.reason !== DROP_REASONS.validDock || resolution.usedFallback) {
		return null;
	}

	return resolution.position;
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
