import type { Node, NodeProps } from "@xyflow/react";
import { useEffect, useState } from "react";
import { getNodeSpan } from "@/diagram/lib/blockSpan";
import { CELL_SIZE } from "@/diagram/lib/grid";
import type { BlockData, BlockType } from "@/diagram/model/blockTypes";
import { useCanvasStore } from "@/diagram/model/canvasStore";
import type { BlockNodeData } from "@/diagram/model/nodeTypes";
import { NodeHandles } from "../NodeHandles";
import { BlockEditForm } from "./BlockEditForm";
import { BlockView } from "./BlockView";

const SEARCH_EDIT_SPAN = { cols: 2, rows: 4 } as const;
const SEARCH_BLOCK_TYPES = new Set<BlockType>(["music", "game", "movie", "book"]);

function containerClass(blockType: string): string {
	switch (blockType) {
		case "image":
		case "link":
			return "box-shadow-border bg-green-100 text-xs text-gray-900 z-20";
		default:
			return "box-shadow-border bg-green text-xs text-gray-900 z-20";
	}
}

export function BlockNode({ id, data }: NodeProps<Node<BlockNodeData>>) {
	const canvasMode = useCanvasStore((state) => state.mode);
	const updateBlockData = useCanvasStore((state) => state.updateBlockData);
	const isCanvasEditMode = canvasMode === "edit";
	const [isEditing, setIsEditing] = useState((data.initialEditing ?? false) && isCanvasEditMode);

	const startEdit = () => {
		if (!isCanvasEditMode) return;
		setIsEditing(true);
	};
	const endEdit = () => setIsEditing(false);
	const handleClick = isEditing ? undefined : startEdit;

	const onKeyDown = (event: React.KeyboardEvent) => {
		if (event.key === "Enter" && !event.shiftKey) {
			startEdit();
		}
	};

	useEffect(() => {
		if (!isCanvasEditMode && isEditing) {
			setIsEditing(false);
		}
	}, [isCanvasEditMode, isEditing]);

	const span =
		isEditing && SEARCH_BLOCK_TYPES.has(data.blockType)
			? SEARCH_EDIT_SPAN
			: getNodeSpan(data.blockType);

	return (
		// biome-ignore lint/a11y/useSemanticElements: 노드는 편집 폼을 포함하므로 button 요소를 사용할 수 없음
		<div
			tabIndex={0}
			className={containerClass(data.blockType)}
			style={{ width: span.cols * CELL_SIZE, height: span.rows * CELL_SIZE }}
			onClick={handleClick}
			onKeyDown={onKeyDown}
			role="button"
		>
			<NodeHandles />
			{isEditing ? (
				<BlockEditForm
					data={data}
					onDataChange={(newData) => updateBlockData(id, newData)}
					onEditEnd={endEdit}
				/>
			) : (
				<BlockView data={data as BlockData} />
			)}
		</div>
	);
}
