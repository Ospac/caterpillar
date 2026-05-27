import type { SearchResult } from "@/features/diagram/lib/api/types";
import {
	createSearchClient,
	ENDPOINT,
	requireEnv,
	responseNotOkFromAxiosResponse,
	withSearchQuery,
} from "./_shared";

interface Album {
	name: string;
	artist: string;
	image: { size: string; "#text": string }[];
}

interface LastFmAlbumSearchResponse {
	results?: {
		albummatches?: {
			album?: Album[];
		};
	};
}

const lastFmClient = createSearchClient();

export default withSearchQuery({
	errorMessage: "Failed to fetch from Last.fm",
	handler: async ({ query }) => {
		const apiKey = requireEnv({ name: "LASTFM_API_KEY" });
		if (apiKey instanceof Response) return apiKey;

		const response = await lastFmClient.get<LastFmAlbumSearchResponse>(
			ENDPOINT.lastfm.music,
			{
				params: {
					method: "album.search",
					album: query,
					api_key: apiKey,
					format: "json",
					limit: "10",
				},
			},
		);
		const error = responseNotOkFromAxiosResponse({
			response,
			message: "Failed to fetch from Last.fm",
		});
		if (error) return error;

		return formatAlbums(response.data?.results?.albummatches?.album ?? []);
	},
});

function formatAlbums(albums: Album[]): SearchResult[] {
	return albums.map((album) => ({
		title: album.name,
		secondary: album.artist,
		image: getAlbumImage(album.image),
	}));
}

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
