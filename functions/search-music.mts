import type { Context } from "@netlify/functions";
import { ENDPOINT, getQuery, jsonError, jsonOk } from "./_shared";

interface Album {
	name: string;
	artist: string;
	image: { size: string; "#text": string }[];
}

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

	const results = albums.map((album: Album) => ({
		title: album.name,
		secondary: album.artist,
		image: getAlbumImage(album.image),
	}));

	return jsonOk(results);
};

function getAlbumImage(images?: Album["image"]): string | undefined {
	if (!images || images.length === 0) return undefined;
	// 우선순위: large(2) > extralarge(3) > medium(1)
	return (
		images[2]?.["#text"] ||
		images[3]?.["#text"] ||
		images[1]?.["#text"] ||
		images[0]?.["#text"] ||
		undefined
	);
}
