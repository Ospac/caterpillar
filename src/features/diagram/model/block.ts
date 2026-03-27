import { z } from "zod";
import type { BlockValidationResult } from "./type";

const descriptionField = z.string().optional();

const textSchema = z.object({
	blockType: z.literal("text"),
	title: z.string().nullish(),
	text: z.string().nullish(),
	description: descriptionField,
});

const imageSchema = z.object({
	blockType: z.literal("image"),
	title: z.string().nullish(),
	image: z.string().nullish(),
	caption: z.string().nullish(),
	description: descriptionField,
});

const linkSchema = z.object({
	blockType: z.literal("link"),
	title: z.string().nullish(),
	url: z.string().nullish(),
	description: descriptionField,
});

const musicSchema = z.object({
	blockType: z.literal("music"),
	title: z.string().nullish(),
	artist: z.string().nullish(),
	image: z.string().nullish(),
	description: descriptionField,
});

const gameSchema = z.object({
	blockType: z.literal("game"),
	title: z.string().nullish(),
	image: z.string().nullish(),
	releaseYear: z.number().nullish(),
	description: descriptionField,
});

const movieSchema = z.object({
	blockType: z.literal("movie"),
	title: z.string().nullish(),
	image: z.string().nullish(),
	releaseYear: z.number().nullish(),
	description: descriptionField,
});

const bookSchema = z.object({
	blockType: z.literal("book"),
	title: z.string().nullish(),
	author: z.string().nullish(),
	image: z.string().nullish(),
	description: descriptionField,
});

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
			const title = r.data.title ?? r.data.text ?? "Untitled";
			const text = r.data.text ?? title;
			return {
				status: r.data.title != null && r.data.text != null ? "ok" : "fallback",
				data: {
					blockType: "text",
					title,
					text,
				},
			};
		}
		case "image": {
			const r = imageSchema.safeParse(input);
			if (!r.success) return { status: "invalid", reason: r.error.message };
			const title = r.data.title ?? "Image";
			return {
				status:
					r.data.title != null && r.data.image != null && r.data.caption != null
						? "ok"
						: "fallback",
				data: {
					blockType: "image",
					title,
					image: r.data.image ?? "",
					caption: r.data.caption ?? title,
				},
			};
		}
		case "link": {
			const r = linkSchema.safeParse(input);
			if (!r.success) return { status: "invalid", reason: r.error.message };
			const title = r.data.title ?? "Link";
			return {
				status: r.data.title != null && r.data.url != null ? "ok" : "fallback",
				data: {
					blockType: "link",
					title,
					url: r.data.url ?? "",
					description: r.data.description,
				},
			};
		}
		case "music": {
			const r = musicSchema.safeParse(input);
			if (!r.success) return { status: "invalid", reason: r.error.message };
			const title = r.data.title ?? "Music";
			return {
				status:
					r.data.title != null && r.data.artist != null ? "ok" : "fallback",
				data: {
					blockType: "music",
					title,
					artist: r.data.artist ?? "",
					...(r.data.image != null && { image: r.data.image }),
				},
			};
		}
		case "game": {
			const r = gameSchema.safeParse(input);
			if (!r.success) return { status: "invalid", reason: r.error.message };
			const title = r.data.title ?? "Game";
			return {
				status: r.data.title != null ? "ok" : "fallback",
				data: {
					blockType: "game",
					title,
					...(r.data.image != null && { image: r.data.image }),
					...(r.data.releaseYear != null && {
						releaseYear: r.data.releaseYear,
					}),
				},
			};
		}
		case "movie": {
			const r = movieSchema.safeParse(input);
			if (!r.success) return { status: "invalid", reason: r.error.message };
			const title = r.data.title ?? "Movie";
			return {
				status: r.data.title != null ? "ok" : "fallback",
				data: {
					blockType: "movie",
					title,
					...(r.data.image != null && { image: r.data.image }),
					...(r.data.releaseYear != null && {
						releaseYear: r.data.releaseYear,
					}),
				},
			};
		}
		case "book": {
			const r = bookSchema.safeParse(input);
			if (!r.success) return { status: "invalid", reason: r.error.message };
			const title = r.data.title ?? "Book";
			return {
				status:
					r.data.title != null && r.data.author != null ? "ok" : "fallback",
				data: {
					blockType: "book",
					title,
					author: r.data.author ?? "",
					...(r.data.image != null && { image: r.data.image }),
				},
			};
		}
		default:
			return {
				status: "invalid",
				reason: `지원하지 않는 blockType: ${blockType}`,
			};
	}
}
