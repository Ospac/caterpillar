import type { Context } from "@netlify/functions";
import {
	ENDPOINT,
	getQuery,
	jsonError,
	jsonOk,
	responseNotOk,
} from "./_shared";

interface Book {
	title: string;
	authors?: string[];
	imageLinks?: { thumbnail?: string; smallThumbnail?: string };
	publishedDate?: string;
}

export default async (request: Request, _context: Context) => {
	const query = getQuery(request);
	const apiKey = Netlify.env.get("GOOGLE_BOOKS_API_KEY");
	const domain = Netlify.env.get("PRODUCTION_DOMAIN");

	if (!query) return jsonError("Missing query parameter", 400);
	if (!apiKey) return jsonError("API key not configured", 500);
	if (!domain) return jsonError("Domain name not configured", 500);

	const apiUrl = new URL(ENDPOINT.googleBooks.books);
	apiUrl.searchParams.set("q", query);
	apiUrl.searchParams.set("maxResults", "10");
	apiUrl.searchParams.set("langRestrict", "ko");
	apiUrl.searchParams.set("key", apiKey);

	const response = await fetch(apiUrl.toString(), {
		headers: { Referer: domain },
	});

	if (!response.ok) {
		return responseNotOk(response, "Failed to fetch from Google Books");
	}

	const json = await response.json();
	const items: {
		volumeInfo: Book;
	}[] = json?.items ?? [];

	const results = items.map((item) => {
		const info = item.volumeInfo;
		const rawImage =
			info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail;
		const image = rawImage?.replace(/^http:\/\//, "https://");

		return {
			title: info.title,
			year: info.publishedDate?.slice(0, 4),
			secondary: info.authors?.[0] ?? "",
			image,
		};
	});

	return jsonOk(results);
};
