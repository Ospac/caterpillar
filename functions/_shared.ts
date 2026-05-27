import type { Context } from "@netlify/functions";
import axios, {
	AxiosHeaders,
	type AxiosHeaderValue,
	type AxiosRequestConfig,
	type AxiosResponse,
} from "axios";

export const JSON_HEADERS = { "Content-Type": "application/json" } as const;
export const SEARCH_REQUEST_TIMEOUT_MS = 10_000;
export const ENDPOINT = {
	domain: {
		production: "https://ctpr.netlify.app/",
	},
	lastfm: {
		music: "https://ws.audioscrobbler.com/2.0/",
	},
	igdb: {
		games: "https://api.igdb.com/v4/games",
		covers: "https://api.igdb.com/v4/covers",
		cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/",
		authentication: "https://id.twitch.tv/oauth2/token",
		search: "https://api.igdb.com/v4/search",
	},
	tmdb: {
		movie: "https://api.themoviedb.org/3/search/movie",
		poster: "https://image.tmdb.org/t/p/w500/",
	},
	googleBooks: {
		books: "https://www.googleapis.com/books/v1/volumes",
	},
} as const;

type SearchHandler<T> = (input: {
	query: string;
	request: Request;
	context: Context;
}) => Promise<T | Response> | T | Response;

interface WithSearchQueryOptions<T> {
	handler: SearchHandler<T>;
	errorMessage?: string;
}

type SearchClientConfig = Omit<AxiosRequestConfig, "headers"> & {
	headers?: Record<string, AxiosHeaderValue> | AxiosHeaders;
};

export function createSearchClient(config: SearchClientConfig = {}) {
	const headers = AxiosHeaders.from(config.headers);
	if (!headers.has("Accept")) headers.set("Accept", "application/json");

	return axios.create({
		...config,
		headers,
		timeout: config.timeout ?? SEARCH_REQUEST_TIMEOUT_MS,
		validateStatus: config.validateStatus ?? (() => true),
	});
}

export function withSearchQuery<T>({
	handler,
	errorMessage,
}: WithSearchQueryOptions<T>) {
	return async (
		...args: [request: Request, context: Context]
	): Promise<Response> => {
		const [request, context] = args;
		const query = getQuery(request);
		if (!query)
			return jsonError({ message: "Missing query parameter", status: 400 });

		try {
			const result = await handler({ query, request, context });
			if (result instanceof Response) return result;
			return jsonOk(result);
		} catch (error) {
			if (axios.isAxiosError(error)) {
				return responseNotOkFromAxiosError({
					error,
					message: errorMessage ?? "Failed to fetch external API",
				});
			}

			const contextName = Netlify.env.get("context");
			if (contextName === "production")
				return jsonError({ message: "Unexpected error", status: 500 });
			return jsonError({
				message: error instanceof Error ? error.message : String(error),
				status: 500,
			});
		}
	};
}
export function jsonError({
	message,
	status,
}: {
	message: string;
	status: number;
}): Response {
	return new Response(JSON.stringify({ error: message }), {
		status,
		headers: JSON_HEADERS,
	});
}
export function getQuery(request: Request): string | null {
	return new URL(request.url).searchParams.get("q");
}
export function escapeIgdbSearchTerm(value: string): string {
	return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/;/g, " ");
}
export function requireEnv({
	name,
	message = "API key not configured",
}: {
	name: string;
	message?: string;
}) {
	const value = Netlify.env.get(name);
	if (!value) return jsonError({ message, status: 500 });
	return value;
}

export function jsonOk(data: unknown): Response {
	return new Response(JSON.stringify(data), { headers: JSON_HEADERS });
}

export async function responseNotOk({
	response,
	message,
}: {
	response: Response;
	message: string;
}): Promise<Response> {
	const context = Netlify.env.get("context");
	if (context === "production")
		return jsonError({ message, status: response.status });
	return jsonError({ message: await response.json(), status: response.status });
}

export function responseNotOkFromAxios({
	response,
	message,
}: {
	response: { data: unknown; status: number };
	message: string;
}): Response {
	const context = Netlify.env.get("context");
	if (context === "production")
		return jsonError({ message, status: response.status });
	return jsonError({
		message: JSON.stringify(response.data),
		status: response.status,
	});
}

export function responseNotOkFromAxiosError({
	error,
	message,
}: {
	error: unknown;
	message: string;
}): Response {
	if (!axios.isAxiosError(error)) return jsonError({ message, status: 500 });
	if (error.response)
		return responseNotOkFromAxios({ response: error.response, message });

	const context = Netlify.env.get("context");
	if (context === "production") return jsonError({ message, status: 502 });
	return jsonError({
		message: error.message,
		status: error.request ? 502 : 500,
	});
}

export function responseNotOkFromAxiosResponse({
	response,
	message,
}: {
	response: AxiosResponse;
	message: string;
}): Response | null {
	if (response.status >= 200 && response.status < 300) return null;
	return responseNotOkFromAxios({ response, message });
}
export function getYear(date: number) {
	return new Date(date * 1000).getFullYear().toString();
}
