import {
	type RefObject,
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import {
	GRID_COLUMN_COUNT,
	GRID_ROW_COUNT,
	getGridPixelSize,
} from "../grid";
import {
	GRID_ZOOM_BUTTON_CELL_STEP,
	getCellAlignedAnchoredScrollOffset,
	getClampedVisibleCellCount,
	getGridZoomForVisibleCells,
	getNextGridVisibleCellCount,
	getResponsiveGridVisibleCellCount,
	getVisibleCellCountBounds,
	getWheelGridVisibleCellCount,
	isGridZoomWheelEvent,
} from "../zoom";

const GRID_PIXEL_SIZE = getGridPixelSize();
const ZOOM_GUIDE_VISIBLE_MS = 600;

interface ZoomAnchor {
	flowX: number;
	flowY: number;
	anchorX: number;
	anchorY: number;
}

interface PointerPosition {
	clientX: number;
	clientY: number;
}

interface CanvasZoom {
	scrollContainerRef: RefObject<HTMLDivElement | null>;
	gridZoom: number;
	minGridZoom: number;
	maxGridZoom: number;
	renderedGridSize: {
		width: number;
		height: number;
	};
	isZooming: boolean;
	zoomIn: () => void;
	zoomOut: () => void;
	resetZoom: () => void;
}

export function useCanvasZoom(): CanvasZoom {
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const pendingAnchorRef = useRef<ZoomAnchor | null>(null);
	const zoomGuideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);
	const [containerWidth, setContainerWidth] = useState(0);
	const [manualVisibleCellCount, setManualVisibleCellCount] = useState<
		number | null
	>(null);
	const [isZooming, setIsZooming] = useState(false);

	const responsiveVisibleCellCount =
		getResponsiveGridVisibleCellCount(containerWidth);
	const visibleCellCountBounds = getVisibleCellCountBounds(containerWidth);
	const visibleCellCount = manualVisibleCellCount ?? responsiveVisibleCellCount;
	const gridZoom = getGridZoomForVisibleCells(containerWidth, visibleCellCount);
	const minGridZoom = getGridZoomForVisibleCells(
		containerWidth,
		responsiveVisibleCellCount,
	);
	const maxGridZoom = getGridZoomForVisibleCells(
		containerWidth,
		visibleCellCountBounds.min,
	);

	const captureZoomAnchor = useCallback(
		(pointer?: PointerPosition): ZoomAnchor | null => {
			const container = scrollContainerRef.current;
			if (!container) return null;

			const rect = pointer ? container.getBoundingClientRect() : null;
			const anchorX = pointer
				? pointer.clientX - (rect?.left ?? 0)
				: container.clientWidth / 2;
			const anchorY = pointer
				? pointer.clientY - (rect?.top ?? 0)
				: container.clientHeight / 2;

			return {
				flowX: (container.scrollLeft + anchorX) / gridZoom,
				flowY: (container.scrollTop + anchorY) / gridZoom,
				anchorX,
				anchorY,
			};
		},
		[gridZoom],
	);

	const showZoomGuide = useCallback(() => {
		if (zoomGuideTimeoutRef.current) {
			clearTimeout(zoomGuideTimeoutRef.current);
		}

		setIsZooming(true);
		zoomGuideTimeoutRef.current = setTimeout(() => {
			setIsZooming(false);
			zoomGuideTimeoutRef.current = null;
		}, ZOOM_GUIDE_VISIBLE_MS);
	}, []);

	const applyVisibleCellCount = useCallback(
		(nextVisibleCellCount: number, pointer?: PointerPosition) => {
			const clampedVisibleCellCount = getClampedVisibleCellCount(
				containerWidth,
				nextVisibleCellCount,
			);
			if (clampedVisibleCellCount === visibleCellCount) return;

			pendingAnchorRef.current = captureZoomAnchor(pointer);
			showZoomGuide();
			setManualVisibleCellCount(clampedVisibleCellCount);
		},
		[captureZoomAnchor, containerWidth, showZoomGuide, visibleCellCount],
	);

	const zoomIn = useCallback(() => {
		applyVisibleCellCount(
			getNextGridVisibleCellCount(
				visibleCellCount,
				containerWidth,
				-GRID_ZOOM_BUTTON_CELL_STEP,
			),
		);
	}, [applyVisibleCellCount, containerWidth, visibleCellCount]);

	const zoomOut = useCallback(() => {
		applyVisibleCellCount(
			getNextGridVisibleCellCount(
				visibleCellCount,
				containerWidth,
				GRID_ZOOM_BUTTON_CELL_STEP,
			),
		);
	}, [applyVisibleCellCount, containerWidth, visibleCellCount]);

	const resetZoom = useCallback(() => {
		if (manualVisibleCellCount === null) return;

		if (responsiveVisibleCellCount === visibleCellCount) {
			setManualVisibleCellCount(null);
			return;
		}

		pendingAnchorRef.current = captureZoomAnchor();
		showZoomGuide();
		setManualVisibleCellCount(null);
	}, [
		captureZoomAnchor,
		manualVisibleCellCount,
		responsiveVisibleCellCount,
		showZoomGuide,
		visibleCellCount,
	]);

	useEffect(() => {
		const container = scrollContainerRef.current;
		if (!container) return;

		const updateContainerWidth = () => {
			setContainerWidth(container.clientWidth);
		};
		const observer = new ResizeObserver(updateContainerWidth);

		updateContainerWidth();
		observer.observe(container);

		return () => observer.disconnect();
	}, []);

	useEffect(() => {
		const container = scrollContainerRef.current;
		if (!container) return;

		const handleWheel = (event: WheelEvent) => {
			if (!isGridZoomWheelEvent(event)) return;

			event.preventDefault();
			applyVisibleCellCount(
				getWheelGridVisibleCellCount(
					visibleCellCount,
					event.deltaY,
					containerWidth,
				),
				event,
			);
		};

		container.addEventListener("wheel", handleWheel, { passive: false });
		return () => container.removeEventListener("wheel", handleWheel);
	}, [applyVisibleCellCount, containerWidth, visibleCellCount]);

	useEffect(() => {
		return () => {
			if (zoomGuideTimeoutRef.current) {
				clearTimeout(zoomGuideTimeoutRef.current);
			}
		};
	}, []);

	useLayoutEffect(() => {
		const container = scrollContainerRef.current;
		const anchor = pendingAnchorRef.current;
		if (!container || !anchor) return;

		container.scrollLeft = getCellAlignedAnchoredScrollOffset(
			anchor.flowX,
			anchor.anchorX,
			gridZoom,
			container.clientWidth,
			GRID_COLUMN_COUNT,
		);
		container.scrollTop = getCellAlignedAnchoredScrollOffset(
			anchor.flowY,
			anchor.anchorY,
			gridZoom,
			container.clientHeight,
			GRID_ROW_COUNT,
		);
		pendingAnchorRef.current = null;
	}, [gridZoom]);

	return {
		scrollContainerRef,
		gridZoom,
		minGridZoom,
		maxGridZoom,
		renderedGridSize: {
			width: GRID_PIXEL_SIZE.width * gridZoom,
			height: GRID_PIXEL_SIZE.height * gridZoom,
		},
		isZooming,
		zoomIn,
		zoomOut,
		resetZoom,
	};
}
