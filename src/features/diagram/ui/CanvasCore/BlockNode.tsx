import { Handle, type Node, type NodeProps, Position } from "@xyflow/react";
import templateImage from "assets/frankenstein.webp";
import coverArtImage from "assets/ppqq.jpg";

import { Fragment, type JSX } from "react";
import { NODE_SIZE } from "../../lib/grid";
import type { DiagramNodeData, MenuNodeData } from "../../model/type";

type BlockNodeData = Exclude<DiagramNodeData, MenuNodeData>;

function renderNodeHandle() {
	return (
		<Fragment>
			<Handle type="source" position={Position.Top} id="top" />
			<Handle type="source" position={Position.Bottom} id="bottom" />
			<Handle type="source" position={Position.Left} id="left" />
			<Handle type="source" position={Position.Right} id="right" />
		</Fragment>
	);
}
function renderBlockNode(data: BlockNodeData): JSX.Element {
	switch (data.blockType) {
		case "text":
			return (
				<div
					className="border border-gray-700 bg-green text-[12px] text-gray-900"
					style={{ width: NODE_SIZE, height: NODE_SIZE }}
				>
					{renderNodeHandle()}
					<div className="flex h-full text-center leading-tight p-4 overflow-scroll">
						{data.text.slice(200)}
					</div>
				</div>
			);
		case "image":
			return (
				<div
					className="border border-gray-700 bg-green-100 text-[12px] text-gray-900 p-2.5"
					style={{ width: NODE_SIZE, height: NODE_SIZE }}
				>
					{renderNodeHandle()}
					<figure>
						<img
							className="outline-2 outline-purple-600"
							src={templateImage}
							alt={data.alt}
						/>
						<figcaption className="text-center mt-1.5">
							{data.title}caption
						</figcaption>
					</figure>
				</div>
			);
		case "link":
			return (
				<div
					className="border border-gray-700 bg-green-100 text-[12px] text-gray-900"
					style={{ width: NODE_SIZE, height: NODE_SIZE }}
				>
					{renderNodeHandle()}
					<div className="flex flex-col h-full">
						<img
							className="shrink min-h-0 h-40"
							src={templateImage}
							alt={data.title}
						/>
						<div className="flex flex-row items-center gap-1.5 bg-green py-0.5 px-3 border-t border-t-gray-700 shrink-0">
							<div className="bg-red w-2.5 h-2.5"></div>
							<div className="text-2xs">frankstainlove.xyz/garden/</div>
						</div>
						<div className="shrink-0 bg-blue border-t border-t-gray-700 text-2xs py-2 px-4">
							텃밭 digital graden은 시덥잖은 아이디어, 기록, 선언문, 잡담,
							가십등을 심고 서로 연결합니다.
						</div>
					</div>
				</div>
			);
		case "music":
			return (
				<div
					className="border border-gray-700 bg-green text-[12px] text-gray-900"
					style={{ width: NODE_SIZE, height: NODE_SIZE }}
				>
					{renderNodeHandle()}
					<div className="grid grid-cols-[1.25rem_1fr] grid-rows-[1fr_1.25rem]">
						<div className="flex items-end justify-center py-2 border-r">
							<p className="[writing-mode:vertical-rl] rotate-180 text-2xs">
								Birds, Promises, Moonlight...
							</p>
						</div>
						<div>
							<img
								className="w-full h-full object-cover"
								src={coverArtImage}
								alt={data.title}
							/>
						</div>
						<div className="col-span-2 flex items-center bg-blue border-t border-gray-700 px-5">
							<h2 className="text-2xs">Pishu - ppqq</h2>
						</div>
					</div>
				</div>
			);
		// case "game":
		// case "movie":
		// case "book":
		default:
			return (
				<div
					className="border border-gray-700 bg-green text-[12px] text-gray-900"
					style={{ width: NODE_SIZE, height: NODE_SIZE }}
				>
					{renderNodeHandle()}
					<div className="flex h-full items-center justify-center p-1 text-center leading-tight">
						{data.blockType}
					</div>
				</div>
			);
		// break;
	}
}
export default function BlockNode({ data }: NodeProps<Node<BlockNodeData>>) {
	return renderBlockNode(data);
}
