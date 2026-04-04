import type { Context } from "@netlify/functions";
import { ENDPOINT, getQuery, jsonError, jsonOk } from "./_shared";

export default async (request: Request, _context: Context) => {
	const query = getQuery(request);
	if (!query) return jsonError("Missing query parameter", 400);

	const apiKey = Netlify.env.get("LASTFM_API_KEY");
	if (!apiKey) return jsonError("API key not configured", 500);

	const apiUrl = new URL(ENDPOINT.lastfm.music);
	apiUrl.searchParams.set("method", "album.search");
	apiUrl.searchParams.set("album", query);
	apiUrl.searchParams.set("api_key", apiKey);
	apiUrl.searchParams.set("format", "json");
	apiUrl.searchParams.set("limit", "10");

	const response = await fetch(apiUrl.toString());

	if (!response.ok) {
		return jsonError("Failed to fetch from Last.fm", response.status);
	}

	const json = await response.json();
	const albums = json?.results?.albummatches?.album ?? [];

	const results = albums.map(
		(album: {
			name: string;
			artist: string;
			image: { size: string; "#text": string }[];
		}) => ({
			title: album.name,
			secondary: album.artist,
			image:
				album.image?.find((img) => img.size === "large")?.["#text"] ||
				undefined,
		}),
	);

	return jsonOk(results);
};
