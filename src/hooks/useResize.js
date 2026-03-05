import { useRef, useCallback } from 'react';
import { applyResize } from '../utils/geometry.js';

/*
 * Returns per-handle pointer handlers for interactive table resizing.
 *
 * onResize({ x, y, width, height }) is called on every pointermove.
 * onResizeEnd({ x, y, width, height }) is called on pointerup.
 *
 * initialBounds : { x, y, width, height } of the table at the time
 *                 makeHandlerFor is invoked — frozen at pointerdown.
 */
export function useResize({ onResize, onResizeEnd }) {
	const state = useRef(null);

	/* Builds an onPointerDown handler for a specific resize handle. */
	const makeHandlerFor = useCallback(
		(handle, currentBounds) => (e) => {
			e.stopPropagation();
			e.currentTarget.setPointerCapture(e.pointerId);
			state.current = {
				handle,
				origin: { x: e.clientX, y: e.clientY },
				initial: { ...currentBounds },
			};
		},
		[],
	);

	const handlePointerMove = useCallback(
		(e) => {
			if (!state.current) return;
			const { handle, origin, initial } = state.current;
			const dx = e.clientX - origin.x;
			const dy = e.clientY - origin.y;
			onResize(applyResize(handle, initial, dx, dy));
		},
		[onResize],
	);

	const handlePointerUp = useCallback(
		(e) => {
			if (!state.current) return;
			const { handle, origin, initial } = state.current;
			const dx = e.clientX - origin.x;
			const dy = e.clientY - origin.y;
			state.current = null;
			onResizeEnd?.(applyResize(handle, initial, dx, dy));
		},
		[onResizeEnd],
	);

	return { makeHandlerFor, handlePointerMove, handlePointerUp };
}
