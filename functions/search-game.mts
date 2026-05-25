import { getStore } from "@netlify/blobs";
import type { Context } from "@netlify/functions";
import axios, {
	AxiosHeaders,
	type AxiosResponse,
	type InternalAxiosRequestConfig,
} from "axios";
import type { SearchResult } from "@/features/diagram/lib/api/types";

import {
	ENDPOINT,
	getQuery,
	getYear,
	jsonError,
	jsonOk,
	responseNotOkFromAxios,
} from "./_shared";

type RetryableAxiosRequestConfig = InternalAxiosRequestConfig & {
	_retry?: boolean;
};
interface game {
	id: number;
	name: string;
	cover?: number;
	first_release_date?: number;
}
const igdbClient = axios.create({});

export default async (request: Request, _context: Context) => {
	const query = getQuery(request);
	const store = getStore("tokens");
	const clientSecret = Netlify.env.get("IGDB_SECRET");
	const clientId = Netlify.env.get("IGDB_CLIENT_ID");
	let accessToken = await store.get("access_token", { type: "text" });

	if (!query) return jsonError("Missing query parameter", 400);
	if (!clientSecret) {
		throw new Error("IGDB_SECRET not configured");
	}
	if (!clientId) {
		throw new Error("IGDB_CLIENT_ID not configured");
	}
	if (!accessToken) {
		accessToken = await getAccessToken(clientId, clientSecret);
		await store.set("access_token", accessToken);
	}
	igdbClient.interceptors.request.use((config) => {
		const headers = AxiosHeaders.from(config.headers);
		headers.set("Client-ID", clientId);
		headers.set("Authorization", `Bearer ${accessToken}`);
		headers.set("Accept", "application/json");
		headers.set("Content-Type", "text/plain");
		config.headers = headers;
		return config;
	});

	igdbClient.interceptors.response.use(
		async (response: AxiosResponse) => {
			const originalConfig = response.config as RetryableAxiosRequestConfig;

			if (response.status !== 401 || originalConfig._retry) {
				return response;
			}

			originalConfig._retry = true;
			accessToken = await getAccessToken(clientId, clientSecret);
			await store.set("access_token", accessToken);

			return igdbClient.request(originalConfig);
		},
		(error) => Promise.reject(error),
	);

	// Step 1: Search games
	const gameResponse = await igdbClient.post<game[]>(
		ENDPOINT.igdb.games,
		`search "${query}"; fields name,cover,first_release_date; limit 10;`,
	);

	if (gameResponse.status < 200 || gameResponse.status >= 300) {
		return responseNotOkFromAxios(gameResponse, "Failed to fetch from IGDB");
	}

	const games = gameResponse.data;

	// Step 2: Fetch cover images
	const coverIds = games.filter((g) => g.cover).map((g) => g.cover);
	let coverMap = new Map<number, string>();

	if (coverIds.length > 0) {
		const coversResponse = await igdbClient.post<
			{ id: number; image_id: string }[]
		>(
			ENDPOINT.igdb.covers,
			`fields image_id; where id = (${coverIds.join(",")}); limit 10;`,
		);

		if (coversResponse.status >= 200 && coversResponse.status < 300) {
			coverMap = new Map(
				coversResponse.data.map((c) => [
					c.id,
					`${ENDPOINT.igdb.cover}${c.image_id}.jpg`,
				]),
			);
		}
	}
	const results = formatGames(games, coverMap);
	return jsonOk(results);
};

const formatGames = (
	games: game[],
	coverMap: Map<number, string>,
): SearchResult[] => {
	return games.map((game) => ({
		title: game.name,
		secondary: "",
		year: game.first_release_date ? getYear(game.first_release_date) : "",
		image: game.cover ? coverMap.get(game.cover) : undefined,
	}));
};

async function getAccessToken(clientId: string, clientSecret: string) {
	const response = await axios.post<{ access_token: string }>(
		ENDPOINT.igdb.authentication,
		new URLSearchParams([
			["client_secret", clientSecret],
			["client_id", clientId],
			["grant_type", "client_credentials"],
		]),
	);
	if (response.status < 200 || response.status >= 300) {
		throw new Error("Failed to get access token");
	}
	return response.data.access_token;
}
