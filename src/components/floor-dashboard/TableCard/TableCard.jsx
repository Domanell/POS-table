import styles from './TableCard.module.css';

/* Status → display label + CSS variable name */
const STATUS_MAP = {
	available: { label: 'Free', varName: '--status-available' },
	occupied: { label: 'Occupied', varName: '--status-occupied' },
	reserved: { label: 'Reserved', varName: '--status-reserved' },
	awaiting_payment: { label: 'Bill', varName: '--status-awaiting-payment' },
};

/*
 * TableCard is the read-only waiter-mode table element.
 * It mirrors the exact position / size / shape / rotation of the admin
 * TableShape but adds status color, a seat-count badge, and reservation chip.
 */
export default function TableCard({ table, status, selected, onSelect }) {
	const rawStatus = status?.status ?? 'available';
	const statusInfo = STATUS_MAP[rawStatus] ?? STATUS_MAP.available;
	const reservation = status?.reservation;
	const order = status?.order;

	/* Shape → CSS class */
	const shapeClass =
		{
			round: styles.shapeRound,
			square: styles.shapeSquare,
			rectangular: styles.shapeRectangular,
		}[table.shape] ?? styles.shapeSquare;

	const wrapperStyle = {
		width: table.layout.width,
		height: table.layout.height,
		transform: `translate(${table.layout.x}px, ${table.layout.y}px) rotate(${table.layout.rotation ?? 0}deg)`,
	};

	const bodyStyle = {
		'--status-color': `var(${statusInfo.varName})`,
		'--status-color-bg': `var(${statusInfo.varName}-bg, rgba(0,0,0,0.2))`,
	};

	/* Show order status dot if an active order exists */
	const showOrderDot = order?.status && order.status !== 'none' && order.status !== 'paid';

	return (
		<div
			className={`${styles.wrapper} ${selected ? styles.selected : ''}`}
			style={wrapperStyle}
			onClick={onSelect}
			role="button"
			tabIndex={0}
			onKeyDown={(e) => e.key === 'Enter' && onSelect?.()}
			aria-label={`Table ${table.number}, ${statusInfo.label}`}
		>
			<div className={`${styles.body} ${shapeClass}`} style={bodyStyle}>
				{/* Table number */}
				<span className={styles.tableNumber}>{table.number}</span>

				{/* Seat capacity badge */}
				<span className={styles.seatBadge}>{table.capacity} seats</span>

				{/* Status label */}
				<span className={styles.statusLabel}>{statusInfo.label}</span>

				{/* Reservation chip — shown whenever a reservation exists, regardless of table status */}
				{reservation?.startTime && <span className={styles.reservationChip}>{formatTime(reservation.startTime)}</span>}

				{/* Order progress dot */}
				{showOrderDot && <span className={styles.orderDot} data-order-status={order.status} title={`Order: ${order.status}`} />}
			</div>
		</div>
	);
}

function formatTime(iso) {
	if (!iso) return '';
	try {
		return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	} catch {
		return iso;
	}
}
