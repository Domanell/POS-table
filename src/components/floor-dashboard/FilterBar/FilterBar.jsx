import styles from './FilterBar.module.css';

const STATUS_OPTIONS = [
	{ value: 'available', label: 'Free' },
	{ value: 'occupied', label: 'Occupied' },
	{ value: 'reserved', label: 'Reserved' },
	{ value: 'awaiting_payment', label: 'Bill' },
];

/*
 * FilterBar renders filter chips: All | per-status.
 * filter  : { type: 'all' | 'status', value: null | statusKey }
 * onFilter: (filter) => void
 */
export default function FilterBar({ filter, onFilter }) {
	function setAll() {
		onFilter({ type: 'all', value: null });
	}
	function setStatus(v) {
		onFilter({ type: 'status', value: v });
	}

	const isAll = filter.type === 'all';
	const isStatus = (v) => filter.type === 'status' && filter.value === v;

	return (
		<div className={styles.bar}>
			<Chip active={isAll} onClick={setAll}>
				All
			</Chip>

			{/* Status chips */}
			{STATUS_OPTIONS.map((s) => (
				<Chip key={s.value} active={isStatus(s.value)} onClick={() => setStatus(s.value)}>
					{s.label}
				</Chip>
			))}
		</div>
	);
}

function Chip({ children, active, onClick, color }) {
	return (
		<button
			className={`${styles.chip} ${active ? styles.chipActive : ''}`}
			style={color ? { '--chip-color': color } : undefined}
			onClick={onClick}
			type="button"
		>
			{color && <span className={styles.chipDot} style={{ background: color.replace('0.22)', '0.8)') }} />}
			{children}
		</button>
	);
}
