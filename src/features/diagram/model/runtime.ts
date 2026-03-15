import type { Edge, Viewport } from "@xyflow/react";
import type { DiagramNode, DockedNodeState, GridStage } from "../lib/type";

export type RuntimeNodeDockingState = Record<string, DockedNodeState>;

export type CanvasRuntimeState = {
	nodes: DiagramNode[];
	edges: Edge[];
	visibleStage: GridStage;
	nodeDockingState: RuntimeNodeDockingState;
	viewport: Viewport | null;
};
