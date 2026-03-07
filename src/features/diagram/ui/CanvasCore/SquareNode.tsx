import { Handle, type Node, type NodeProps, Position } from "@xyflow/react";
import { type DiagramNodeData, NODE_SIZE } from "../../lib/grid";

export default function SquareNode({ data }: NodeProps<Node<DiagramNodeData>>) {
	return (
		<div
			className="border border-gray-700 bg-green text-[12px] text-gray-900"
			style={{ width: NODE_SIZE, height: NODE_SIZE }}
		>
			<Handle type="target" isConnectable position={Position.Top} id="top" />
			<Handle
				type="source"
				isConnectable
				position={Position.Bottom}
				id="bottom"
			/>
			<Handle type="target" isConnectable position={Position.Left} id="left" />
			<Handle
				type="source"
				isConnectable
				position={Position.Right}
				id="right"
			/>
			<div className="flex h-full items-center justify-center p-1 text-center leading-tight">
				{data.label}
			</div>
		</div>
	);
}
