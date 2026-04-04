import type { Node } from "@xyflow/react";
export const BLOCK_TYPES = [
	"text",
	"image",
	"link",
	"music",
	"game",
	"movie",
	"book",
] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];

type BlockBase = {
	blockType: BlockType;
	title?: string;
};
type SearchBlockBase = BlockBase & {
	secondary: string;
	image?: string;
	year?: string;
};
export type TextBlockData = BlockBase & {
	blockType: "text";
	text?: string;
};

export type ImageBlockData = BlockBase & {
	blockType: "image";
	image?: string;
	caption?: string;
};

export type LinkBlockData = BlockBase & {
	blockType: "link";
	url?: string;
	description?: string;
};
export type MusicBlockData = SearchBlockBase & {
	blockType: "music";
};
export type GameBlockData = SearchBlockBase & {
	blockType: "game";
};
export type MovieBlockData = SearchBlockBase & {
	blockType: "movie";
};
export type BookBlockData = SearchBlockBase & {
	blockType: "book";
};
export type BlockData =
	| TextBlockData
	| ImageBlockData
	| LinkBlockData
	| MusicBlockData
	| GameBlockData
	| MovieBlockData
	| BookBlockData;

export type SearchBlockData =
	| MusicBlockData
	| GameBlockData
	| MovieBlockData
	| BookBlockData;

export type BlockValidationResult =
	| {
			status: "ok" | "fallback";
			data: BlockData;
	  }
	| {
			status: "invalid";
			reason: string;
	  };

/**
 * 메뉴 노드의 런타임 전용 데이터.
 * `onTypeSelect`는 직렬화되지 않으므로 BlockData에 포함하지 않는다.
 */
export type MenuNodeData = {
	blockType: "menu";
	onTypeSelect?: (blockType: BlockType) => void;
};

/**
 * 블록 노드의 런타임 전용 콜백. BlockData에 직렬화되지 않는다.
 * MenuNodeData의 onTypeSelect 패턴과 동일하게 data에 포함해 전달한다.
 */
export type BlockNodeData = BlockData & {
	onDataChange?: (newData: BlockData) => void;
	onEditStart?: () => void;
	onEditEnd?: () => void;
	initialEditing?: boolean;
};

export type DiagramNodeData = BlockNodeData | MenuNodeData;

export type DiagramNodeType = "menu" | "block";

export type DiagramNode = Node<DiagramNodeData, DiagramNodeType>;
