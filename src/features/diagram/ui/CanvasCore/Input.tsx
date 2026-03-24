import type { ClassValue } from "clsx";
import { cn } from "shared/utils/cn";

interface InputProps {
	type: string;
	placeholder: string;
	autoFocus?: boolean;
	classNames?: ClassValue;
}

export default function Input({
	type,
	placeholder,
	autoFocus,
	classNames,
	...rest
}: InputProps) {
	return (
		<input
			{...rest}
			type={type}
			placeholder={placeholder}
			// biome-ignore lint/a11y/noAutofocus: 편집 시작 시 즉시 포커스 필요
			autoFocus={autoFocus}
			className={cn(
				`w-full border border-gray-400 bg-white px-1.5 py-0.5 text-[11px] outline-none`,
				classNames,
			)}
		/>
	);
}
