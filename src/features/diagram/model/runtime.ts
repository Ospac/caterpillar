import type { Edge } from "@xyflow/react";
import { createDockedNodeState } from "../lib/docking";
import { GRID_STAGES } from "../lib/grid";
import { getNodeSpan } from "../lib/span";
import type { DockedNodeState, GridStage } from "../lib/type";
import {
	type CanvasDocument,
	type NodeItem,
	parseCanvasDocument,
} from "./document";
import type { DiagramNode } from "./type";

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

const initialEdges: Edge[] = [];
const initialNodes: NodeItem[] = [];
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
