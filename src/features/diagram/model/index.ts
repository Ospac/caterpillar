import type { Edge, Node, XYPosition } from "@xyflow/react";

export type BlockNodeType = "textNode";

export type NodeData = {
	blockType: "text";
	label: string;
};

export type DiagramNode = Node<NodeData, BlockNodeType>;
export type DiagramEdge = Edge;

const INITIAL_NODE_COUNT = 2;

export const initialNodes: DiagramNode[] = [
	{
		id: "node-1",
		type: "textNode",
		position: { x: 120, y: 120 },
		data: { blockType: "text", label: "첫 번째 텍스트 블록" },
	},
	{
		id: "node-2",
		type: "textNode",
		position: { x: 480, y: 260 },
		data: { blockType: "text", label: "두 번째 텍스트 블록" },
	},
];

export const initialEdges: DiagramEdge[] = [
	{
		id: "edge-1",
		source: "node-1",
		target: "node-2",
	},
];

export function createTextNode(id: string, position: XYPosition): DiagramNode {
	const nodeNumber = Number(id.replace("node-", "")) || INITIAL_NODE_COUNT + 1;

	return {
		id,
		type: "textNode",
		position,
		data: {
			blockType: "text",
			label: `새 텍스트 블록 ${nodeNumber}`,
		},
	};
}

export function getInitialNodeSequence(nodes: DiagramNode[]): number {
	return (
		nodes.reduce((maxValue, node) => {
			const nodeNumber = Number(node.id.replace("node-", ""));
			if (Number.isNaN(nodeNumber)) {
				return maxValue;
			}

			return Math.max(maxValue, nodeNumber);
		}, 0) + 1
	);
}
