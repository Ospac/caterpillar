import type { ClassValue } from "clsx";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/shared/utils/cn";

interface BlockInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {
	classNames?: ClassValue;
}

export function BlockInput({ type, placeholder, autoFocus, classNames, ...rest }: BlockInputProps) {
	return (
		<input
			{...rest}
			type={type}
			placeholder={placeholder}
			// biome-ignore lint/a11y/noAutofocus: 편집 시작 시 즉시 포커스 필요
			autoFocus={autoFocus}
			className={cn(
				"w-full border border-gray-400 bg-white px-1.5 py-0.5 text-[11px] outline-none nodrag",
				classNames,
			)}
		/>
	);
}
