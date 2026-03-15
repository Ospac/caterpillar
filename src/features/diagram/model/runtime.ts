import type { Edge } from "@xyflow/react";
import type { DiagramNode, DockedNodeState, GridStage } from "../lib/type";
import { createDockedNodeState } from "../lib/docking";

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
		nodes.map((node) => [node.id, createDockedNodeState(node.position, stage)]),
	);
}
