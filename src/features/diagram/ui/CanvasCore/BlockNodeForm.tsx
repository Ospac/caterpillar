// ─── Forms ────────────────────────────────────────────────────────────────────

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
import { type JSX, useState } from "react";
import { Controller, useForm } from "react-hook-form";

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
	const { control } = useForm<TextBlockData>({ defaultValues: data });
	return (
		<fieldset
			className="h-full"
			onBlur={(e) => {
				if (!e.currentTarget.contains(e.relatedTarget as Element)) onEditEnd();
			}}
		>
			<Controller
				control={control}
				name="text"
				render={({ field }) => (
					<textarea
						{...field}
						value={field.value ?? ""}
						// biome-ignore lint/a11y/noAutofocus: 편집 시작 시 즉시 포커스 필요
						autoFocus
						className="w-full h-full resize-none bg-transparent text-[12px] leading-tight outline-none p-2"
						onChange={(e) => {
							field.onChange(e);
							onDataChange({ ...data, text: e.target.value });
						}}
					/>
				)}
			/>
		</fieldset>
	);
}

function ImageBlockForm({
	data,
	onDataChange,
	onEditEnd,
}: FormProps<ImageBlockData>) {
	const { control, setValue } = useForm<ImageBlockData>({
		defaultValues: data,
	});
	return (
		<fieldset
			className="h-full p-2 flex flex-col gap-1.5 "
			onBlur={(e) => {
				if (!e.currentTarget.contains(e.relatedTarget as Element)) onEditEnd();
			}}
		>
			<Controller
				control={control}
				name="imageUrl"
				render={({ field }) => (
					<input
						{...field}
						value={field.value ?? ""}
						type="url"
						placeholder="Image URL"
						// biome-ignore lint/a11y/noAutofocus: 편집 시작 시 즉시 포커스 필요
						autoFocus
						className="w-full border border-gray-400 bg-white px-1.5 py-0.5 text-[11px] outline-none"
						onChange={(e) => {
							field.onChange(e);
							const url = e.target.value;
							const filename = url.split("/").pop()?.split("?")[0] ?? "";
							setValue("alt", filename);
							onDataChange({ ...data, imageUrl: url, alt: filename });
						}}
					/>
				)}
			/>
			<Controller
				control={control}
				name="alt"
				render={({ field }) => (
					<input
						{...field}
						value={field.value ?? ""}
						type="text"
						placeholder="Alt text"
						className="w-full border border-gray-400 bg-white px-1.5 py-0.5 text-[11px] outline-none"
						onChange={(e) => {
							field.onChange(e);
							onDataChange({ ...data, alt: e.target.value });
						}}
					/>
				)}
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
	const { control, setValue } = useForm<LinkBlockData>({ defaultValues: data });
	return (
		<fieldset
			className="h-full p-2 flex flex-col gap-1.5 "
			onBlur={(e) => {
				if (!e.currentTarget.contains(e.relatedTarget as Element)) onEditEnd();
			}}
		>
			<Controller
				control={control}
				name="url"
				render={({ field }) => (
					<input
						{...field}
						value={field.value ?? ""}
						type="url"
						placeholder="URL"
						// biome-ignore lint/a11y/noAutofocus: 편집 시작 시 즉시 포커스 필요
						autoFocus
						className="w-full border border-gray-400 bg-white px-1.5 py-0.5 text-[11px] outline-none"
						onChange={(e) => {
							field.onChange(e);
							onDataChange({ ...data, url: e.target.value });
						}}
						onBlur={(e) => {
							// OpenGraph stub: URL hostname을 title로 자동 채움 (M5에서 실제 fetch로 교체)
							const url = e.target.value;
							try {
								const hostname = new URL(url).hostname;
								setValue("title", hostname);
								onDataChange({ ...data, url, title: hostname });
							} catch {
								// invalid URL, skip
							}
						}}
					/>
				)}
			/>
			<Controller
				control={control}
				name="title"
				render={({ field }) => (
					<input
						{...field}
						value={field.value ?? ""}
						type="text"
						placeholder="Title"
						className="w-full border border-gray-400 bg-white px-1.5 py-0.5 text-[11px] outline-none"
						onChange={(e) => {
							field.onChange(e);
							onDataChange({ ...data, title: e.target.value });
						}}
					/>
				)}
			/>
			<Controller
				control={control}
				name="description"
				render={({ field }) => (
					<input
						{...field}
						value={field.value ?? ""}
						type="text"
						placeholder="Description"
						className="w-full border border-gray-400 bg-white px-1.5 py-0.5 text-[11px] outline-none"
						onChange={(e) => {
							field.onChange(e);
							onDataChange({ ...data, description: e.target.value });
						}}
					/>
				)}
			/>
		</fieldset>
	);
}

// ─── Search-based forms ───────────────────────────────────────────────────────

function MusicBlockForm({
	data,
	onDataChange,
	onEditEnd,
}: FormProps<MusicBlockData>) {
	const [query, setQuery] = useState("");
	const results = MOCK_RESULTS.music.filter(
		(r) =>
			query.length > 0 &&
			(r.title.toLowerCase().includes(query.toLowerCase()) ||
				r.artist.toLowerCase().includes(query.toLowerCase())),
	);
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
				placeholder="Search music..."
				// biome-ignore lint/a11y/noAutofocus: 편집 시작 시 즉시 포커스 필요
				autoFocus
				className=" w-full border-b border-gray-400 bg-transparent px-2 py-1 text-[11px] outline-none"
				onChange={(e) => setQuery(e.target.value)}
			/>
			<div className="flex-1 overflow-y-auto">
				{results.length > 0 ? (
					results.map((r) => (
						<button
							key={r.title}
							type="button"
							className=" w-full text-left px-2 py-1 text-[11px] hover:bg-gray-100"
							onMouseDown={(e) => e.preventDefault()}
							onClick={() => {
								onDataChange({ ...data, title: r.title, artist: r.artist });
								onEditEnd();
							}}
						>
							<span className="font-medium">{r.title}</span>
							<span className="text-gray-500"> — {r.artist}</span>
						</button>
					))
				) : (
					<div className="flex h-full items-center justify-center text-[11px] text-gray-400">
						{query ? "No results" : "Type to search"}
					</div>
				)}
			</div>
			{data.title && (
				<div className="border-t border-gray-300 px-2 py-1 text-[10px] text-gray-600 bg-white/50">
					{data.title}
				</div>
			)}
		</fieldset>
	);
}

function GameBlockForm({
	data,
	onDataChange,
	onEditEnd,
}: FormProps<GameBlockData>) {
	const [query, setQuery] = useState("");
	const results = MOCK_RESULTS.game.filter(
		(r) =>
			query.length > 0 && r.title.toLowerCase().includes(query.toLowerCase()),
	);
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
				placeholder="Search game..."
				// biome-ignore lint/a11y/noAutofocus: 편집 시작 시 즉시 포커스 필요
				autoFocus
				className=" w-full border-b border-gray-400 bg-transparent px-2 py-1 text-[11px] outline-none"
				onChange={(e) => setQuery(e.target.value)}
			/>
			<div className="flex-1 overflow-y-auto">
				{results.length > 0 ? (
					results.map((r) => (
						<button
							key={r.title}
							type="button"
							className=" w-full text-left px-2 py-1 text-[11px] hover:bg-gray-100"
							onMouseDown={(e) => e.preventDefault()}
							onClick={() => {
								onDataChange({
									...data,
									title: r.title,
									releaseYear: r.releaseYear,
								});
								onEditEnd();
							}}
						>
							<span className="font-medium">{r.title}</span>
							<span className="text-gray-500"> ({r.releaseYear})</span>
						</button>
					))
				) : (
					<div className="flex h-full items-center justify-center text-[11px] text-gray-400">
						{query ? "No results" : "Type to search"}
					</div>
				)}
			</div>
		</fieldset>
	);
}

function MovieBlockForm({
	data,
	onDataChange,
	onEditEnd,
}: FormProps<MovieBlockData>) {
	const [query, setQuery] = useState("");
	const results = MOCK_RESULTS.movie.filter(
		(r) =>
			query.length > 0 && r.title.toLowerCase().includes(query.toLowerCase()),
	);
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
				placeholder="Search movie..."
				// biome-ignore lint/a11y/noAutofocus: 편집 시작 시 즉시 포커스 필요
				autoFocus
				className=" w-full border-b border-gray-400 bg-transparent px-2 py-1 text-[11px] outline-none"
				onChange={(e) => setQuery(e.target.value)}
			/>
			<div className="flex-1 overflow-y-auto">
				{results.length > 0 ? (
					results.map((r) => (
						<button
							key={r.title}
							type="button"
							className=" w-full text-left px-2 py-1 text-[11px] hover:bg-gray-100"
							onMouseDown={(e) => e.preventDefault()}
							onClick={() => {
								onDataChange({
									...data,
									title: r.title,
									releaseYear: r.releaseYear,
								});
								onEditEnd();
							}}
						>
							<span className="font-medium">{r.title}</span>
							<span className="text-gray-500"> ({r.releaseYear})</span>
						</button>
					))
				) : (
					<div className="flex h-full items-center justify-center text-[11px] text-gray-400">
						{query ? "No results" : "Type to search"}
					</div>
				)}
			</div>
		</fieldset>
	);
}

function BookBlockForm({
	data,
	onDataChange,
	onEditEnd,
}: FormProps<BookBlockData>) {
	const [query, setQuery] = useState("");
	const results = MOCK_RESULTS.book.filter(
		(r) =>
			query.length > 0 &&
			(r.title.toLowerCase().includes(query.toLowerCase()) ||
				r.author.toLowerCase().includes(query.toLowerCase())),
	);
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
				placeholder="Search book..."
				// biome-ignore lint/a11y/noAutofocus: 편집 시작 시 즉시 포커스 필요
				autoFocus
				className=" w-full border-b border-gray-400 bg-transparent px-2 py-1 text-[11px] outline-none"
				onChange={(e) => setQuery(e.target.value)}
			/>
			<div className="flex-1 overflow-y-auto">
				{results.length > 0 ? (
					results.map((r) => (
						<button
							key={r.title}
							type="button"
							className=" w-full text-left px-2 py-1 text-[11px] hover:bg-gray-100"
							onMouseDown={(e) => e.preventDefault()}
							onClick={() => {
								onDataChange({ ...data, title: r.title, author: r.author });
								onEditEnd();
							}}
						>
							<span className="font-medium">{r.title}</span>
							<span className="text-gray-500"> — {r.author}</span>
						</button>
					))
				) : (
					<div className="flex h-full items-center justify-center text-[11px] text-gray-400">
						{query ? "No results" : "Type to search"}
					</div>
				)}
			</div>
		</fieldset>
	);
}

export function renderEditForm(
	data: BlockData,
	onDataChange: (newData: BlockData) => void,
	onEditEnd: () => void,
): JSX.Element {
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
