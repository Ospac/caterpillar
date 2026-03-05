import { Handle, type NodeProps, Position } from "@xyflow/react";

import type { DiagramNode } from "../../model";

export function TextNode({ data, selected }: NodeProps<DiagramNode>) {
	return (
		<div
			className={`relative h-36 w-36 rounded-lg border bg-white p-3 text-sm shadow-sm transition-colors ${
				selected ? "border-blue-500" : "border-slate-300"
			}`}
		>
			<Handle type="target" position={Position.Top} />
			<Handle type="source" position={Position.Right} />
			<Handle type="source" position={Position.Bottom} />
			<Handle type="target" position={Position.Left} />

			<div className="flex h-full flex-col justify-between">
				<div className="text-xs uppercase tracking-wide text-slate-500">
					{data.blockType}
				</div>
				<div className="line-clamp-3 text-center font-medium text-slate-800">
					{data.label}
				</div>
			</div>
		</div>
	);
}
