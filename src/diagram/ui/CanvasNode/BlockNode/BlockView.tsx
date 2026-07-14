import type { JSX } from "react";
import defaultImage from "@/assets/frankenstein.webp";
import type { BlockData } from "@/diagram/model/blockTypes";

interface RectangleBlockViewProps {
	image?: string;
	title?: string;
	secondary?: string;
	year?: string;
}

function RectangleBlockView({ image, title, secondary, year }: RectangleBlockViewProps) {
	return (
		<div className="flex flex-col h-full">
			{image && (
				<img
					className="w-full h-40 object-cover border-b border-b-gray-400"
					src={image}
					alt={title}
				/>
			)}
			<div className="flex flex-col flex-1 justify-center items-center p-1 gap-1 w-full">
				<p className="font-medium text-center text-2xs w-full line-clamp-2 leading-tight">
					{title}
				</p>
				<p className="font-medium text-center text-2xs text-gray-500 truncate w-full">
					{secondary}
					{year ? ` (${year})` : ""}
				</p>
			</div>
		</div>
	);
}

export function BlockView({ data }: { data: BlockData }): JSX.Element {
	switch (data.blockType) {
		case "text":
			return (
				<div className="flex h-full text-center leading-tight p-4 overflow-y-auto break-all ">
					{data.title}
				</div>
			);
		case "image":
			return (
				<div className="h-full p-2.5">
					<figure>
						<img
							className="border border-gray-700"
							src={data.image || defaultImage}
							alt={data.title}
						/>
						<figcaption className="text-center mt-1.5 text-xs">{data.title}</figcaption>
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
						height={160}
						width={216}
					/>
					<div className="flex flex-row items-center gap-1.5 bg-green py-0.5 px-3 border-t border-t-gray-700 shrink-0">
						<div className="bg-red w-2.5 h-2.5" />
						<div className="min-w-0 truncate text-2xs">{data.title || "URL"}</div>
					</div>
					<div className="flex-1 min-h-0 bg-blue border-t border-t-gray-700 py-1 px-2">
						<p className="line-clamp-2 text-2xs leading-tight wrap-break-word">
							{data.secondary || data.title}
						</p>
					</div>
				</div>
			);
		case "music":
			return (
				<div className="grid grid-cols-[1.25rem_1fr] grid-rows-[1fr_1.25rem] h-full">
					<div className="flex items-start justify-center py-2 border-r min-h-0 overflow-hidden">
						<h2 className="[writing-mode:vertical-rl] [text-orientation:mixed] text-2xs max-h-full truncate">
							{data.title || "music"}
						</h2>
					</div>
					<div>
						<img
							className="w-full h-full object-cover aspect-square"
							width={196}
							height={196}
							src={data.image || defaultImage}
							alt={data.title}
						/>
					</div>
					<div className="col-span-2 flex items-center bg-blue border-t border-gray-700 px-4 overflow-hidden w-full">
						<h2 className="text-2xs truncate">{data.secondary || "someone"}</h2>
					</div>
				</div>
			);
		case "game":
			return (
				<RectangleBlockView image={data.image} title={data.title || "game"} year={data.year} />
			);
		case "movie":
			return (
				<RectangleBlockView image={data.image} title={data.title || "movie"} year={data.year} />
			);
		case "book":
			return (
				<RectangleBlockView
					image={data.image}
					title={data.title || "book"}
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
