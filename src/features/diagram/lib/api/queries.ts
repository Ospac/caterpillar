import { queryOptions } from "@tanstack/react-query"
import { searchBook } from "./searchBook"
import { searchGame } from "./searchGame"
import { searchMovie } from "./searchMovie"
import { searchMusic } from "./searchMusic"

export const searchQueries = {
	music: (query: string) =>
		queryOptions({
			queryKey: ["search", "music", query],
			queryFn: () => searchMusic(query),
			enabled: query.length >= 2,
			staleTime: 1000 * 60 * 5,
		}),
	game: (query: string) =>
		queryOptions({
			queryKey: ["search", "game", query],
			queryFn: () => searchGame(query),
			enabled: query.length >= 2,
			staleTime: 1000 * 60 * 5,
		}),
	movie: (query: string) =>
		queryOptions({
			queryKey: ["search", "movie", query],
			queryFn: () => searchMovie(query),
			enabled: query.length >= 2,
			staleTime: 1000 * 60 * 5,
		}),
	book: (query: string) =>
		queryOptions({
			queryKey: ["search", "book", query],
			queryFn: () => searchBook(query),
			enabled: query.length >= 2,
			staleTime: 1000 * 60 * 5,
		}),
}
