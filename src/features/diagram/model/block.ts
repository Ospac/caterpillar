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

export type BlockValidationResult =
	| {
			status: "ok" | "fallback";
			data: BlockData;
	  }
	| {
			status: "invalid";
			reason: string;
	  };

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

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

export function validateBlockData(input: unknown): BlockValidationResult {
	if (!isRecord(input) || typeof input.blockType !== "string") {
		return {
			status: "invalid",
			reason: "blockType이 없는 데이터는 복원할 수 없습니다.",
		};
	}

	switch (input.blockType) {
		case "text": {
			const title =
				typeof input.title === "string"
					? input.title
					: typeof input.text === "string"
						? input.text
						: "Untitled";
			const text = typeof input.text === "string" ? input.text : title;
			return {
				status:
					title === input.title && text === input.text ? "ok" : "fallback",
				data: {
					blockType: "text",
					title,
					text,
					description:
						typeof input.description === "string"
							? input.description
							: undefined,
				},
			};
		}
		case "image": {
			const title = typeof input.title === "string" ? input.title : "Image";
			return {
				status:
					typeof input.title === "string" &&
					typeof input.imageUrl === "string" &&
					typeof input.alt === "string"
						? "ok"
						: "fallback",
				data: {
					blockType: "image",
					title,
					imageUrl: typeof input.imageUrl === "string" ? input.imageUrl : "",
					alt: typeof input.alt === "string" ? input.alt : title,
					description:
						typeof input.description === "string"
							? input.description
							: undefined,
				},
			};
		}
		case "link": {
			const title = typeof input.title === "string" ? input.title : "Link";
			return {
				status:
					typeof input.title === "string" && typeof input.url === "string"
						? "ok"
						: "fallback",
				data: {
					blockType: "link",
					title,
					url: typeof input.url === "string" ? input.url : "",
					description:
						typeof input.description === "string"
							? input.description
							: undefined,
				},
			};
		}
		default:
			return {
				status: "invalid",
				reason: `지원하지 않는 blockType: ${String(input.blockType)}`,
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
