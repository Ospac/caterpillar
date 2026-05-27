import { Handle, type Node, type NodeProps, Position } from "@xyflow/react";
import { CELL_SIZE } from "@/features/diagram/lib/grid";
import { useCanvasStore } from "../../model/canvasStore";
import type { MenuNodeData } from "../../model/nodeTypes";

const BLOCK_TYPE_BUTTONS = [
	{ blockType: "text", label: "Text", className: "bg-green" },
	{ blockType: "link", label: "Link", className: "bg-pink" },
	{ blockType: "image", label: "Picture", className: "bg-orange" },
	{ blockType: "game", label: "Game", className: "bg-blue" },
	{ blockType: "movie", label: "Movie", className: "bg-yellow" },
	{ blockType: "book", label: "Book", className: "bg-red" },
	{ blockType: "music", label: "Music", className: "bg-pinky" },
] as const;

export default function MenuNode({ id }: NodeProps<Node<MenuNodeData>>) {
	const mode = useCanvasStore((state) => state.mode);
	const selectMenuType = useCanvasStore((state) => state.selectMenuType);
	const isEditMode = mode === "edit";

	return (
		<div
			className="border border-gray-700 bg-white text-sm text-gray-900"
			style={{ width: CELL_SIZE * 2, height: CELL_SIZE * 2 }}
		>
			<Handle type="source" position={Position.Top} id="top" />
			<Handle type="source" position={Position.Bottom} id="bottom" />
			<Handle type="source" position={Position.Left} id="left" />
			<Handle type="source" position={Position.Right} id="right" />
			<div className="flex h-full flex-col items-center text-center *:flex-1 *:not-first:border-t">
				{BLOCK_TYPE_BUTTONS.map(({ blockType, label, className }) => (
					<button
						key={blockType}
						type="button"
						className={`${className} w-full`}
						disabled={!isEditMode}
						onClick={() => selectMenuType(id, blockType)}
					>
						{label}
					</button>
				))}
			</div>
		</div>
	);
}
