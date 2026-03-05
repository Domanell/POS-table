import { useAppState, useAppDispatch, useActiveHall } from '../../../contexts/AppContext.jsx';
import HallManager from '../../layout-editor/HallManager/HallManager.jsx';
import FilterBar from '../FilterBar/FilterBar.jsx';
import TableCard from '../TableCard/TableCard.jsx';
import StatusLegend from '../StatusLegend/StatusLegend.jsx';
import TableDetailPanel from '../TableDetailPanel/TableDetailPanel.jsx';
import styles from './FloorDashboard.module.css';
import { useState } from 'react';

export default function FloorDashboard() {
	const hall = useActiveHall();
	const { selectedTableId, tableStatuses } = useAppState();
	const dispatch = useAppDispatch();
	const [filter, setFilter] = useState({ type: 'all', value: null });

	if (!hall) return <div className={styles.empty}>No halls configured.</div>;

	/* ── Filter predicate ── */
	function isVisible(table) {
		if (filter.type === 'status') {
			const status = (tableStatuses[table.id] ?? {}).status ?? 'available';
			return status === filter.value;
		}
		return true;
	}

	return (
		<div className={styles.root}>
			{/* Hall tabs — re-use the same component as admin */}
			<HallManager />

			{/* Filter + legend row */}
			<div className={styles.controlsRow}>
				<FilterBar filter={filter} onFilter={setFilter} />
				<StatusLegend />
			</div>

			{/* Canvas */}
			<div className={styles.canvasScroll}>
				<div
					className={styles.canvas}
					style={{ width: hall.width, height: hall.height }}
					onClick={(e) => {
						if (e.target === e.currentTarget) dispatch({ type: 'SELECT_TABLE', tableId: null });
					}}
				>
					{hall.tables.filter(isVisible).map((table) => (
						<TableCard
							key={table.id}
							table={table}
							status={tableStatuses[table.id]}
							selected={selectedTableId === table.id}
							onSelect={() => dispatch({ type: 'SELECT_TABLE', tableId: table.id })}
						/>
					))}
				</div>
			</div>

			{/* Detail panel slides in from the right when a table is selected */}
			{selectedTableId && <TableDetailPanel />}
		</div>
	);
}
