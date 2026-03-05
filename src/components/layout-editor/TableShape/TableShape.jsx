import { useRef, useCallback } from 'react';
import { useAppDispatch, useActiveHall } from '../../../contexts/AppContext.jsx';
import { useDrag } from '../../../hooks/useDrag.js';
import { useResize } from '../../../hooks/useResize.js';
import { useRotate } from '../../../hooks/useRotate.js';
import { clamp, snapToGrid, snapToEdges } from '../../../utils/geometry.js';
import styles from './TableShape.module.css';

const SNAP_GRID = 5;
const SNAP_EDGE = 8;

/*
 * TableShape renders a single draggable / resizable / rotatable table
 * on the admin canvas.  In waiter mode (interactive=false) all pointer
 * interaction is disabled and the component is presentational only.
 *
 * Props:
 *  table       – table data object from the hall
 *  canvasBounds– { width, height } of the FloorCanvas container (for clamping)
 *  interactive – boolean, true in admin mode
 *  selected    – boolean, true when this table is selected
 *  onSelect    – () => void
 *  statusColor – CSS color string injected by waiter FloorDashboard
 *  statusLabel – string label for waiter mode overlay
 *  reservation – reservation object from tableStatus
 *  seatCount   – number to display (capacity)
 */
export default function TableShape({
	table,
	canvasBounds = { width: 1100, height: 700 },
	interactive = true,
	selected = false,
	onSelect,
	statusColor,
	statusLabel,
	reservation,
	seatCount,
}) {
	const dispatch = useAppDispatch();
	const hall = useActiveHall();

	/* ── Drag ── */
	const dragOriginTable = useRef(null); // table layout {x,y} at drag start

	const {
		handlePointerDown: dragDown,
		handlePointerMove: dragMove,
		handlePointerUp: dragUp,
	} = useDrag({
		onMove: useCallback(
			(dx, dy) => {
				if (!dragOriginTable.current) return;
				const { width, height } = table.layout;

				/* 1. Apply drag delta, clamp to canvas */
				let rawX = clamp(dragOriginTable.current.x + dx, 0, canvasBounds.width - width);
				let rawY = clamp(dragOriginTable.current.y + dy, 0, canvasBounds.height - height);

				/* 2. Grid snap */
				let x = snapToGrid(rawX, SNAP_GRID);
				let y = snapToGrid(rawY, SNAP_GRID);

				/* 3. Edge snap against other tables in the same hall */
				const others = (hall?.tables ?? []).filter((t) => t.id !== table.id);
				({ x, y } = snapToEdges(x, y, width, height, others, SNAP_EDGE));

				dispatch({ type: 'UPDATE_TABLE', tableId: table.id, changes: { x, y } });
			},
			[dispatch, table.id, table.layout, canvasBounds, hall],
		),

		onEnd: useCallback(() => {
			dragOriginTable.current = null;
		}, []),
	});

	/* ── Resize ── */
	const {
		makeHandlerFor: makeResizeDown,
		handlePointerMove: resizeMove,
		handlePointerUp: resizeUp,
	} = useResize({
		onResize: useCallback(
			({ x, y, width, height }) => {
				dispatch({ type: 'UPDATE_TABLE', tableId: table.id, changes: { x, y, width, height } });
			},
			[dispatch, table.id],
		),
		onResizeEnd: useCallback(
			({ x, y, width, height }) => {
				dispatch({ type: 'UPDATE_TABLE', tableId: table.id, changes: { x, y, width, height } });
			},
			[dispatch, table.id],
		),
	});

	/* ── Rotate ── */
	const containerRef = useRef(null);

	const {
		handlePointerDown: rotateDown,
		handlePointerMove: rotateMove,
		handlePointerUp: rotateUp,
	} = useRotate({
		onRotate: useCallback(
			(angle) => {
				dispatch({ type: 'UPDATE_TABLE', tableId: table.id, changes: { rotation: angle } });
			},
			[dispatch, table.id],
		),
		onRotateEnd: useCallback(
			(angle) => {
				dispatch({ type: 'UPDATE_TABLE', tableId: table.id, changes: { rotation: angle } });
			},
			[dispatch, table.id],
		),
		snap: true,
	});

	/* ── Unified pointer move / up dispatched from root ── */
	/* These are attached to the outer wrapper so that fast mouse movement
     outside the handle still keeps the operation alive via pointer capture. */
	function onWrapperMove(e) {
		if (!interactive) return;
		dragMove(e);
		resizeMove(e);
		rotateMove(e);
	}
	function onWrapperUp(e) {
		if (!interactive) return;
		dragUp(e);
		resizeUp(e);
		rotateUp(e);
	}

	/* ── Body pointer-down starts drag ── */
	function onBodyDown(e) {
		if (!interactive) return;
		/* Capture table layout position at this moment for delta computation */
		dragOriginTable.current = { x: table.layout.x, y: table.layout.y };
		dragDown(e);
		onSelect?.();
	}

	/* ── Center of this table in canvas coordinates (for rotation math) ── */
	function getCenter() {
		return {
			x: table.layout.x + table.layout.width / 2,
			y: table.layout.y + table.layout.height / 2,
		};
	}

	/* ── CSS shape class ── */
	const shapeClass =
		{
			round: styles.shapeRound,
			square: styles.shapeSquare,
			rectangular: styles.shapeRectangular,
		}[table.shape] ?? styles.shapeSquare;

	/* ── Inline style ── */
	const { x, y, width, height, rotation } = table.layout;
	const style = {
		width,
		height,
		transform: `translate(${x}px, ${y}px) rotate(${rotation ?? 0}deg)`,
	};
	if (statusColor) {
		style['--status-color'] = statusColor;
	}

	/* ── Resize handles (8 directions) ── */
	const HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

	return (
		<div
			ref={containerRef}
			className={`${styles.wrapper} ${selected ? styles.selected : ''} ${!interactive ? styles.readOnly : ''}`}
			style={style}
			onPointerMove={onWrapperMove}
			onPointerUp={onWrapperUp}
			onPointerCancel={onWrapperUp}
		>
			{/* ── Main table body ── */}
			<div className={`${styles.body} ${shapeClass}`} onPointerDown={onBodyDown} onClick={() => onSelect?.()}>
				{/* Table number */}
				<span className={styles.tableNumber}>{table.number}</span>

				{/* Seat count — always visible */}
				<span className={styles.seatCount}>{seatCount ?? table.capacity}</span>

				{/* Waiter mode: status label */}
				{statusLabel && <span className={styles.statusLabel}>{statusLabel}</span>}

				{/* Waiter mode: reservation time chip */}
				{reservation?.startTime && <span className={styles.reservationChip}>{formatTime(reservation.startTime)}</span>}
			</div>

			{/* ── Resize handles (admin mode only) ── */}
			{interactive &&
				selected &&
				HANDLES.map((h) => (
					<div key={h} className={`${styles.resizeHandle} ${styles[`handle-${h}`]}`} onPointerDown={(e) => makeResizeDown(h, { ...table.layout })(e)} />
				))}

			{/* ── Rotate handle (admin mode only) ── */}
			{interactive && selected && (
				<div
					className={styles.rotateHandle}
					onPointerDown={(e) => {
						e.stopPropagation();
						e.currentTarget.setPointerCapture(e.pointerId);
						rotateDown(e, getCenter());
					}}
					title="Rotate table"
				/>
			)}
		</div>
	);
}

/* Formats an ISO datetime string to HH:MM for the reservation chip */
function formatTime(iso) {
	if (!iso) return '';
	try {
		return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	} catch {
		return iso;
	}
}
