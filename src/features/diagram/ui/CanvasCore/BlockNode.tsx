import { Handle, type Node, type NodeProps, Position } from "@xyflow/react";
import { NODE_SIZE } from "../../lib/grid";
import type { DiagramNodeData } from "../../lib/type";

export default function BlockNode({ data }: NodeProps<Node<DiagramNodeData>>) {
	return (
		<div
			className="border border-gray-700 bg-green text-[12px] text-gray-900"
			style={{ width: NODE_SIZE, height: NODE_SIZE }}
		>
			<Handle type="source" position={Position.Top} id="top" />
			<Handle type="source" position={Position.Bottom} id="bottom" />
			<Handle type="source" position={Position.Left} id="left" />
			<Handle type="source" position={Position.Right} id="right" />
			<div className="flex h-full items-center justify-center p-1 text-center leading-tight">
				{data.title}
			</div>
		</div>
	);
}
