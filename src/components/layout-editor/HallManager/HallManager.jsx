import { useState, useRef } from 'react';
import { useAppState, useAppDispatch } from '../../../contexts/AppContext.jsx';
import styles from './HallManager.module.css';

export default function HallManager() {
	const { halls, activeHallId } = useAppState();
	const dispatch = useAppDispatch();
	const [editingId, setEditingId] = useState(null);
	const [editValue, setEditValue] = useState('');
	const inputRef = useRef(null);

	function selectHall(id) {
		dispatch({ type: 'SET_ACTIVE_HALL', hallId: id });
	}

	function addHall() {
		const name = `Floor ${halls.length + 1}`;
		dispatch({ type: 'ADD_HALL', name });
	}

	function startRename(hall, e) {
		e.stopPropagation();
		setEditingId(hall.id);
		setEditValue(hall.name);
		/* Focus the input after render */
		setTimeout(() => inputRef.current?.focus(), 0);
	}

	function commitRename() {
		if (editValue.trim()) {
			dispatch({ type: 'RENAME_HALL', hallId: editingId, name: editValue.trim() });
		}
		setEditingId(null);
	}

	function deleteHall(id, e) {
		e.stopPropagation();
		if (halls.length <= 1) return;
		if (!window.confirm('Delete this floor/hall?')) return;
		dispatch({ type: 'DELETE_HALL', hallId: id });
	}

	return (
		<div className={styles.tabs}>
			{halls.map((hall) => (
				<div
					key={hall.id}
					className={`${styles.tab} ${hall.id === activeHallId ? styles.tabActive : ''}`}
					onClick={() => selectHall(hall.id)}
					title={hall.name}
				>
					{editingId === hall.id ? (
						<input
							ref={inputRef}
							className={styles.renameInput}
							value={editValue}
							onChange={(e) => setEditValue(e.target.value)}
							onBlur={commitRename}
							onKeyDown={(e) => {
								if (e.key === 'Enter') commitRename();
								if (e.key === 'Escape') setEditingId(null);
							}}
							onClick={(e) => e.stopPropagation()}
						/>
					) : (
						<span className={styles.tabLabel}>{hall.name}</span>
					)}

					<div className={styles.tabActions}>
						<button className={styles.tabActionBtn} onClick={(e) => startRename(hall, e)} title="Rename">
							✏
						</button>
						{halls.length > 1 && (
							<button className={`${styles.tabActionBtn} ${styles.tabActionDelete}`} onClick={(e) => deleteHall(hall.id, e)} title="Delete floor">
								×
							</button>
						)}
					</div>
				</div>
			))}

			<button className={styles.addBtn} onClick={addHall} title="Add floor / hall">
				+ Add Floor
			</button>
		</div>
	);
}
