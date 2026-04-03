import type { Context } from "@netlify/functions";
import { ENDPOINT, getQuery, jsonError, jsonOk } from "./_shared";

export default async (request: Request, _context: Context) => {
	const query = getQuery(request);

	const bearerToken = Netlify.env.get("TMDB_ACCESS_TOKEN");

	if (!query) return jsonError("Missing query parameter", 400);
	if (!bearerToken) return jsonError("API token not configured", 500);
	const apiUrl = new URL(ENDPOINT.tmdb.movie);
	apiUrl.searchParams.set("query", query);
	apiUrl.searchParams.set("language", "ko-KR");
	apiUrl.searchParams.set("page", "1");

	const response = await fetch(apiUrl.toString(), {
		headers: {
			Authorization: `Bearer ${bearerToken}`,
			Accept: "application/json",
		},
	});

	if (!response.ok) {
		return jsonError("Failed to fetch from TMDB", response.status);
	}

	const json = await response.json();
	const movies: {
		title: string;
		release_date?: string;
		poster_path?: string | null;
	}[] = json?.results ?? [];

	const results = movies.map((movie) => {
		const year = movie.release_date?.slice(0, 4);
		return {
			title: movie.title,
			secondary: year ?? "",
			year,
			image: movie.poster_path
				? `${ENDPOINT.tmdb.poster}${movie.poster_path}`
				: undefined,
		};
	});

	return jsonOk(results);
};
