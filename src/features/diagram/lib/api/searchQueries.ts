import { queryOptions } from "@tanstack/react-query";
import { getSearchData, type SearchType } from "./searchApi";

const STALE_TIME = 1000 * 60 * 5; // 5분

function makeSearchQuery(type: SearchType) {
	return (query: string) =>
		queryOptions({
			queryKey: ["search", type, query] as const,
			queryFn: () => getSearchData(type, query),
			enabled: query.length >= 2,
			staleTime: STALE_TIME,
		});
}

export const searchQueries = {
	music: makeSearchQuery("music"),
	game: makeSearchQuery("game"),
	movie: makeSearchQuery("movie"),
	book: makeSearchQuery("book"),
};
