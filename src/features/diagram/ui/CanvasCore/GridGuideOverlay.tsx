import { useId } from "react";
import { getStagePixelSize, NODE_SIZE } from "../../lib/grid";
import type { GridStage } from "../../lib/type";

const CELL_MARGIN = 2;
const CELL_STROKE_WIDTH = 1;
const CELL_STROKE_COLOR = "rgba(188, 0, 235, 0.5)";
const CELL_FILL = "rgba(0, 0, 0, 0)";
const NOISE_FILTER_SCALE = 2;

export default function GridGuideOverlay({ stage }: { stage: GridStage }) {
	const size = getStagePixelSize(stage);
	const patternId = useId();
	const noiseFilterId = useId();
	return (
		<svg
			className="pointer-events-none absolute left-0 top-0 z-10"
			width={size}
			height={size}
			viewBox={`0 0 ${size} ${size}`}
			aria-hidden="true"
		>
			<defs>
				<filter
					id={noiseFilterId}
					x="0"
					y="0"
					width="225"
					height="225"
					filterUnits="userSpaceOnUse"
					colorInterpolationFilters="sRGB"
				>
					<feFlood floodOpacity="0" result="BackgroundImageFix" />
					<feBlend
						mode="normal"
						in="SourceGraphic"
						in2="BackgroundImageFix"
						result="shape"
					/>
					<feTurbulence
						type="fractalNoise"
						baseFrequency="0.05000000074505806 0.05000000074505806"
						numOctaves="3"
						seed="6650"
					/>
					<feDisplacementMap
						in="shape"
						scale={NOISE_FILTER_SCALE}
						xChannelSelector="R"
						yChannelSelector="G"
						result="displacedImage"
						width="100%"
						height="100%"
					/>
					<feMerge result="effect1_texture_74_170">
						<feMergeNode in="displacedImage" />
					</feMerge>
				</filter>

				<pattern
					id={patternId}
					x="0"
					y="0"
					width={NODE_SIZE}
					height={NODE_SIZE}
					patternUnits="userSpaceOnUse"
				>
					<rect
						filter={`url(#${noiseFilterId})`}
						stroke={CELL_STROKE_COLOR}
						x={CELL_MARGIN}
						y={CELL_MARGIN}
						width={NODE_SIZE - CELL_MARGIN * 2}
						height={NODE_SIZE - CELL_MARGIN * 2}
						fill={CELL_FILL}
						strokeWidth={CELL_STROKE_WIDTH}
					/>
				</pattern>
			</defs>
			<rect
				x="0"
				y="0"
				width={size}
				height={size}
				fill={`url(#${patternId})`}
			/>
		</svg>
	);
}
