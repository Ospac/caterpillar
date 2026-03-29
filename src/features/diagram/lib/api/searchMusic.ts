import axios from "axios"
import { parseSearchResults } from "./types"

export async function searchMusic(query: string) {
	const { data } = await axios.get("/api/search-music", {
		params: { q: query },
	})
	return parseSearchResults(data)
}
