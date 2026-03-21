import type { Edge } from "@xyflow/react";
import { createDockedNodeState } from "../lib/docking";
import { clampPositionToStage, GRID_STAGES } from "../lib/grid";
import type { DiagramNode, DockedNodeState, GridStage } from "../lib/type";
import { createDefaultBlockData } from "./block";
import {
	type CanvasDocument,
	type NodeItem,
	parseCanvasDocument,
} from "./document";

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
const INITIAL_STAGE = GRID_STAGES[0];

const initialEdges: Edge[] = [
	// {
	// 	id: "edge-1-2",
	// 	source: "node-1",
	// 	target: "node-2",
	// 	type: "smoothstep",
	// 	markerEnd: {
	// 		type: MarkerType.ArrowClosed,
	// 	},
	// },
];
const initialNodes: NodeItem[] = [
	{
		id: "node-1",
		type: "menu",
		position: clampPositionToStage({ x: 0, y: 0 }, INITIAL_STAGE),
		data: createDefaultBlockData("menu", ""),
	},
];
const initialDocument: CanvasDocument = {
	visibleStage: INITIAL_STAGE,
	nodes: initialNodes,
	edges: initialEdges,
};

export function createInitialCanvasRuntimeState(): CanvasRuntimeState {
	const parsedDocument = parseCanvasDocument(initialDocument);

	if (!parsedDocument) {
		throw new Error("초기 캔버스 문서를 파싱할 수 없습니다.");
	}

	return {
		nodes: parsedDocument.nodes,
		edges: parsedDocument.edges,
		visibleStage: parsedDocument.visibleStage,
		nodeDockingState: createRuntimeNodeDockingState(
			parsedDocument.nodes,
			parsedDocument.visibleStage,
		),
	};
}
