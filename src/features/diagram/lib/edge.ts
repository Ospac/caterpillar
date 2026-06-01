import type { DiagramNode } from "../model/nodeTypes";
import { getNodeSpan } from "./blockSpan";
import { isDockableForSpan } from "./docking";
import type {
	CellCoord,
	GridOccupancy,
	GridStage,
	NodeSpan,
	XYPosition,
} from "./geometry";
import { CELL_SIZE, cellCoordToPosition, getNodeCenterPosition } from "./grid";

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

function positionToEdgeDropAnchorCell(
	position: XYPosition,
	stage: GridStage,
	span: NodeSpan,
): CellCoord | null {
	const cell = {
		col: Math.floor((position.x - Number.EPSILON) / CELL_SIZE),
		row: Math.floor((position.y - Number.EPSILON) / CELL_SIZE),
	};

	if (cell.col < 0 || cell.row < 0) {
		return null;
	}

	if (cell.col + span.cols > stage || cell.row + span.rows > stage) {
		return null;
	}

	return cell;
}

export function resolveEdgeDropPosition({
	position,
	stage,
	occupancy,
}: ResolveMenuNodeDropPositionInput): XYPosition | null {
	const span = getNodeSpan("menu");
	const cell = positionToEdgeDropAnchorCell(position, stage, span);

	if (!cell || !isDockableForSpan(cell, span, occupancy, stage)) {
		return null;
	}

	return cellCoordToPosition(cell);
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
