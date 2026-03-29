import axios from "axios"
import { parseSearchResults } from "./types"

export async function searchBook(query: string) {
	const { data } = await axios.get("/api/search-book", {
		params: { q: query },
	})
	return parseSearchResults(data)
}
