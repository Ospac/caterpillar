import { z } from "zod";
import type { BlockData, BlockValidationResult } from "./type";

const textSchema = z.object({
	blockType: z.literal("text"),
	text: z.string(),
});

const imageSchema = z.object({
	blockType: z.literal("image"),
	caption: z.string().optional(),
	image: z.string(),
});

const linkSchema = z.object({
	blockType: z.literal("link"),
	url: z.string(),
	description: z.string().optional(),
});

const contentSchema = z.object({
	title: z.string(),
	secondary: z.string(),
	image: z.string().optional(),
	year: z.string().optional(),
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

function buildSearchResult<T extends "music" | "game" | "movie" | "book">(
	blockType: T,
	data: ContentData,
): { status: "ok" | "fallback"; data: BlockData } {
	const title = data.title || blockType;
	const usesSecondary = blockType === "music" || blockType === "book";
	const extraFields = usesSecondary
		? { secondary: data.secondary }
		: data.year != null
			? { year: data.year }
			: {};
	return {
		status:
			data.title && (usesSecondary ? !!data.secondary : true)
				? "ok"
				: "fallback",
		data: {
			blockType,
			title,
			...extraFields,
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
			const text = r.data.text || "";
			return {
				status: r.data.text != null ? "ok" : "fallback",
				data: {
					blockType: "text",
					text,
				},
			};
		}
		case "image": {
			const r = imageSchema.safeParse(input);
			if (!r.success) return { status: "invalid", reason: r.error.message };
			const caption = r.data.caption ?? "";
			return {
				status: r.data.image && r.data.caption ? "ok" : "fallback",
				data: {
					blockType: "image",
					caption,
					image: r.data.image ?? "",
				},
			};
		}
		case "link": {
			const r = linkSchema.safeParse(input);
			if (!r.success) return { status: "invalid", reason: r.error.message };
			return {
				status: r.data.url ? "ok" : "fallback",
				data: {
					blockType: "link",
					url: r.data.url,
					...(r.data.description != null && {
						description: r.data.description,
					}),
				},
			};
		}
		case "music": {
			const r = musicSchema.safeParse(input);
			if (!r.success) return { status: "invalid", reason: r.error.message };
			return buildSearchResult("music", r.data);
		}
		case "game": {
			const r = gameSchema.safeParse(input);
			if (!r.success) return { status: "invalid", reason: r.error.message };
			return buildSearchResult("game", r.data);
		}
		case "movie": {
			const r = movieSchema.safeParse(input);
			if (!r.success) return { status: "invalid", reason: r.error.message };
			return buildSearchResult("movie", r.data);
		}
		case "book": {
			const r = bookSchema.safeParse(input);
			if (!r.success) return { status: "invalid", reason: r.error.message };
			return buildSearchResult("book", r.data);
		}
		default:
			return {
				status: "invalid",
				reason: `지원하지 않는 blockType: ${blockType}`,
			};
	}
}
