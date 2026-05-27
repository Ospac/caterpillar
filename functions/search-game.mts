import { getStore } from "@netlify/blobs";
import type { AxiosInstance } from "axios";
import type { SearchResult } from "@/features/diagram/lib/api/types";
import {
	createSearchClient,
	ENDPOINT,
	escapeIgdbSearchTerm,
	getYear,
	requireEnv,
	responseNotOkFromAxiosResponse,
	withSearchQuery,
} from "./_shared";

interface Game {
	id: number;
	name: string;
	cover?: number;
	first_release_date?: number;
}

interface Cover {
	id: number;
	image_id: string;
}

interface IgdbConfig {
	clientId: string;
	clientSecret: string;
	accessToken: string;
}

const authClient = createSearchClient();

export default withSearchQuery({
	errorMessage: "Failed to fetch from IGDB",
	handler: async ({ query }) => {
		const configOrError = await loadIgdbConfig();
		if (configOrError instanceof Response) return configOrError;

		const searchResult = await searchGames(query, configOrError);
		if (searchResult instanceof Response) return searchResult;

		const { games, client } = searchResult;
		const coverMap = await fetchCoverMap(client, games);

		return formatGames(games, coverMap);
	},
});

async function loadIgdbConfig(): Promise<IgdbConfig | Response> {
	const clientSecret = requireEnv({
		name: "IGDB_SECRET",
		message: "IGDB_SECRET not configured",
	});
	if (clientSecret instanceof Response) return clientSecret;

	const clientId = requireEnv({
		name: "IGDB_CLIENT_ID",
		message: "IGDB_CLIENT_ID not configured",
	});
	if (clientId instanceof Response) return clientId;

	const store = getStore("tokens");
	const storedToken = await store.get("access_token", { type: "text" });
	const accessToken =
		storedToken ?? (await refreshAccessToken(clientId, clientSecret));

	if (!storedToken) await store.set("access_token", accessToken);

	return { clientId, clientSecret, accessToken };
}

async function searchGames(
	query: string,
	config: IgdbConfig,
): Promise<{ games: Game[]; client: AxiosInstance } | Response> {
	let currentConfig = config;
	let client = createIgdbClient(currentConfig);
	let response = await requestGames(client, query);

	if (response.status === 401) {
		currentConfig = {
			...currentConfig,
			accessToken: await refreshAccessToken(
				currentConfig.clientId,
				currentConfig.clientSecret,
			),
		};
		await getStore("tokens").set("access_token", currentConfig.accessToken);
		client = createIgdbClient(currentConfig);
		response = await requestGames(client, query);
	}

	const error = responseNotOkFromAxiosResponse({
		response,
		message: "Failed to fetch from IGDB",
	});
	if (error) return error;

	return { games: response.data, client };
}

function createIgdbClient({ clientId, accessToken }: IgdbConfig) {
	return createSearchClient({
		headers: {
			"Client-ID": clientId,
			Authorization: `Bearer ${accessToken}`,
			"Content-Type": "text/plain",
		},
	});
}

function requestGames(client: AxiosInstance, query: string) {
	return client.post<Game[]>(
		ENDPOINT.igdb.games,
		`search "${escapeIgdbSearchTerm(query)}"; fields name,cover,first_release_date; limit 10;`,
	);
}

async function fetchCoverMap(client: AxiosInstance, games: Game[]) {
	const coverIds = games.flatMap((game) =>
		game.cover === undefined ? [] : [game.cover],
	);
	if (coverIds.length === 0) return new Map<number, string>();

	const response = await client.post<Cover[]>(
		ENDPOINT.igdb.covers,
		`fields image_id; where id = (${coverIds.join(",")}); limit 10;`,
	);
	if (response.status < 200 || response.status >= 300) {
		return new Map<number, string>();
	}

	return new Map(
		response.data.map((cover) => [
			cover.id,
			`${ENDPOINT.igdb.cover}${cover.image_id}.jpg`,
		]),
	);
}

function formatGames(
	games: Game[],
	coverMap: Map<number, string>,
): SearchResult[] {
	return games.map((game) => ({
		title: game.name,
		secondary: "",
		year: game.first_release_date ? getYear(game.first_release_date) : "",
		image: game.cover ? coverMap.get(game.cover) : undefined,
	}));
}

async function refreshAccessToken(clientId: string, clientSecret: string) {
	const response = await authClient.post<{ access_token: string }>(
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
