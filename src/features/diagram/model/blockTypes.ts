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

type ContentBlockData<T extends BlockType> = {
	blockType: T;
	title: string;
	secondary: string;
	image?: string;
	year?: string;
};

export type TextBlockData = ContentBlockData<"text">;
export type ImageBlockData = ContentBlockData<"image">;
export type LinkBlockData = ContentBlockData<"link">;
export type MusicBlockData = ContentBlockData<"music">;
export type GameBlockData = ContentBlockData<"game">;
export type MovieBlockData = ContentBlockData<"movie">;
export type BookBlockData = ContentBlockData<"book">;
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
