import type { BlockType } from "../model/type";
import type { NodeSpan } from "./type";

export const WIDE_SPAN: NodeSpan = { cols: 2, rows: 2 };
export const TALL_SPAN: NodeSpan = { cols: 1, rows: 2 };

export function getNodeSpan(blockType: BlockType | "menu"): NodeSpan {
	switch (blockType) {
		case "movie":
		case "book":
		case "game":
			return TALL_SPAN;
		default:
			return WIDE_SPAN;
	}
}
