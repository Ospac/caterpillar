import { MOCK_RESULTS } from "features/diagram/model/mock";
import type {
	BlockData,
	BookBlockData,
	GameBlockData,
	ImageBlockData,
	LinkBlockData,
	MovieBlockData,
	MusicBlockData,
	TextBlockData,
} from "features/diagram/model/type";
import { type ReactNode, useState } from "react";
import { useForm } from "react-hook-form";
import Input from "./Input";

type FormProps<T extends BlockData> = {
	data: T;
	onDataChange: (newData: BlockData) => void;
	onEditEnd: () => void;
};

function TextBlockForm({
	data,
	onDataChange,
	onEditEnd,
}: FormProps<TextBlockData>) {
	const { register } = useForm<TextBlockData>({ defaultValues: data });
	return (
		<fieldset
			className="h-full"
			onBlur={(e) => {
				if (!e.currentTarget.contains(e.relatedTarget as Element)) onEditEnd();
			}}
		>
			<textarea
				{...register("text", {
					onChange: (e) => onDataChange({ ...data, text: e.target.value }),
				})}
				// biome-ignore lint/a11y/noAutofocus: 편집 시작 시 즉시 포커스 필요
				autoFocus
				className="w-full h-full resize-none bg-transparent text-xs leading-tight outline-none p-4"
				placeholder="type"
			/>
		</fieldset>
	);
}

function ImageBlockForm({
	data,
	onDataChange,
	onEditEnd,
}: FormProps<ImageBlockData>) {
	const { register } = useForm<ImageBlockData>({
		defaultValues: data,
	});
	return (
		<fieldset
			className="h-full p-2 flex flex-col gap-1.5 "
			onBlur={(e) => {
				if (!e.currentTarget.contains(e.relatedTarget as Element)) onEditEnd();
			}}
		>
			<Input
				{...register("image", {
					onChange: (e) => {
						const url = e.target.value;
						onDataChange({ ...data, image: url });
					},
				})}
				type="url"
				placeholder="Image URL"
				autoFocus={true}
			/>
			<Input
				{...register("caption", {
					onChange: (e) => onDataChange({ ...data, caption: e.target.value }),
				})}
				type="text"
				placeholder="caption text"
			/>
			<div className="flex-1 border border-dashed border-gray-400 flex items-center justify-center text-[11px] text-gray-500">
				drag &amp; drop
			</div>
		</fieldset>
	);
}

function LinkBlockForm({
	data,
	onDataChange,
	onEditEnd,
}: FormProps<LinkBlockData>) {
	const { register, setValue } = useForm<LinkBlockData>({
		defaultValues: data,
	});
	return (
		<fieldset
			className="h-full p-2 flex flex-col gap-1.5 "
			onBlur={(e) => {
				if (!e.currentTarget.contains(e.relatedTarget as Element)) onEditEnd();
			}}
		>
			<Input
				{...register("url", {
					onChange: (e) => onDataChange({ ...data, url: e.target.value }),
					onBlur: (e) => {
						// OpenGraph stub: URL hostname을 title로 자동 채움 (M5에서 실제 fetch로 교체)
						try {
							const hostname = new URL(e.target.value).hostname;
							setValue("title", hostname);
							onDataChange({ ...data, url: e.target.value, title: hostname });
						} catch {
							// invalid URL, skip
						}
					},
				})}
				type="url"
				placeholder="URL"
				autoFocus
			/>
			<Input
				{...register("description", {
					onChange: (e) =>
						onDataChange({ ...data, description: e.target.value }),
				})}
				type="text"
				placeholder="description"
			/>
		</fieldset>
	);
}

// ─── Search-based forms ───────────────────────────────────────────────────────

interface SearchBlockFormProps<R extends { title: string }> {
	placeholder: string;
	items: readonly R[];
	filterFn: (item: R, query: string) => boolean;
	renderResult: (item: R) => { title: string; secondary: string };
	onSelect: (item: R) => void;
	onEditEnd: () => void;
	footer?: ReactNode;
}

function SearchBlockForm<R extends { title: string }>({
	placeholder,
	items,
	filterFn,
	renderResult,
	onSelect,
	onEditEnd,
	footer,
}: SearchBlockFormProps<R>) {
	const [query, setQuery] = useState("");
	const results = items.filter((r) => query.length > 0 && filterFn(r, query));
	return (
		<fieldset
			className="h-full flex flex-col "
			onBlur={(e) => {
				if (!e.currentTarget.contains(e.relatedTarget as Element)) onEditEnd();
			}}
		>
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
				{results.length > 0 ? (
					results.map((r) => {
						const { title, secondary } = renderResult(r);
						return (
							<button
								key={r.title}
								type="button"
								className=" w-full text-left px-2 py-1 text-[11px] hover:bg-gray-100"
								onMouseDown={(e) => e.preventDefault()}
								onClick={() => {
									onSelect(r);
									onEditEnd();
								}}
							>
								<span className="font-medium">{title}</span>
								<span className="text-gray-500"> {secondary}</span>
							</button>
						);
					})
				) : (
					<div className="flex h-full items-center justify-center text-[11px] text-gray-400">
						{query ? "No results" : "Type to search"}
					</div>
				)}
			</div>
			{footer}
		</fieldset>
	);
}

function MusicBlockForm({
	data,
	onDataChange,
	onEditEnd,
}: FormProps<MusicBlockData>) {
	return (
		<SearchBlockForm
			placeholder="Search music..."
			items={MOCK_RESULTS.music}
			filterFn={(r, q) =>
				r.title.toLowerCase().includes(q.toLowerCase()) ||
				r.artist.toLowerCase().includes(q.toLowerCase())
			}
			renderResult={(r) => ({ title: r.title, secondary: `— ${r.artist}` })}
			onSelect={(r) =>
				onDataChange({ ...data, title: r.title, artist: r.artist })
			}
			onEditEnd={onEditEnd}
			footer={
				data.title ? (
					<div className="border-t border-gray-300 px-2 py-1 text-[10px] text-gray-600 bg-white/50">
						{data.title}
					</div>
				) : undefined
			}
		/>
	);
}

function GameBlockForm({
	data,
	onDataChange,
	onEditEnd,
}: FormProps<GameBlockData>) {
	return (
		<SearchBlockForm
			placeholder="Search game..."
			items={MOCK_RESULTS.game}
			filterFn={(r, q) => r.title.toLowerCase().includes(q.toLowerCase())}
			renderResult={(r) => ({
				title: r.title,
				secondary: `(${r.releaseYear})`,
			})}
			onSelect={(r) =>
				onDataChange({
					...data,
					...r,
				})
			}
			onEditEnd={onEditEnd}
		/>
	);
}

function MovieBlockForm({
	data,
	onDataChange,
	onEditEnd,
}: FormProps<MovieBlockData>) {
	return (
		<SearchBlockForm
			placeholder="Search movie..."
			items={MOCK_RESULTS.movie}
			filterFn={(r, q) => r.title.toLowerCase().includes(q.toLowerCase())}
			renderResult={(r) => ({
				title: r.title,
				secondary: `(${r.releaseYear})`,
			})}
			onSelect={(r) =>
				onDataChange({
					...data,
					...r,
				})
			}
			onEditEnd={onEditEnd}
		/>
	);
}

function BookBlockForm({
	data,
	onDataChange,
	onEditEnd,
}: FormProps<BookBlockData>) {
	return (
		<SearchBlockForm
			placeholder="Search book..."
			items={MOCK_RESULTS.book}
			filterFn={(r, q) =>
				r.title.toLowerCase().includes(q.toLowerCase()) ||
				r.author.toLowerCase().includes(q.toLowerCase())
			}
			renderResult={(r) => ({ title: r.title, secondary: `— ${r.author}` })}
			onSelect={(r) => onDataChange({ ...data, ...r })}
			onEditEnd={onEditEnd}
		/>
	);
}

interface BlockEditFormProps {
	data: BlockData;
	onDataChange: (newData: BlockData) => void;
	onEditEnd: () => void;
}
export default function BlockEditForm({
	data,
	onDataChange,
	onEditEnd,
}: BlockEditFormProps) {
	switch (data.blockType) {
		case "text":
			return (
				<TextBlockForm
					data={data}
					onDataChange={onDataChange}
					onEditEnd={onEditEnd}
				/>
			);
		case "image":
			return (
				<ImageBlockForm
					data={data}
					onDataChange={onDataChange}
					onEditEnd={onEditEnd}
				/>
			);
		case "link":
			return (
				<LinkBlockForm
					data={data}
					onDataChange={onDataChange}
					onEditEnd={onEditEnd}
				/>
			);
		case "music":
			return (
				<MusicBlockForm
					data={data}
					onDataChange={onDataChange}
					onEditEnd={onEditEnd}
				/>
			);
		case "game":
			return (
				<GameBlockForm
					data={data}
					onDataChange={onDataChange}
					onEditEnd={onEditEnd}
				/>
			);
		case "movie":
			return (
				<MovieBlockForm
					data={data}
					onDataChange={onDataChange}
					onEditEnd={onEditEnd}
				/>
			);
		case "book":
			return (
				<BookBlockForm
					data={data}
					onDataChange={onDataChange}
					onEditEnd={onEditEnd}
				/>
			);
	}
}
