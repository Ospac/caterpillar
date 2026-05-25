import type { SearchResult } from "@/features/diagram/lib/api/types";
import {
	createSearchClient,
	ENDPOINT,
	requireEnv,
	responseNotOkFromAxiosResponse,
	withSearchQuery,
} from "./_shared";

interface Movie {
	title: string;
	release_date?: string;
	poster_path?: string | null;
}

interface TmdbSearchResponse {
	results?: Movie[];
}

const tmdbClient = createSearchClient();

export default withSearchQuery({
	errorMessage: "Failed to fetch from TMDB",
	handler: async ({ query }) => {
		const bearerToken = requireEnv({
			name: "TMDB_API_ACCESS_TOKEN",
			message: "API token not configured",
		});
		if (bearerToken instanceof Response) return bearerToken;

		const response = await tmdbClient.get<TmdbSearchResponse>(
			ENDPOINT.tmdb.movie,
			{
				params: {
					query,
					language: "ko-KR",
					page: "1",
				},
				headers: { Authorization: `Bearer ${bearerToken}` },
			},
		);
		const error = responseNotOkFromAxiosResponse({
			response,
			message: "Failed to fetch from TMDB",
		});
		if (error) return error;

		return formatMovies(response.data?.results ?? []);
	},
});

function formatMovies(movies: Movie[]): SearchResult[] {
	return movies.map((movie) => {
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
}
