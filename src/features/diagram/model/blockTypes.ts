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
