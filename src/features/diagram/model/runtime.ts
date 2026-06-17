import type { Edge } from "@xyflow/react";
import { getNodeSpan } from "../lib/blockSpan";
import { createDockedNodeState } from "../lib/docking";
import type { DockedNodeState } from "../lib/geometry";
import { DEFAULT_GRID_DIMENSIONS } from "../lib/grid";
import type { DiagramNode } from "./nodeTypes";

export type RuntimeNodeDockingState = Record<string, DockedNodeState>;

export type CanvasRuntimeState = {
	nodes: DiagramNode[];
	edges: Edge[];
	nodeDockingState: RuntimeNodeDockingState;
};

export function createRuntimeNodeDockingState(
	nodes: DiagramNode[],
): RuntimeNodeDockingState {
	return Object.fromEntries(
		nodes.map((node) => [
			node.id,
			createDockedNodeState(
				node.position,
				getNodeSpan(node.data.blockType),
				DEFAULT_GRID_DIMENSIONS,
			),
		]),
	);
}

export function createInitialCanvasRuntimeState(): CanvasRuntimeState {
	return {
		nodes: [],
		edges: [],
		nodeDockingState: {},
	};
}
