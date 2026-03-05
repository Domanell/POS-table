import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAppState, useAppDispatch, useActiveHall, defaultTableStatus } from '../../../contexts/AppContext.jsx';
import styles from './TableDetailPanel.module.css';

const STATUS_OPTIONS = [
	{ value: 'available', label: 'Free', color: 'var(--status-available)' },
	{ value: 'occupied', label: 'Occupied', color: 'var(--status-occupied)' },
	{ value: 'reserved', label: 'Reserved', color: 'var(--status-reserved)' },
	{ value: 'awaiting_payment', label: 'Bill', color: 'var(--status-awaiting-payment)' },
];

const ORDER_STATUS_FLOW = ['none', 'created', 'in_preparation', 'ready', 'delivered', 'paid'];
const ORDER_STATUS_LABELS = {
	none: 'No order',
	created: 'Order created',
	in_preparation: 'In preparation',
	ready: 'Ready to serve',
	delivered: 'Delivered',
	paid: 'Paid',
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

	/* Which tab is active: 'status' | 'reservation' | 'order' */
	const [activeTab, setActiveTab] = useState('status');

	/* New order item form state */
	const [newItemName, setNewItemName] = useState('');
	const [newItemPrice, setNewItemPrice] = useState('');

	const table = hall?.tables.find((t) => t.id === selectedTableId);
	const status = tableStatuses[selectedTableId] ?? defaultTableStatus();

	if (!table) return null;

	const { reservation, order } = status;

	/* ── Helpers ── */
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

	function updateOrder(changes) {
		dispatch({
			type: 'SET_TABLE_ORDER',
			tableId: table.id,
			order: { ...order, ...changes },
		});
	}

	function addItem() {
		const name = newItemName.trim();
		const price = parseFloat(newItemPrice);
		if (!name) return;
		const newItem = { id: uuidv4(), name, price: isNaN(price) ? 0 : price, qty: 1 };
		const isFirstItem = (order.items ?? []).length === 0;
		const nextOrderStatus = order.status === 'none' ? 'created' : order.status;
		updateOrder({ items: [...(order.items ?? []), newItem], status: nextOrderStatus });
		/* Automatically mark table as occupied when the first order item is added */
		if (isFirstItem) setTableStatus('occupied');
		setNewItemName('');
		setNewItemPrice('');
	}

	function removeItem(id) {
		updateOrder({ items: (order.items ?? []).filter((i) => i.id !== id) });
	}

	function changeQty(id, delta) {
		updateOrder({
			items: (order.items ?? []).map((i) => (i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i)),
		});
	}

	function advanceOrderStatus() {
		const idx = ORDER_STATUS_FLOW.indexOf(order.status);
		const next = ORDER_STATUS_FLOW[Math.min(idx + 1, ORDER_STATUS_FLOW.length - 1)];
		updateOrder({ status: next });
		if (next === 'paid') setTableStatus('available');
	}

	function markPaid() {
		dispatch({ type: 'CLEAR_TABLE', tableId: table.id });
	}

	/* Transitions table to Bill status so the waiter can present the check */
	function requestBill() {
		setTableStatus('awaiting_payment');
	}

	/* ── Order total ── */
	const orderTotal = (order.items ?? []).reduce((sum, i) => sum + i.price * i.qty, 0);

	/* ── Next status in flow for the "Advance" button ── */
	const nextOrderStatus = (() => {
		const idx = ORDER_STATUS_FLOW.indexOf(order.status);
		return ORDER_STATUS_FLOW[Math.min(idx + 1, ORDER_STATUS_FLOW.length - 1)];
	})();

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
				{['status', 'reservation', 'order'].map((t) => (
					<button key={t} className={`${styles.tab} ${activeTab === t ? styles.tabActive : ''}`} onClick={() => setActiveTab(t)}>
						{t.charAt(0).toUpperCase() + t.slice(1)}
					</button>
				))}
			</div>

			{/* ── Tab content ── */}
			<div className={styles.tabContent}>
				{/* ─── STATUS tab ─── */}
				{activeTab === 'status' && (
					<div className={styles.section}>
						{/* Current table status (read-only) — transitions driven by order lifecycle */}
						<div className={styles.currentStatus}>
							<span
								className={styles.statusDot}
								style={{ background: STATUS_OPTIONS.find((s) => s.value === status.status)?.color ?? 'var(--color-border)' }}
							/>
							<span className={styles.statusText}>{STATUS_OPTIONS.find((s) => s.value === status.status)?.label ?? status.status}</span>
						</div>

						{/* Reservation info — informational only; a future reservation does not block the table */}
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

						{/* Order progress indicator */}
						{order.status !== 'none' && (
							<div className={styles.orderProgress}>
								<span className={styles.fieldLabel}>Order status</span>
								<div className={styles.progressPills}>
									{ORDER_STATUS_FLOW.filter((s) => s !== 'none').map((s) => (
										<span key={s} className={`${styles.progressPill} ${order.status === s ? styles.progressPillActive : ''}`}>
											{ORDER_STATUS_LABELS[s]}
										</span>
									))}
								</div>
								{order.status !== 'paid' && (
									<button className={styles.advanceBtn} onClick={advanceOrderStatus}>
										→ {ORDER_STATUS_LABELS[nextOrderStatus]}
									</button>
								)}
							</div>
						)}

						{/* Context-aware bill flow buttons */}
						<div className={styles.actions}>
							{status.status === 'occupied' && order.status !== 'none' && order.status !== 'paid' && (
								<button className={`${styles.actionBtn} ${styles.payBtn}`} onClick={requestBill}>
									Request Bill
								</button>
							)}
							{status.status === 'awaiting_payment' && (
								<button className={`${styles.actionBtn} ${styles.payBtn}`} onClick={markPaid}>
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

						{reservation.startTime && (
							<button className={`${styles.actionBtn} ${styles.confirmBtn}`} onClick={() => setTableStatus('reserved')} type="button">
								Confirm Reservation
							</button>
						)}
					</div>
				)}

				{/* ─── ORDER tab ─── */}
				{activeTab === 'order' && (
					<div className={styles.section}>
						{/* Item list */}
						<div className={styles.itemList}>
							{(order.items ?? []).length === 0 && <p className={styles.emptyMsg}>No items yet.</p>}
							{(order.items ?? []).map((item) => (
								<div key={item.id} className={styles.orderItem}>
									<span className={styles.itemName}>{item.name}</span>
									<div className={styles.qtyControls}>
										<button className={styles.qtyBtn} onClick={() => changeQty(item.id, -1)}>
											−
										</button>
										<span className={styles.qtyValue}>{item.qty}</span>
										<button className={styles.qtyBtn} onClick={() => changeQty(item.id, +1)}>
											+
										</button>
									</div>
									<span className={styles.itemPrice}>${(item.price * item.qty).toFixed(2)}</span>
									<button className={styles.removeItemBtn} onClick={() => removeItem(item.id)} title="Remove">
										✕
									</button>
								</div>
							))}
						</div>

						{/* Total */}
						{(order.items ?? []).length > 0 && (
							<div className={styles.orderTotal}>
								<span>Total</span>
								<span>${orderTotal.toFixed(2)}</span>
							</div>
						)}

						{/* Add item form */}
						<div className={styles.addItemForm}>
							<input
								className={`${styles.input} ${styles.itemNameInput}`}
								type="text"
								placeholder="Item name…"
								value={newItemName}
								onChange={(e) => setNewItemName(e.target.value)}
								onKeyDown={(e) => e.key === 'Enter' && addItem()}
							/>
							<input
								className={`${styles.input} ${styles.itemPriceInput}`}
								type="number"
								placeholder="Price"
								min={0}
								step={0.01}
								value={newItemPrice}
								onChange={(e) => setNewItemPrice(e.target.value)}
								onKeyDown={(e) => e.key === 'Enter' && addItem()}
							/>
							<button className={`${styles.actionBtn} ${styles.confirmBtn}`} onClick={addItem} type="button">
								Add
							</button>
						</div>

						{/* Order flow actions — bill flow buttons mirror the status tab */}
						{order.status !== 'none' && order.status !== 'paid' && (
							<div className={styles.actions}>
								<button className={styles.advanceBtn} onClick={advanceOrderStatus}>
									→ {ORDER_STATUS_LABELS[nextOrderStatus]}
								</button>
								{status.status === 'occupied' && (
									<button className={`${styles.actionBtn} ${styles.payBtn}`} onClick={requestBill}>
										Request Bill
									</button>
								)}
								{status.status === 'awaiting_payment' && (
									<button className={`${styles.actionBtn} ${styles.payBtn}`} onClick={markPaid}>
										Mark as Paid
									</button>
								)}
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
