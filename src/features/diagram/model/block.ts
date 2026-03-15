export const BLOCK_TYPES = ["text", "image", "link"] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];

type BlockBase = {
	blockType: BlockType;
	title: string;
	description?: string;
};

export type TextBlockData = BlockBase & {
	blockType: "text";
	text: string;
};

export type ImageBlockData = BlockBase & {
	blockType: "image";
	imageUrl: string;
	alt: string;
};

export type LinkBlockData = BlockBase & {
	blockType: "link";
	url: string;
};

export type BlockData = TextBlockData | ImageBlockData | LinkBlockData;

export function createDefaultBlockData(
	blockType: BlockType,
	title: string,
): BlockData {
	switch (blockType) {
		case "text":
			return {
				blockType,
				title,
				text: title,
			};
		case "image":
			return {
				blockType,
				title,
				imageUrl: "",
				alt: title,
			};
		case "link":
			return {
				blockType,
				title,
				url: "",
			};
	}
}

export function getBlockDisplayText(data: BlockData): string {
	switch (data.blockType) {
		case "text":
			return data.text || data.title;
		case "image":
			return data.title || data.alt || "Image";
		case "link":
			return data.title || data.url || "Link";
	}
}
