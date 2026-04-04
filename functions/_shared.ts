export const JSON_HEADERS = { "Content-Type": "application/json" } as const
export const ENDPOINT = {
  domain: {
    production: "https://ctpr.netlify.app/"
  },
  lastfm: {
    music: "https://ws.audioscrobbler.com/2.0/",
  },
	igdb: {
    games: "https://api.igdb.com/v4/games",
    covers: "https://api.igdb.com/v4/covers",
    cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/",
    authentication: "https://id.twitch.tv/oauth2/token",
    search: "https://api.igdb.com/v4/search",
  },
  tmdb: {
    movie: "https://api.themoviedb.org/3/search/movie",
    poster: "https://image.tmdb.org/t/p/w500/",
  },
  googleBooks: {
    books: "https://www.googleapis.com/books/v1/volumes",
  },
} as const;

export function jsonOk(data: unknown): Response {
	return new Response(JSON.stringify(data), { headers: JSON_HEADERS })
}

export function jsonError(message: string, status: number): Response {
	return new Response(JSON.stringify({ error: message }), {
		status,
		headers: JSON_HEADERS,
	})
}
export function getQuery(request: Request): string | null {
	return new URL(request.url).searchParams.get("q")
}
export function getYear(date: number) {
  return new Date(date * 1000).getFullYear().toString()
}
