import { Handle, type Node, type NodeProps, Position } from "@xyflow/react";
import { memo } from "react";
import { type DiagramNodeData, NODE_SIZE } from "../lib/grid";

function SquareNode({ data }: NodeProps<Node<DiagramNodeData>>) {
	return (
		<div
			className="rounded-md border border-gray-400 bg-white text-[12px] text-gray-900 shadow-sm"
			style={{ width: NODE_SIZE, height: NODE_SIZE }}
		>
			<Handle type="target" position={Position.Top} />
			<Handle type="source" position={Position.Bottom} />
			<Handle type="target" position={Position.Left} />
			<Handle type="source" position={Position.Right} />
			<div className="flex h-full items-center justify-center p-1 text-center leading-tight">
				{data.label}
			</div>
		</div>
	);
}

export default memo(SquareNode);
