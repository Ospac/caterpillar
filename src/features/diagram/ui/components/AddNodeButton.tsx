type AddNodeButtonProps = {
	onClick: () => void;
};

export function AddNodeButton({ onClick }: AddNodeButtonProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
		>
			Add Node
		</button>
	);
}
