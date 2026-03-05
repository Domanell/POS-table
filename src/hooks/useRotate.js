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
	const startAngleRef = useRef(0); // initial angle at pointerDown
	const initialRotationRef = useRef(0); // rotation at pointerDown

	const handlePointerDown = useCallback((e, center, initialRotation = 0) => {
		// Save center and rotation at pointerDown
		e.stopPropagation();
		e.currentTarget.setPointerCapture(e.pointerId);
		centerRef.current = center;
		active.current = true;
		initialRotationRef.current = initialRotation;
		// Calculate angle between center and cursor at pointerDown
		startAngleRef.current = angleToCursor(center.x, center.y, e.clientX, e.clientY);
	}, []);

	const handlePointerMove = useCallback(
		(e) => {
			if (!active.current || !centerRef.current) return;
			// Current cursor angle
			const currentAngle = angleToCursor(centerRef.current.x, centerRef.current.y, e.clientX, e.clientY);
			// Delta from start (direction corrected)
			let angle = initialRotationRef.current + (startAngleRef.current - currentAngle);
			// Normalize angle to [0, 360)
			angle = ((angle % 360) + 360) % 360;
			if (snap) angle = snapAngle(angle);
			onRotate(angle);
		},
		[onRotate, snap],
	);

	const handlePointerUp = useCallback(
		(e) => {
			if (!active.current || !centerRef.current) return;
			const currentAngle = angleToCursor(centerRef.current.x, centerRef.current.y, e.clientX, e.clientY);
			let angle = initialRotationRef.current + (startAngleRef.current - currentAngle);
			angle = ((angle % 360) + 360) % 360;
			if (snap) angle = snapAngle(angle);
			active.current = false;
			centerRef.current = null;
			onRotateEnd?.(angle);
		},
		[onRotateEnd, snap],
	);

	return { handlePointerDown, handlePointerMove, handlePointerUp };
}
