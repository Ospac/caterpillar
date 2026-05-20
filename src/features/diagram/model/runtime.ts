import type { Edge } from "@xyflow/react";
import { getNodeSpan } from "../lib/blockSpan";
import { createDockedNodeState } from "../lib/docking";
import type { DockedNodeState, GridStage } from "../lib/geometry";
import { GRID_STAGES } from "../lib/grid";
import type { DiagramNode } from "./nodeTypes";

export type RuntimeNodeDockingState = Record<string, DockedNodeState>;

export type CanvasRuntimeState = {
	nodes: DiagramNode[];
	edges: Edge[];
	visibleStage: GridStage;
	nodeDockingState: RuntimeNodeDockingState;
};

export function createRuntimeNodeDockingState(
	nodes: DiagramNode[],
	stage: GridStage,
): RuntimeNodeDockingState {
	return Object.fromEntries(
		nodes.map((node) => [
			node.id,
			createDockedNodeState(
				node.position,
				stage,
				getNodeSpan(node.data.blockType),
			),
		]),
	);
}
const INITIAL_STAGE = GRID_STAGES[0];

export function createInitialCanvasRuntimeState(): CanvasRuntimeState {
	return {
		nodes: [],
		edges: [],
		visibleStage: INITIAL_STAGE,
		nodeDockingState: {},
	};
}
