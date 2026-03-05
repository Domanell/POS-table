import { useState } from 'react';
import { useAppState, useAppDispatch, useActiveHall, defaultTableStatus } from '../../../contexts/AppContext.jsx';
import styles from './TableDetailPanel.module.css';

const STATUS_LABELS = {
	available: 'Free',
	occupied: 'Occupied',
	awaiting_payment: 'Bill',
};

const STATUS_COLORS = {
	available: 'var(--status-available)',
	occupied: 'var(--status-occupied)',
	awaiting_payment: 'var(--status-awaiting-payment)',
};

/* Formats an ISO datetime string as "Mon DD, HH:MM" for compact display */
function fmtDateTime(iso) {
	if (!iso) return '';
	try {
		return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
	} catch {
		return iso;
	}
}

export default function TableDetailPanel() {
	const { selectedTableId, tableStatuses } = useAppState();
	const hall = useActiveHall();
	const dispatch = useAppDispatch();

	const [activeTab, setActiveTab] = useState('status');

	const table = hall?.tables.find((t) => t.id === selectedTableId);
	const status = tableStatuses[selectedTableId] ?? defaultTableStatus();

	if (!table) return null;

	const { reservation, order } = status;

	function setTableStatus(s) {
		dispatch({ type: 'SET_TABLE_STATUS', tableId: table.id, status: s });
	}

	function updateReservation(changes) {
		dispatch({
			type: 'SET_TABLE_RESERVATION',
			tableId: table.id,
			reservation: { ...reservation, ...changes },
		});
	}

	/* Opens a new order and marks the table occupied */
	function startOrder() {
		dispatch({ type: 'SET_TABLE_ORDER', tableId: table.id, order: { status: 'active' } });
		setTableStatus('occupied');
	}

	/* Asks waiter to present the bill */
	function requestBill() {
		setTableStatus('awaiting_payment');
	}

	/* Clears order and resets table to free */
	function markPaid() {
		dispatch({ type: 'CLEAR_TABLE', tableId: table.id });
	}

	const hasActiveOrder = order.status && order.status !== 'none' && order.status !== 'paid';

	return (
		<div className={styles.panel}>
			{/* ── Header ── */}
			<div className={styles.header}>
				<div className={styles.tableInfo}>
					<span className={styles.tableNum}>Table {table.number}</span>
					<span className={styles.tableCapacity}>{table.capacity} seats</span>
				</div>
				<button className={styles.closeBtn} onClick={() => dispatch({ type: 'SELECT_TABLE', tableId: null })} title="Close panel">
					✕
				</button>
			</div>

			{/* ── Tab bar ── */}
			<div className={styles.tabs}>
				{['status', 'reservation'].map((t) => (
					<button key={t} className={`${styles.tab} ${activeTab === t ? styles.tabActive : ''}`} onClick={() => setActiveTab(t)}>
						{t === 'status' ? 'Status' : 'Reservation'}
					</button>
				))}
			</div>

			{/* ── Tab content ── */}
			<div className={styles.tabContent}>
				{/* ─── STATUS tab ─── */}
				{activeTab === 'status' && (
					<div className={styles.section}>
						{/* Current status dot + label */}
						<div className={styles.currentStatus}>
							<span className={styles.statusDot} style={{ background: STATUS_COLORS[status.status] ?? 'var(--color-border)' }} />
							<span className={styles.statusText}>{STATUS_LABELS[status.status] ?? status.status}</span>
						</div>

						{/* Reservation info — informational only */}
						{reservation.startTime && (
							<div className={styles.reservationSummary}>
								<span className={styles.fieldLabel}>Reservation</span>
								<span className={styles.reservationInfo}>
									{reservation.guestName && <strong>{reservation.guestName}</strong>}
									{reservation.guestName && ' · '}
									{fmtDateTime(reservation.startTime)}
									{reservation.guestCount > 0 && ` · ${reservation.guestCount} guests`}
								</span>
							</div>
						)}

						{/* Action buttons: one visible at a time based on lifecycle */}
						<div className={styles.actions}>
							{status.status === 'available' && !hasActiveOrder && (
								<button className={`${styles.actionBtn} ${styles.confirmBtn}`} onClick={startOrder} type="button">
									New Order
								</button>
							)}
							{status.status === 'occupied' && hasActiveOrder && (
								<button className={`${styles.actionBtn} ${styles.payBtn}`} onClick={requestBill} type="button">
									Request Bill
								</button>
							)}
							{status.status === 'awaiting_payment' && (
								<button className={`${styles.actionBtn} ${styles.payBtn}`} onClick={markPaid} type="button">
									Mark as Paid
								</button>
							)}
						</div>
					</div>
				)}

				{/* ─── RESERVATION tab ─── */}
				{activeTab === 'reservation' && (
					<div className={styles.section}>
						<label className={styles.fieldLabel}>
							Guest Name
							<input
								className={styles.input}
								type="text"
								placeholder="Guest name…"
								value={reservation.guestName}
								onChange={(e) => updateReservation({ guestName: e.target.value })}
							/>
						</label>
						<label className={styles.fieldLabel}>
							Guest Count
							<input
								className={styles.input}
								type="number"
								min={1}
								max={99}
								value={reservation.guestCount || ''}
								placeholder="0"
								onChange={(e) => updateReservation({ guestCount: parseInt(e.target.value, 10) || 0 })}
							/>
						</label>
						<label className={styles.fieldLabel}>
							Start Time
							<input
								className={styles.input}
								type="datetime-local"
								value={reservation.startTime}
								onChange={(e) => updateReservation({ startTime: e.target.value })}
							/>
						</label>
						<label className={styles.fieldLabel}>
							End Time
							<input
								className={styles.input}
								type="datetime-local"
								value={reservation.endTime}
								onChange={(e) => updateReservation({ endTime: e.target.value })}
							/>
						</label>
					</div>
				)}
			</div>
		</div>
	);
}
