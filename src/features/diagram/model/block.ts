import { z } from "zod";
import type { BlockData, BlockType, BlockValidationResult } from "./blockTypes";

const contentSchema = z.object({
	title: z.string(),
	secondary: z.string(),
	image: z.string().optional(),
	year: z.string().optional(),
});
const textSchema = z.object({
	blockType: z.literal("text"),
	...contentSchema.shape,
});
const imageSchema = z.object({
	blockType: z.literal("image"),
	...contentSchema.shape,
});
const linkSchema = z.object({
	blockType: z.literal("link"),
	...contentSchema.shape,
});
const musicSchema = z.object({
	blockType: z.literal("music"),
	...contentSchema.shape,
});

const gameSchema = z.object({
	blockType: z.literal("game"),
	...contentSchema.shape,
});

const movieSchema = z.object({
	blockType: z.literal("movie"),
	...contentSchema.shape,
});

const bookSchema = z.object({
	blockType: z.literal("book"),
	...contentSchema.shape,
});

type ContentData = z.infer<typeof contentSchema>;

function buildContentResult<T extends BlockType>(
	blockType: T,
	data: ContentData,
): { status: "ok" | "fallback"; data: BlockData } {
	const title = data.title || blockType;
	return {
		status: data.title ? "ok" : "fallback",
		data: {
			blockType,
			title,
			secondary: data.secondary ?? "",
			...(data.year != null && { year: data.year }),
			...(data.image != null && { image: data.image }),
		} as BlockData,
	};
}

export function validateBlockData(input: unknown): BlockValidationResult {
	if (
		typeof input !== "object" ||
		input === null ||
		typeof (input as Record<string, unknown>).blockType !== "string"
	) {
		return {
			status: "invalid",
			reason: "blockType이 없는 데이터는 복원할 수 없습니다.",
		};
	}

	const blockType = (input as Record<string, unknown>).blockType as string;

	switch (blockType) {
		case "text": {
			const r = textSchema.safeParse(input);
			if (!r.success) return { status: "invalid", reason: r.error.message };
			return buildContentResult("text", r.data);
		}
		case "image": {
			const r = imageSchema.safeParse(input);
			if (!r.success) return { status: "invalid", reason: r.error.message };
			return buildContentResult("image", r.data);
		}
		case "link": {
			const r = linkSchema.safeParse(input);
			if (!r.success) return { status: "invalid", reason: r.error.message };
			return buildContentResult("link", r.data);
		}
		case "music": {
			const r = musicSchema.safeParse(input);
			if (!r.success) return { status: "invalid", reason: r.error.message };
			return buildContentResult("music", r.data);
		}
		case "game": {
			const r = gameSchema.safeParse(input);
			if (!r.success) return { status: "invalid", reason: r.error.message };
			return buildContentResult("game", r.data);
		}
		case "movie": {
			const r = movieSchema.safeParse(input);
			if (!r.success) return { status: "invalid", reason: r.error.message };
			return buildContentResult("movie", r.data);
		}
		case "book": {
			const r = bookSchema.safeParse(input);
			if (!r.success) return { status: "invalid", reason: r.error.message };
			return buildContentResult("book", r.data);
		}
		default:
			return {
				status: "invalid",
				reason: `지원하지 않는 blockType: ${blockType}`,
			};
	}
}
