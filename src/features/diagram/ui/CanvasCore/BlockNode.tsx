import { Handle, type Node, type NodeProps, Position } from "@xyflow/react";
import templateImage from "assets/frankenstein.webp";
import coverArtImage from "assets/ppqq.jpg";

import { Fragment, type JSX, useState } from "react";
import { NODE_SIZE } from "../../lib/grid";
import type { BlockData, BlockNodeData } from "../../model/type";
import BlockEditForm from "./BlockEditForm";

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
				<div className="flex h-full text-center leading-tight p-4 overflow-y-scroll">
					{data.text}
				</div>
			);
		case "image":
			return (
				<div className="h-full p-2.5">
					<figure>
						<img
							className="outline-2 outline-purple-600"
							src={data.imageUrl || templateImage}
							alt={data.alt}
						/>
						<figcaption className="text-center mt-1.5">{data.title}</figcaption>
					</figure>
				</div>
			);
		case "link":
			return (
				<div className="flex flex-col h-full">
					<img
						className="shrink min-h-0 h-40"
						src={templateImage}
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
							{data.artist}
						</p>
					</div>
					<div>
						<img
							className="w-full h-full object-cover"
							src={data.albumArt || coverArtImage}
							alt={data.title}
						/>
					</div>
					<div className="col-span-2 flex items-center bg-blue border-t border-gray-700 px-5">
						<h2 className="text-2xs">
							{data.artist} - {data.title}
						</h2>
					</div>
				</div>
			);
		case "game":
			return (
				<div className="flex flex-col h-full">
					{data.coverUrl && (
						<img
							className="w-full h-32 object-cover"
							src={data.coverUrl}
							alt={data.title}
						/>
					)}
					<div className="flex flex-col flex-1 justify-center items-center p-3 gap-1">
						<p className="font-medium text-center">{data.title || "Game"}</p>
						{data.releaseYear && (
							<p className="text-2xs text-gray-600">{data.releaseYear}</p>
						)}
					</div>
				</div>
			);
		case "movie":
			return (
				<div className="flex flex-col h-full">
					{data.posterUrl && (
						<img
							className="w-full h-32 object-cover"
							src={data.posterUrl}
							alt={data.title}
						/>
					)}
					<div className="flex flex-col flex-1 justify-center items-center p-3 gap-1">
						<p className="font-medium text-center">{data.title || "Movie"}</p>
						{data.releaseYear && (
							<p className="text-2xs text-gray-600">{data.releaseYear}</p>
						)}
					</div>
				</div>
			);
		case "book":
			return (
				<div className="flex flex-col h-full">
					{data.coverUrl && (
						<img
							className="w-full h-32 object-cover"
							src={data.coverUrl}
							alt={data.title}
						/>
					)}
					<div className="flex flex-col flex-1 justify-center items-center p-3 gap-1">
						<p className="font-medium text-center">{data.title || "Book"}</p>
						{data.author && (
							<p className="text-2xs text-gray-600">{data.author}</p>
						)}
					</div>
				</div>
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
	const [isEditing, setIsEditing] = useState(false);

	const startEdit = () => {
		setIsEditing(true);
		data.onEditStart?.();
	};

	const endEdit = () => {
		setIsEditing(false);
		data.onEditEnd?.();
	};

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: React Flow 노드 — 클릭으로 편집 진입
		// biome-ignore lint/a11y/useKeyWithClickEvents: React Flow 캔버스는 마우스 인터랙션 기반
		<div
			className={containerClass(data.blockType)}
			style={{ width: NODE_SIZE, height: NODE_SIZE }}
			onClick={!isEditing ? startEdit : undefined}
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
