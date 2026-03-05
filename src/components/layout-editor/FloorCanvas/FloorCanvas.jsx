import { useAppState, useAppDispatch } from '../../../contexts/AppContext.jsx';
import TableShape from '../TableShape/TableShape.jsx';
import styles from './FloorCanvas.module.css';

/*
 * FloorCanvas renders the dot-grid canvas and all TableShape instances
 * for the currently active hall.
 *
 * Props:
 *  hall        – hall object (tables, width, height)
 *  interactive – boolean: true = admin drag/resize mode
 *  children    – optional overlay content
 */
export default function FloorCanvas({ hall, interactive = true, children }) {
	const { selectedTableId } = useAppState();
	const dispatch = useAppDispatch();

	if (!hall) return null;

	/* Clicking the empty canvas background deselects the active table */
	function handleCanvasClick(e) {
		if (e.target === e.currentTarget && interactive) {
			dispatch({ type: 'SELECT_TABLE', tableId: null });
		}
	}

	return (
		<div className={styles.canvasScroll}>
			<div className={styles.canvas} style={{ width: hall.width, height: hall.height }} onClick={handleCanvasClick}>
				{/* ── Tables ── */}
				{hall.tables.map((table) => (
					<TableShape
						key={table.id}
						table={table}
						canvasBounds={{ width: hall.width, height: hall.height }}
						interactive={interactive}
						selected={interactive && selectedTableId === table.id}
						onSelect={() => dispatch({ type: 'SELECT_TABLE', tableId: table.id })}
					/>
				))}

				{/* Caller-injected overlays */}
				{children}
			</div>
		</div>
	);
}
