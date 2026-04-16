import { z } from "zod/v4";

export const SearchResultSchema = z.object({
	title: z.string(),
	secondary: z.string(),
	year: z.string().optional(),
	image: z.string().optional(),
});

export type SearchResult = z.infer<typeof SearchResultSchema>;

const SearchResultArraySchema = z.array(SearchResultSchema);

/** axios 응답을 Zod로 검증하여 SearchResult[]를 반환 */
export function parseSearchResults(data: unknown): SearchResult[] {
	return SearchResultArraySchema.parse(data);
}
