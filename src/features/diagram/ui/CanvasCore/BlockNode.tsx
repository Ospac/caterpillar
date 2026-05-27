import { Handle, type Node, type NodeProps, Position } from "@xyflow/react";
import { Fragment, type JSX, useEffect, useState } from "react";
import defaultImage from "@/assets/frankenstein.webp";
import { getNodeSpan } from "../../lib/blockSpan";
import { CELL_SIZE } from "../../lib/grid";
import type { BlockData, BlockType } from "../../model/blockTypes";
import type { BlockNodeData } from "../../model/nodeTypes";
import BlockEditForm from "./BlockEditForm";

const SEARCH_EDIT_SPAN = { cols: 2, rows: 4 } as const;
const SEARCH_BLOCK_TYPES = new Set<BlockType>([
	"music",
	"game",
	"movie",
	"book",
]);

function NodeHandles() {
	return (
		<Fragment>
			<Handle type="source" position={Position.Top} id="top" />
			<Handle type="source" position={Position.Bottom} id="bottom" />
			<Handle type="source" position={Position.Left} id="left" />
			<Handle type="source" position={Position.Right} id="right" />
		</Fragment>
	);
}
interface RectangleBlockViewProps {
	image?: string;
	title?: string;
	secondary?: string;
	year?: string;
}
function RectangleBlockView({
	image,
	title,
	secondary,
	year,
}: RectangleBlockViewProps) {
	return (
		<div className="flex flex-col h-full">
			{image && (
				<img
					className="w-full h-40 object-cover border-b border-b-gray-400"
					src={image}
					alt={title}
				/>
			)}
			<div className="flex flex-col flex-1 justify-center items-center p-1 gap-1">
				<p className="font-medium text-center text-2xs">{title}</p>
				<p className="font-medium text-center text-2xs text-gray-500">
					{secondary}
					{year ? ` (${year})` : ""}
				</p>
			</div>
		</div>
	);
}
function containerClass(blockType: string): string {
	switch (blockType) {
		case "image":
		case "link":
			return "border border-gray-700 bg-green-100 text-xs text-gray-900";
		default:
			return "border border-gray-700 bg-green text-xs text-gray-900";
	}
}

function BlockView({ data }: { data: BlockData }): JSX.Element {
	switch (data.blockType) {
		case "text":
			return (
				<div className="flex h-full text-center leading-tight p-4 overflow-y-auto break-all">
					{data.text}
				</div>
			);
		case "image":
			return (
				<div className="h-full p-2.5">
					<figure>
						<img
							className="border border-gray-700"
							src={data.image || defaultImage}
							alt={data.caption}
						/>
						<figcaption className="text-center mt-1.5 text-xs">
							{data.caption}
						</figcaption>
					</figure>
				</div>
			);
		case "link":
			return (
				<div className="flex flex-col h-full">
					<img
						className="shrink min-h-0 h-40"
						src={defaultImage}
						alt={data.title}
					/>
					<div className="flex flex-row items-center gap-1.5 bg-green py-0.5 px-3 border-t border-t-gray-700 shrink-0">
						<div className="bg-red w-2.5 h-2.5" />
						<div className="text-2xs">{data.url || "URL"}</div>
					</div>
					<div className="shrink-0 bg-blue border-t border-t-gray-700 text-2xs py-2 px-4">
						{data.description || data.title}
					</div>
				</div>
			);
		case "music":
			return (
				<div className="grid grid-cols-[1.25rem_1fr] grid-rows-[1fr_1.25rem]">
					<div className="flex items-end justify-center py-2 border-r">
						<p className="[writing-mode:vertical-rl] rotate-180 text-2xs">
							{data.title?.slice(0, 20)}
						</p>
					</div>
					<div>
						<img
							className="w-full h-full object-cover"
							src={data.image || defaultImage}
							alt={data.title}
						/>
					</div>
					<div className="col-span-2 flex items-center bg-blue border-t border-gray-700 px-4">
						<h2 className="text-2xs">{data.secondary?.slice(0, 20)}</h2>
					</div>
				</div>
			);
		case "game":
			return (
				<RectangleBlockView
					image={data.image}
					title={data.title}
					year={data.year}
				/>
			);
		case "movie":
			return (
				<RectangleBlockView
					image={data.image}
					title={data.title}
					year={data.year}
				/>
			);
		case "book":
			return (
				<RectangleBlockView
					image={data.image}
					title={data.title}
					secondary={data.secondary}
					year={data.year}
				/>
			);
		default:
			return (
				<div className="flex h-full items-center justify-center p-4 text-2xs text-gray-400">
					알 수 없는 블록 타입
				</div>
			);
	}
}

export default function BlockNode({ data }: NodeProps<Node<BlockNodeData>>) {
	const [isEditing, setIsEditing] = useState(data.initialEditing ?? false);
	const { onEditStateChange } = data;
	const startEdit = () => {
		setIsEditing(true);
	};
	const endEdit = () => {
		setIsEditing(false);
	};
	const nothing = () => {};

	const handleClick = !isEditing ? startEdit : nothing;

	const onKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && e.shiftKey) {
			return;
		}
		if (e.key === "Enter") {
			handleClick();
			return;
		}
	};
	useEffect(() => {
		onEditStateChange?.(isEditing);
	}, [isEditing, onEditStateChange]);

	const span =
		isEditing && SEARCH_BLOCK_TYPES.has(data.blockType)
			? SEARCH_EDIT_SPAN
			: getNodeSpan(data.blockType);

	return (
		// biome-ignore lint/a11y/useSemanticElements: <ReactFlow BlockNode>
		<div
			tabIndex={0}
			className={`${containerClass(data.blockType)}`}
			style={{ width: span.cols * CELL_SIZE, height: span.rows * CELL_SIZE }}
			onClick={handleClick}
			onKeyDown={onKeyDown}
			role={"button"}
		>
			<NodeHandles />
			{isEditing ? (
				<BlockEditForm
					data={data}
					onDataChange={(newData) => data.onDataChange?.(newData)}
					onEditEnd={endEdit}
				/>
			) : (
				<BlockView data={data as BlockData} />
			)}
		</div>
	);
}
