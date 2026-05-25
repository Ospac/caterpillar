import { useQuery } from "@tanstack/react-query";
import defaultImage from "@/assets/frankenstein.webp";
import type { SearchType } from "@/features/diagram/lib/api/searchApi";
import { searchQueries } from "@/features/diagram/lib/api/searchQueries";
import type { SearchResult } from "@/features/diagram/lib/api/types";
import { useDebouncedValue } from "@/features/diagram/lib/hooks/useDebouncedValue";
import type {
	BlockData,
	SearchBlockData,
} from "@/features/diagram/model/blockTypes";
import { useState } from "react";

interface SearchBlockFormProps {
	selectedData: SearchBlockData;
	searchType: SearchType;
	placeholder: string;
	onDataChange: (newData: BlockData) => void;
	onEditEnd: () => void;
}

export function SearchBlockForm({
	selectedData,
	searchType,
	placeholder,
	onDataChange,
	onEditEnd,
}: SearchBlockFormProps) {
	const [query, setQuery] = useState("");
	const debouncedQuery = useDebouncedValue(query, 300);
	const { data, isLoading, isError, refetch } = useQuery(
		searchQueries[searchType](debouncedQuery),
	);
	const onItemSelect = (item: SearchResult) => {
		onDataChange({
			...selectedData,
			title: item.title,
			secondary: item.secondary,
			image: item.image,
			year: item.year,
		});
	};
	const items = data ?? [];
	return (
		<fieldset className="h-full flex flex-col ">
			<input
				type="text"
				value={query}
				placeholder={placeholder}
				// biome-ignore lint/a11y/noAutofocus: 편집 시작 시 즉시 포커스 필요
				autoFocus
				className=" w-full border-b border-gray-400 bg-transparent px-2 py-1 text-[11px] outline-none"
				onChange={(e) => setQuery(e.target.value)}
			/>
			<div className="flex-1 overflow-y-auto">
				{isError ? (
					<div className="flex h-full flex-col items-center justify-center gap-1.5 text-[11px] text-red-500">
						<span>검색 중 오류가 발생했습니다</span>
						<button
							type="button"
							className="text-[10px] text-gray-500 underline"
							onMouseDown={(e) => e.preventDefault()}
							onClick={() => refetch()}
						>
							재시도
						</button>
					</div>
				) : isLoading ? (
					<div className="flex h-full items-center justify-center text-[11px] text-gray-400">
						검색 중...
					</div>
				) : items.length > 0 ? (
					items.map((r) => (
						<button
							key={r.title + r.secondary}
							type="button"
							className="flex gap-2 w-full text-left px-2 py-1 text-[11px] hover:bg-gray-100"
							onMouseDown={(e) => e.preventDefault()}
							onClick={() => {
								onItemSelect(r);
								onEditEnd();
							}}
						>
							<img
								className="w-8 h-8 inline"
								src={r.image || defaultImage}
								alt={r.title}
							/>
							<div className="flex flex-col gap-1">
								<span className="font-medium">{r.title}</span>
								<span className="text-gray-500"> {r.secondary}</span>
							</div>
						</button>
					))
				) : (
					<div className="flex h-full items-center justify-center text-[11px] text-gray-400">
						{debouncedQuery.length >= 2 ? "결과 없음" : "검색어를 입력하세요"}
					</div>
				)}
			</div>
			{!query && selectedData.title && (
				<button
					type="button"
					onClick={onEditEnd}
					className="flex gap-1 border-t border-gray-300 px-2 py-1 text-[10px] text-gray-600 bg-white/50"
				>
					<span className="font-medium">{selectedData.title}</span>
					<span className="text-gray-400"> {selectedData.secondary}</span>
				</button>
			)}
		</fieldset>
	);
}
