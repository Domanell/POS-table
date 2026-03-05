import styles from './StatusLegend.module.css';

const STATUSES = [
	{ key: 'available', label: 'Free', color: 'var(--status-available)' },
	{ key: 'occupied', label: 'Occupied', color: 'var(--status-occupied)' },
	{ key: 'reserved', label: 'Reserved', color: 'var(--status-reserved)' },
	{ key: 'awaiting_payment', label: 'Bill', color: 'var(--status-awaiting-payment)' },
];

export default function StatusLegend() {
	return (
		<div className={styles.legend}>
			{STATUSES.map((s) => (
				<span key={s.key} className={styles.item}>
					<span className={styles.dot} style={{ background: s.color }} />
					{s.label}
				</span>
			))}
		</div>
	);
}
