import { useForm } from "react-hook-form";
import type {
	BlockData,
	ImageBlockData,
	LinkBlockData,
	TextBlockData,
} from "@/features/diagram/model/blockTypes";
import Input from "./Input";
import { SearchBlockForm } from "./SearchBlockForm";

type FormProps<T extends BlockData> = {
	data: T;
	onDataChange: (newData: BlockData) => void;
	onEditEnd: () => void;
};
const handleOutsideClick = (e: React.FocusEvent, onEditEnd: () => void) => {
	if (!e.currentTarget.contains(e.relatedTarget as Element)) onEditEnd();
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
			onBlur={(e) => handleOutsideClick(e, onEditEnd)}
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
			onBlur={(e) => handleOutsideClick(e, onEditEnd)}
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
			onBlur={(e) => handleOutsideClick(e, onEditEnd)}
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
				<SearchBlockForm
					selectedData={data}
					searchType="music"
					placeholder="Search music..."
					onDataChange={onDataChange}
					onEditEnd={onEditEnd}
				/>
			);
		case "game":
			return (
				<SearchBlockForm
					selectedData={data}
					searchType="game"
					placeholder="Search game..."
					onDataChange={onDataChange}
					onEditEnd={onEditEnd}
				/>
			);
		case "movie":
			return (
				<SearchBlockForm
					selectedData={data}
					searchType="movie"
					placeholder="Search movie..."
					onDataChange={onDataChange}
					onEditEnd={onEditEnd}
				/>
			);
		case "book":
			return (
				<SearchBlockForm
					selectedData={data}
					searchType="book"
					placeholder="Search book..."
					onDataChange={onDataChange}
					onEditEnd={onEditEnd}
				/>
			);
	}
}
