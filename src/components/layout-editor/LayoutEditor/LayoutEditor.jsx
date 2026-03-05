import { useEffect } from 'react';
import { useAppDispatch } from '../../../contexts/AppContext.jsx';
import { useActiveHall } from '../../../contexts/AppContext.jsx';
import HallManager from '../HallManager/HallManager.jsx';
import EditorToolbar from '../EditorToolbar/EditorToolbar.jsx';
import FloorCanvas from '../FloorCanvas/FloorCanvas.jsx';
import TableProperties from '../TableProperties/TableProperties.jsx';
import styles from './LayoutEditor.module.css';

/*
 * LayoutEditor assembles the full admin editing surface:
 *   - HallManager tabs at the top
 *   - EditorToolbar (add / delete / undo / import / export)
 *   - FloorCanvas (interactive canvas)
 *   - TableProperties right-sidebar
 */
export default function LayoutEditor() {
	const hall = useActiveHall();
	const dispatch = useAppDispatch();

	/* ── Keyboard shortcut: Delete removes selected table ── */
	useEffect(() => {
		function handleKey(e) {
			if (e.key === 'Delete' || e.key === 'Backspace') {
				/* Only if the target is not an input/select/textarea */
				const tag = e.target.tagName.toLowerCase();
				if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
				dispatch({ type: 'DELETE_TABLE_IF_SELECTED' });
			}
			if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
				e.preventDefault();
				dispatch({ type: 'UNDO' });
			}
		}
		window.addEventListener('keydown', handleKey);
		return () => window.removeEventListener('keydown', handleKey);
	}, [dispatch]);

	return (
		<div className={styles.editorRoot}>
			{/* ── Top: hall tabs ── */}
			<HallManager />

			{/* ── Second row: toolbar ── */}
			<EditorToolbar />

			{/* ── Main area: canvas + properties sidebar ── */}
			<div className={styles.editorBody}>
				<FloorCanvas hall={hall} interactive />

				<div className={styles.rightSidebar}>
					<TableProperties />
				</div>
			</div>
		</div>
	);
}
