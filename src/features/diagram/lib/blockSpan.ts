import type { BlockType } from "../model/blockTypes";
import type { NodeSpan } from "./geometry";

export const WIDE_SPAN: NodeSpan = { cols: 2, rows: 2 };
export const TALL_SPAN: NodeSpan = { cols: 1, rows: 2 };

const BLOCK_SPANS = {
  text: WIDE_SPAN,
  image: WIDE_SPAN,
  link: WIDE_SPAN,
  music: WIDE_SPAN,
  game: TALL_SPAN,
  movie: TALL_SPAN,
  book: TALL_SPAN,
  menu: WIDE_SPAN,
} as const satisfies Record<BlockType | "menu", NodeSpan>;

export function getNodeSpan(blockType: BlockType | "menu"): NodeSpan {
  return BLOCK_SPANS[blockType];
}
