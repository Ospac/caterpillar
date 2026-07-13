import axios from "axios";
import { parseSearchResults } from "./types";

export type SearchType = "music" | "game" | "movie" | "book";

export const SEARCH_TYPES = [
	"music",
	"game",
	"movie",
	"book",
] as const satisfies readonly SearchType[];

export const SEARCH_ENDPOINTS = {
	music: "/api/search-music",
	game: "/api/search-game",
	movie: "/api/search-movie",
	book: "/api/search-book",
} as const satisfies Record<SearchType, string>;

export async function getSearchData(type: SearchType, query: string) {
	const { data } = await axios.get(SEARCH_ENDPOINTS[type], {
		params: { q: query },
	});
	return parseSearchResults(data);
}
