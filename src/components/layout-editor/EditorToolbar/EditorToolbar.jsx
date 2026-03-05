import { useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAppState, useAppDispatch } from '../../../contexts/AppContext.jsx';
import { exportJSON, importJSON } from '../../../utils/storage.js';
import styles from './EditorToolbar.module.css';

/* Shape templates for the "Add Table" quick-add buttons */
const SHAPE_TEMPLATES = [
	{ shape: 'round', label: 'Round', w: 90, h: 90 },
	{ shape: 'square', label: 'Square', w: 90, h: 90 },
	{ shape: 'rectangular', label: 'Rect', w: 150, h: 90 },
];

export default function EditorToolbar() {
	const { halls, activeHallId, selectedTableId, restaurant, tableStatuses } = useAppState();
	const dispatch = useAppDispatch();
	const fileInputRef = useRef(null);

	const hall = halls.find((h) => h.id === activeHallId);
	const hasSelected = !!selectedTableId;

	/* ── Add a new table in the center of the canvas ── */
	function addTable(shape, w, h) {
		const centerX = Math.max(0, (hall?.width ?? 800) / 2 - w / 2);
		const centerY = Math.max(0, (hall?.height ?? 600) / 2 - h / 2);

		/* Infer next table number */
		const existing = (hall?.tables ?? []).map((t) => parseInt(t.number, 10)).filter((n) => !isNaN(n));
		const nextNum = existing.length > 0 ? Math.max(...existing) + 1 : 1;

		dispatch({
			type: 'ADD_TABLE',
			table: {
				id: uuidv4(),
				number: String(nextNum),
				capacity: 4,
				shape,
				x: centerX,
				y: centerY,
				width: w,
				height: h,
				rotation: 0,
			},
		});
	}

	/* ── Delete selected table ── */
	function deleteSelected() {
		if (!selectedTableId) return;
		if (!window.confirm('Delete this table?')) return;
		dispatch({ type: 'DELETE_TABLE', tableId: selectedTableId });
	}

	/* ── Undo ── */
	function handleUndo() {
		dispatch({ type: 'UNDO' });
	}

	/* ── Export ── */
	function handleExport() {
		exportJSON({
			version: 1,
			restaurants: [{ ...restaurant, halls }],
			tableStatuses,
		});
	}

	/* ── Import ── */
	async function handleImport(e) {
		const file = e.target.files?.[0];
		if (!file) return;
		try {
			const data = await importJSON(file);
			dispatch({ type: 'LOAD_DATA', data });
		} catch {
			alert('Could not import file — make sure it is a valid POS layout JSON.');
		} finally {
			/* Reset file input so the same file can be re-imported */
			e.target.value = '';
		}
	}

	return (
		<div className={styles.toolbar}>
			{/* ── Add table buttons ── */}
			<span className={styles.groupLabel}>Add Table</span>
			{SHAPE_TEMPLATES.map(({ shape, label, w, h }) => (
				<button key={shape} className={styles.btn} onClick={() => addTable(shape, w, h)} title={`Add ${label} table`}>
					<ShapeIcon shape={shape} />
					{label}
				</button>
			))}

			<div className={styles.divider} />

			{/* ── Delete ── */}
			<button className={`${styles.btn} ${styles.danger}`} onClick={deleteSelected} disabled={!hasSelected} title="Delete selected table">
				{/* Trash icon */}
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
					<polyline points="3 6 5 6 21 6" />
					<path d="M19 6l-1 14H6L5 6" />
					<path d="M10 11v6" />
					<path d="M14 11v6" />
					<path d="M9 6V4h6v2" />
				</svg>
				Delete
			</button>

			{/* ── Undo ── */}
			<button className={styles.btn} onClick={handleUndo} title="Undo last action">
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
					<polyline points="1 4 1 10 7 10" />
					<path d="M3.51 15a9 9 0 1 0 .49-4" />
				</svg>
				Undo
			</button>

			<div className={styles.spacer} />

			{/* ── Import / Export ── */}
			<button className={styles.btn} onClick={() => fileInputRef.current?.click()} title="Import layout from JSON file">
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
					<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
					<polyline points="17 8 12 3 7 8" />
					<line x1="12" y1="3" x2="12" y2="15" />
				</svg>
				Import
			</button>
			<input ref={fileInputRef} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={handleImport} />

			<button className={`${styles.btn} ${styles.accent}`} onClick={handleExport} title="Export layout as JSON file">
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
					<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
					<polyline points="7 10 12 15 17 10" />
					<line x1="12" y1="15" x2="12" y2="3" />
				</svg>
				Export
			</button>
		</div>
	);
}

/* Tiny SVG shape previews for the Add Table buttons */
function ShapeIcon({ shape }) {
	const common = { width: 14, height: 14, fill: 'none', stroke: 'currentColor', strokeWidth: '2' };
	if (shape === 'round')
		return (
			<svg {...common} viewBox="0 0 24 24">
				<circle cx="12" cy="12" r="9" />
			</svg>
		);
	if (shape === 'square')
		return (
			<svg {...common} viewBox="0 0 24 24">
				<rect x="3" y="3" width="18" height="18" rx="2" />
			</svg>
		);
	if (shape === 'rectangular')
		return (
			<svg {...common} viewBox="0 0 24 24">
				<rect x="2" y="6" width="20" height="12" rx="2" />
			</svg>
		);
	return null;
}
