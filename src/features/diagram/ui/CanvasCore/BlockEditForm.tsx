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
import { useForm } from "react-hook-form";
import Input from "./Input";
import { SearchBlockForm } from "./SearchBlockForm";

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

function MusicBlockForm({
	data,
	onDataChange,
	onEditEnd,
}: FormProps<MusicBlockData>) {
	return (
		<SearchBlockForm
			searchType="music"
			placeholder="Search music..."
			onSelect={(r) =>
				onDataChange({ ...data, title: r.title, artist: r.secondary })
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
			searchType="game"
			placeholder="Search game..."
			onSelect={(r) =>
				onDataChange({
					...data,
					title: r.title,
					releaseYear: r.secondary ? Number.parseInt(r.secondary, 10) || undefined : undefined,
					image: r.image,
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
			searchType="movie"
			placeholder="Search movie..."
			onSelect={(r) =>
				onDataChange({
					...data,
					title: r.title,
					releaseYear: r.secondary ? Number.parseInt(r.secondary, 10) || undefined : undefined,
					image: r.image,
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
			searchType="book"
			placeholder="Search book..."
			onSelect={(r) =>
				onDataChange({ ...data, title: r.title, author: r.secondary, image: r.image })
			}
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
