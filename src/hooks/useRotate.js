import { useRef, useCallback } from 'react';
import { angleToCursor, snapAngle } from '../utils/geometry.js';

/*
 * Returns pointer handlers for interactive table rotation.
 *
 * onRotate(degrees) is called on every pointermove.
 * onRotateEnd(degrees) is called on pointerup.
 * snap : when true rotation snaps to the nearest 15° increment.
 *
 * The consumer must pass the table's current center in canvas coordinates
 * via centerRef.current = { x, y } before the drag begins (or keep it
 * updated so the hook always has the latest value).
 */
export function useRotate({ onRotate, onRotateEnd, snap = true }) {
	const centerRef = useRef(null);
	const active = useRef(false);

	const handlePointerDown = useCallback((e, center) => {
		e.stopPropagation();
		e.currentTarget.setPointerCapture(e.pointerId);
		centerRef.current = center;
		active.current = true;
	}, []);

	const handlePointerMove = useCallback(
		(e) => {
			if (!active.current || !centerRef.current) return;
			let angle = angleToCursor(centerRef.current.x, centerRef.current.y, e.clientX, e.clientY);
			if (snap) angle = snapAngle(angle);
			onRotate(angle);
		},
		[onRotate, snap],
	);

	const handlePointerUp = useCallback(
		(e) => {
			if (!active.current || !centerRef.current) return;
			let angle = angleToCursor(centerRef.current.x, centerRef.current.y, e.clientX, e.clientY);
			if (snap) angle = snapAngle(angle);
			active.current = false;
			centerRef.current = null;
			onRotateEnd?.(angle);
		},
		[onRotateEnd, snap],
	);

	return { handlePointerDown, handlePointerMove, handlePointerUp };
}
