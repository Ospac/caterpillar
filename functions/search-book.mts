import type { SearchResult } from "@/features/diagram/lib/api/types";
import {
	createSearchClient,
	ENDPOINT,
	requireEnv,
	responseNotOkFromAxiosResponse,
	withSearchQuery,
} from "./_shared";

interface Book {
	title: string;
	authors?: string[];
	imageLinks?: { thumbnail?: string; smallThumbnail?: string };
	publishedDate?: string;
}

interface GoogleBooksResponse {
	items?: { volumeInfo: Book }[];
}

const googleBooksClient = createSearchClient();

export default withSearchQuery({
	errorMessage: "Failed to fetch from Google Books",
	handler: async ({ query }) => {
		const apiKey = requireEnv({ name: "GOOGLE_BOOKS_API_KEY" });
		if (apiKey instanceof Response) return apiKey;

		const domain = requireEnv({
			name: "PRODUCTION_DOMAIN",
			message: "Domain name not configured",
		});
		if (domain instanceof Response) return domain;

		const response = await googleBooksClient.get<GoogleBooksResponse>(
			ENDPOINT.googleBooks.books,
			{
				params: {
					q: query,
					maxResults: "10",
					langRestrict: "ko",
					key: apiKey,
				},
				headers: { Referer: domain },
			},
		);
		const error = responseNotOkFromAxiosResponse({
			response,
			message: "Failed to fetch from Google Books",
		});
		if (error) return error;

		return formatBooks(response.data?.items ?? []);
	},
});

function formatBooks(items: { volumeInfo: Book }[]): SearchResult[] {
	return items.map((item) => {
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
}
