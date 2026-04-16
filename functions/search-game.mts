import type { Context } from "@netlify/functions";
import { ENDPOINT, getQuery, getYear, jsonError, jsonOk } from "./_shared";

export default async (request: Request, _context: Context) => {
	//TODO: accessToken 발급 로직
	const query = getQuery(request);
	const clientId = Netlify.env.get("IGDB_CLIENT_ID");
	const accessToken = Netlify.env.get("IGDB_ACCESS_TOKEN");

	if (!query) return jsonError("Missing query parameter", 400);
	if (!clientId || !accessToken) {
		return jsonError("API credentials not configured", 500);
	}

	const headers = {
		"Client-ID": clientId,
		Authorization: `Bearer ${accessToken}`,
		Accept: "application/json",
		"Content-Type": "text/plain",
	};

	// Step 1: Search games
	const gamesResponse = await fetch(ENDPOINT.igdb.games, {
		method: "POST",
		headers: { ...headers },
		body: `search "${query}"; fields name,cover,first_release_date; limit 10;`,
	});

	if (!gamesResponse.ok) {
		return jsonError("Failed to fetch from IGDB", gamesResponse.status);
	}

	const games: {
		id: number;
		name: string;
		cover?: number;
		first_release_date?: number;
	}[] = await gamesResponse.json();

	// Step 2: Fetch cover images
	const coverIds = games.filter((g) => g.cover).map((g) => g.cover);
	let coverMap = new Map<number, string>();

	if (coverIds.length > 0) {
		const coversResponse = await fetch(ENDPOINT.igdb.covers, {
			method: "POST",
			headers: { ...headers },
			body: `fields image_id; where id = (${coverIds.join(",")}); limit 10;`,
		});

		if (coversResponse.ok) {
			const covers: { id: number; image_id: string }[] =
				await coversResponse.json();
			coverMap = new Map(
				covers.map((c) => [c.id, `${ENDPOINT.igdb.cover}${c.image_id}.jpg`]),
			);
		}
	}

	const results = games.map((game) => ({
		title: game.name,
		secondary: "",
		year: game.first_release_date ? getYear(game.first_release_date) : "",
		image: game.cover ? coverMap.get(game.cover) : undefined,
	}));

	return jsonOk(results);
};
