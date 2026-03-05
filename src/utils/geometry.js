/* ── Numeric clamp ── */
export function clamp(value, min, max) {
	return Math.max(min, Math.min(max, value));
}

/* ── Snap a value to the nearest multiple of step ── */
export function snapToGrid(v, step = 5) {
	return Math.round(v / step) * step;
}

/*
 * ── Snap x/y to edges of neighbouring tables ──
 *
 * For each of the dragging table's 4 edges (left, right, top, bottom) check
 * whether it is within threshold pixels of any edge of any other table.
 * The first match per axis wins (left/right share x-axis, top/bottom share y-axis).
 *
 * others   : array of table objects with a `layout` field
 * threshold: snap distance in pixels
 */
export function snapToEdges(x, y, w, h, others, threshold = 8) {
	let snappedX = x;
	let snappedY = y;

	for (const o of others) {
		const { x: ox, y: oy, width: ow, height: oh } = o.layout;

		/* X-axis: snap left edge of dragging table to left or right edge of other,
		   OR snap right edge of dragging table to left or right edge of other */
		if (snappedX === x) {
			if (Math.abs(x - ox) < threshold) snappedX = ox;
			else if (Math.abs(x - (ox + ow)) < threshold) snappedX = ox + ow;
			else if (Math.abs(x + w - ox) < threshold) snappedX = ox - w;
			else if (Math.abs(x + w - (ox + ow)) < threshold) snappedX = ox + ow - w;
		}

		/* Y-axis: same pattern for top/bottom edges */
		if (snappedY === y) {
			if (Math.abs(y - oy) < threshold) snappedY = oy;
			else if (Math.abs(y - (oy + oh)) < threshold) snappedY = oy + oh;
			else if (Math.abs(y + h - oy) < threshold) snappedY = oy - h;
			else if (Math.abs(y + h - (oy + oh)) < threshold) snappedY = oy + oh - h;
		}
	}

	return { x: snappedX, y: snappedY };
}

/* ── Angle in degrees from a center point to a cursor point ── */
export function angleToCursor(centerX, centerY, cursorX, cursorY) {
	/* atan2 returns radians relative to 3 o'clock; add 90° so 0° = 12 o'clock */
	const rad = Math.atan2(cursorY - centerY, cursorX - centerX);
	return (rad * 180) / Math.PI + 90;
}

/* ── Optionally snap an angle to the nearest multiple of step degrees ── */
export function snapAngle(angle, step = 15) {
	return Math.round(angle / step) * step;
}

/*
 * ── Compute updated position + dimensions when a resize handle is dragged ──
 *
 * handle  : 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'
 * initial : { x, y, width, height } recorded at pointerdown
 * dx, dy  : pointer displacement from initial contact point
 * snapStep: snap width/height to this grid (0 = no snap)
 * minSize : minimum width / height in pixels
 *
 * The table's centre point is kept fixed: both opposite sides move equally,
 * so the surrounding furniture arrangement is not disturbed.
 */
export function applyResize(handle, initial, dx, dy, snapStep = 5, minSize = 40) {
	/* Centre of the table stays fixed throughout the resize */
	const cx = initial.x + initial.width / 2;
	const cy = initial.y + initial.height / 2;

	let newWidth = initial.width;
	let newHeight = initial.height;

	/* Each handle contributes to one or both dimensions.
	   Because the centre is fixed, the effective delta is doubled
	   (dragging the east handle outward by d pixels grows width by 2d). */
	if (handle.includes('e')) newWidth = Math.max(minSize, initial.width + 2 * dx);
	if (handle.includes('w')) newWidth = Math.max(minSize, initial.width - 2 * dx);
	if (handle.includes('s')) newHeight = Math.max(minSize, initial.height + 2 * dy);
	if (handle.includes('n')) newHeight = Math.max(minSize, initial.height - 2 * dy);

	/* Snap dimensions to the requested grid step */
	if (snapStep > 0) {
		newWidth = snapToGrid(newWidth, snapStep);
		newHeight = snapToGrid(newHeight, snapStep);
		/* Re-apply minimum after snap */
		newWidth = Math.max(minSize, newWidth);
		newHeight = Math.max(minSize, newHeight);
	}

	return {
		x: cx - newWidth / 2,
		y: cy - newHeight / 2,
		width: newWidth,
		height: newHeight,
	};
}
