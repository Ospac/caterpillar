import {
	addEdge,
	applyEdgeChanges,
	applyNodeChanges,
	type Connection,
	type Edge,
	type EdgeChange,
	MarkerType,
	type NodeChange,
} from "@xyflow/react";

import type { BlockData } from "../../model/blockTypes";
import type { DiagramNode } from "../../model/nodeTypes";
import { isBlockNode } from "../../model/nodeTypes";

export type CanvasGraphState = {
	nodes: DiagramNode[];
	edges: Edge[];
};

export type CanvasGraphAction =
	| {
			type: "nodesChanged";
			changes: NodeChange<DiagramNode>[];
	  }
	| {
			type: "edgesChanged";
			changes: EdgeChange<Edge>[];
	  }
	| {
			type: "edgeConnected";
			connection: Connection;
	  }
	| {
			type: "edgeRemoved";
			edgeId: string;
	  }
	| {
			type: "blockDataChanged";
			nodeId: string;
			data: BlockData;
	  }
	| {
			type: "blockEditStateChanged";
			nodeId: string;
			isEditing: boolean;
	  }
	| {
			type: "nodePositionChanged";
			nodeId: string;
			position: DiagramNode["position"];
	  }
	| {
			type: "menuReplacedWithBlock";
			menuNodeId: string;
			node: DiagramNode;
	  }
	| {
			type: "nodeAdded";
			node: DiagramNode;
	  };

const EDITING_NODE_Z_INDEX = 1000;

export function createCanvasGraphState({
	nodes,
	edges,
}: CanvasGraphState): CanvasGraphState {
	return { nodes, edges };
}

export function canvasGraphReducer(
	state: CanvasGraphState,
	action: CanvasGraphAction,
): CanvasGraphState {
	switch (action.type) {
		case "nodesChanged":
			return {
				...state,
				nodes: applyNodeChanges(action.changes, state.nodes),
			};
		case "edgesChanged":
			return {
				...state,
				edges: applyEdgeChanges(action.changes, state.edges),
			};
		case "edgeConnected":
			return {
				...state,
				edges: addEdge(
					{
						...action.connection,
						type: "smoothstep",
						markerEnd: {
							type: MarkerType.ArrowClosed,
						},
					},
					state.edges,
				),
			};
		case "edgeRemoved":
			return {
				...state,
				edges: state.edges.filter((edge) => edge.id !== action.edgeId),
			};
		case "blockDataChanged":
			return {
				...state,
				nodes: state.nodes.map((node) => {
					if (node.id !== action.nodeId || !isBlockNode(node)) return node;
					return {
						...node,
						data: {
							...action.data,
							onDataChange: node.data.onDataChange,
							initialEditing: node.data.initialEditing,
							onEditStateChange: node.data.onEditStateChange,
						},
					};
				}),
			};
		case "blockEditStateChanged":
			return {
				...state,
				nodes: state.nodes.map((node) =>
					node.id === action.nodeId
						? {
								...node,
								zIndex: action.isEditing ? EDITING_NODE_Z_INDEX : undefined,
							}
						: node,
				),
			};
		case "nodePositionChanged":
			return {
				...state,
				nodes: state.nodes.map((node) =>
					node.id === action.nodeId
						? { ...node, position: action.position }
						: node,
				),
			};
		case "menuReplacedWithBlock":
			return {
				...state,
				nodes: [
					...state.nodes.filter((node) => node.id !== action.menuNodeId),
					action.node,
				],
			};
		case "nodeAdded":
			return {
				...state,
				nodes: [...state.nodes, action.node],
			};
	}
}
