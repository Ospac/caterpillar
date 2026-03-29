import axios from "axios"
import { parseSearchResults } from "./types"

export async function searchMovie(query: string) {
	const { data } = await axios.get("/api/search-movie", {
		params: { q: query },
	})
	return parseSearchResults(data)
}
