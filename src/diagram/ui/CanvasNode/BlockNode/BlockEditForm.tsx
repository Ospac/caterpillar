import { useForm } from "react-hook-form";
import type {
	BlockData,
	ImageBlockData,
	LinkBlockData,
	TextBlockData,
} from "@/diagram/model/blockTypes";
import { BlockInput } from "./BlockInput";
import { SearchBlockEditForm } from "./SearchBlockEditForm";

type FormProps<T extends BlockData> = {
	data: T;
	onDataChange: (newData: BlockData) => void;
	onEditEnd: () => void;
};

const handleOutsideClick = (e: React.FocusEvent, onEditEnd: () => void) => {
	if (!e.currentTarget.contains(e.relatedTarget as Element)) onEditEnd();
};

function TextBlockForm({ data, onDataChange, onEditEnd }: FormProps<TextBlockData>) {
	const { register } = useForm<TextBlockData>({ defaultValues: data });
	return (
		<fieldset className="h-full" onBlur={(e) => handleOutsideClick(e, onEditEnd)}>
			<textarea
				{...register("title", {
					onChange: (e) => onDataChange({ ...data, title: e.target.value }),
				})}
				autoFocus
				className="w-full h-full resize-none bg-transparent text-xs leading-tight outline-none p-4 nodrag"
				placeholder="type"
			/>
		</fieldset>
	);
}

function ImageBlockForm({ data, onDataChange, onEditEnd }: FormProps<ImageBlockData>) {
	const { register } = useForm<ImageBlockData>({ defaultValues: data });
	return (
		<fieldset
			className="h-full p-2 flex flex-col gap-1.5 "
			onBlur={(e) => handleOutsideClick(e, onEditEnd)}
		>
			<BlockInput
				{...register("image", {
					onChange: (e) => onDataChange({ ...data, image: e.target.value }),
				})}
				type="url"
				placeholder="Image URL"
				autoFocus
			/>
			<BlockInput
				{...register("title", {
					onChange: (e) => onDataChange({ ...data, title: e.target.value }),
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

function LinkBlockForm({ data, onDataChange, onEditEnd }: FormProps<LinkBlockData>) {
	const { register } = useForm<LinkBlockData>({ defaultValues: data });
	return (
		<fieldset
			className="h-full p-2 flex flex-col gap-1.5 "
			onBlur={(e) => handleOutsideClick(e, onEditEnd)}
		>
			<BlockInput
				{...register("title", {
					onChange: (e) => onDataChange({ ...data, title: e.target.value }),
				})}
				type="url"
				placeholder="URL"
				autoFocus
			/>
			<BlockInput
				{...register("secondary", {
					onChange: (e) => onDataChange({ ...data, secondary: e.target.value }),
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

export function BlockEditForm({ data, onDataChange, onEditEnd }: BlockEditFormProps) {
	switch (data.blockType) {
		case "text":
			return <TextBlockForm data={data} onDataChange={onDataChange} onEditEnd={onEditEnd} />;
		case "image":
			return <ImageBlockForm data={data} onDataChange={onDataChange} onEditEnd={onEditEnd} />;
		case "link":
			return <LinkBlockForm data={data} onDataChange={onDataChange} onEditEnd={onEditEnd} />;
		case "music":
		case "game":
		case "movie":
		case "book":
			return (
				<SearchBlockEditForm
					selectedData={data}
					searchType={data.blockType}
					placeholder={`Search ${data.blockType}...`}
					onDataChange={onDataChange}
					onEditEnd={onEditEnd}
				/>
			);
	}
}
