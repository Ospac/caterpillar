import { Handle, Position } from "@xyflow/react";
import { NODE_SIZE } from "../../lib/grid";

export default function MenuNode() {
	return (
		<div
			className="border border-gray-700 bg-green text-[12px] text-gray-900"
			style={{ width: NODE_SIZE, height: NODE_SIZE }}
		>
			<Handle type="source" position={Position.Top} id="top" />
			<Handle type="source" position={Position.Bottom} id="bottom" />
			<Handle type="source" position={Position.Left} id="left" />
			<Handle type="source" position={Position.Right} id="right" />
			<div className="flex flex-col h-full items-center text-center *:not-first:border-t *:flex-1 text-sm">
				<button type="button" className="bg-green w-full">
					Text
				</button>
				<button type="button" className="bg-pink w-full">
					Link
				</button>
				<button type="button" className="bg-orange w-full">
					Picture
				</button>
				<button type="button" className="bg-blue w-full">
					Game
				</button>
				<button type="button" className="bg-yellow w-full">
					Movie
				</button>
				<button type="button" className="bg-red w-full">
					Book
				</button>
				<button type="button" className="bg-pinky w-full">
					Music
				</button>
			</div>
		</div>
	);
}
