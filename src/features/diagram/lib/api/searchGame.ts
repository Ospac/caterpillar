import axios from "axios"
import { parseSearchResults } from "./types"

export async function searchGame(query: string) {
	const { data } = await axios.get("/api/search-game", {
		params: { q: query },
	})
	return parseSearchResults(data)
}
