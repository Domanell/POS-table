import { useRef, useCallback } from 'react';

/*
 * Returns an onPointerDown handler that drives a drag operation.
 *
 * onMove(dx, dy, e) is called on every pointermove after the initial press.
 * onEnd(dx, dy, e)  is called when the pointer is released.
 *
 * setPointerCapture ensures the element continues receiving events even if the
 * pointer moves outside the element boundary during drag.
 */
export function useDrag({ onMove, onEnd }) {
	const origin = useRef(null);

	const handlePointerDown = useCallback((e) => {
		/* Only track primary button / first touch */
		if (e.button !== undefined && e.button !== 0) return;
		e.stopPropagation();
		e.currentTarget.setPointerCapture(e.pointerId);
		origin.current = { x: e.clientX, y: e.clientY };
	}, []);

	const handlePointerMove = useCallback(
		(e) => {
			if (!origin.current) return;
			const dx = e.clientX - origin.current.x;
			const dy = e.clientY - origin.current.y;
			onMove(dx, dy, e);
		},
		[onMove],
	);

	const handlePointerUp = useCallback(
		(e) => {
			if (!origin.current) return;
			const dx = e.clientX - origin.current.x;
			const dy = e.clientY - origin.current.y;
			origin.current = null;
			onEnd?.(dx, dy, e);
		},
		[onEnd],
	);

	return { handlePointerDown, handlePointerMove, handlePointerUp };
}
