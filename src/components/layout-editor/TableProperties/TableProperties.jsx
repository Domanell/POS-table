import { useAppState, useAppDispatch, useActiveHall } from '../../../contexts/AppContext.jsx';
import styles from './TableProperties.module.css';

const SHAPES = [
	{ value: 'round', label: 'Round' },
	{ value: 'square', label: 'Square' },
	{ value: 'rectangular', label: 'Rectangular' },
];

/* Default dimensions restored by the "Reset size" button */
const DEFAULT_SIZES = {
	round: { width: 90, height: 90 },
	square: { width: 90, height: 90 },
	rectangular: { width: 150, height: 90 },
};

const MIN_SIZE = 40;

/*
 * TableProperties is the right-side panel shown in admin mode when a
 * table is selected.  All form fields live-update the table object in
 * the AppContext reducer via UPDATE_TABLE.
 */
export default function TableProperties() {
	const { selectedTableId } = useAppState();
	const hall = useActiveHall();
	const dispatch = useAppDispatch();

	const table = hall?.tables.find((t) => t.id === selectedTableId) ?? null;

	if (!table) {
		return (
			<aside className={styles.panel}>
				<p className={styles.empty}>Select a table to edit its properties.</p>
			</aside>
		);
	}

	function update(changes) {
		dispatch({ type: 'UPDATE_TABLE', tableId: table.id, changes });
	}

	function handleDelete() {
		if (!window.confirm(`Delete table ${table.number}?`)) return;
		dispatch({ type: 'DELETE_TABLE', tableId: table.id });
	}

	/* Width change: keep table centre fixed, only width changes */
	function handleWidthChange(e) {
		const newW = Math.max(MIN_SIZE, parseInt(e.target.value, 10) || MIN_SIZE);
		const cx = table.layout.x + table.layout.width / 2;
		update({ x: cx - newW / 2, width: newW });
	}

	/* Height change: keep table centre fixed, only height changes */
	function handleHeightChange(e) {
		const newH = Math.max(MIN_SIZE, parseInt(e.target.value, 10) || MIN_SIZE);
		const cy = table.layout.y + table.layout.height / 2;
		update({ y: cy - newH / 2, height: newH });
	}

	/* Restore manufacturer default dimensions for the current shape, centred */
	function handleResetSize() {
		const defaults = DEFAULT_SIZES[table.shape] ?? DEFAULT_SIZES.square;
		const cx = table.layout.x + table.layout.width / 2;
		const cy = table.layout.y + table.layout.height / 2;
		update({
			x: cx - defaults.width / 2,
			y: cy - defaults.height / 2,
			width: defaults.width,
			height: defaults.height,
		});
	}

	return (
		<aside className={styles.panel}>
			<header className={styles.panelHeader}>
				<span className={styles.panelTitle}>Table Properties</span>
				<span className={styles.tableIdBadge}>#{table.number}</span>
			</header>

			<div className={styles.fields}>
				{/* Table number */}
				<label className={styles.fieldLabel}>
					Table Number
					<input className={styles.input} type="text" value={table.number} onChange={(e) => update({ number: e.target.value })} maxLength={6} />
				</label>

				{/* Capacity */}
				<label className={styles.fieldLabel}>
					Seats
					<input
						className={styles.input}
						type="number"
						min={1}
						max={99}
						value={table.capacity}
						onChange={(e) => update({ capacity: Math.max(1, parseInt(e.target.value, 10) || 1) })}
					/>
				</label>

				{/* Shape */}
				<label className={styles.fieldLabel}>
					Shape
					<div className={styles.shapeRow}>
						{SHAPES.map((s) => (
							<button
								key={s.value}
								className={`${styles.shapeBtn} ${table.shape === s.value ? styles.shapeBtnActive : ''}`}
								onClick={() => update({ shape: s.value })}
								type="button"
							>
								{s.label}
							</button>
						))}
					</div>
				</label>

				{/* Read-only position info */}
				<div className={styles.infoRow}>
					<span className={styles.infoLabel}>Position</span>
					<span className={styles.infoValue}>
						x:{Math.round(table.layout.x)} y:{Math.round(table.layout.y)}
					</span>
				</div>

				{/* Editable width × height with reset button */}
				<div className={styles.fieldLabel}>
					Size
					<div className={styles.sizeRow}>
						<input
							className={styles.sizeInput}
							type="number"
							min={MIN_SIZE}
							step={5}
							value={Math.round(table.layout.width)}
							onChange={handleWidthChange}
							title="Width"
						/>
						<span className={styles.sizeSep}>×</span>
						<input
							className={styles.sizeInput}
							type="number"
							min={MIN_SIZE}
							step={5}
							value={Math.round(table.layout.height)}
							onChange={handleHeightChange}
							title="Height"
						/>
						<button className={styles.resetBtn} onClick={handleResetSize} type="button" title="Reset to default size">
							↺
						</button>
					</div>
				</div>

				<div className={styles.infoRow}>
					<span className={styles.infoLabel}>Rotation</span>
					<span className={styles.infoValue}>{Math.round(table.layout.rotation ?? 0)}°</span>
				</div>
			</div>

			<button className={styles.deleteBtn} onClick={handleDelete} type="button">
				<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
					<polyline points="3 6 5 6 21 6" />
					<path d="M19 6l-1 14H6L5 6" />
					<path d="M10 11v6" />
					<path d="M14 11v6" />
					<path d="M9 6V4h6v2" />
				</svg>
				Delete Table
			</button>
		</aside>
	);
}
