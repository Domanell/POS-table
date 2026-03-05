import { useAppState, useAppDispatch } from '../../../contexts/AppContext.jsx';
import styles from './RoleToggle.module.css';

export default function RoleToggle() {
	const { restaurant, role } = useAppState();
	const dispatch = useAppDispatch();

	// Determine current role
	const isAdmin = role === 'admin';

	// Switch role only via state
	function handleToggle() {
		const nextRole = isAdmin ? 'waiter' : 'admin';
		dispatch({ type: 'SET_ROLE', role: nextRole });
	}

	return (
		<header className={styles.header}>
			<div className={styles.brand}>
				{/* Restaurant icon */}
				<svg
					width="22"
					height="22"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					aria-hidden="true"
				>
					<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
					<path d="M7 2v20" />
					<path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
				</svg>
				<span className={styles.restaurantName}>{restaurant?.name ?? 'Restaurant POS'}</span>
			</div>

			<button
				className={`${styles.toggleBtn} ${isAdmin ? styles.adminActive : styles.waiterActive}`}
				onClick={handleToggle}
				title={isAdmin ? 'Switch to Waiter mode' : 'Switch to Admin mode'}
			>
				<span className={styles.modeLabel}>{isAdmin ? 'Admin Mode' : 'Waiter Mode'}</span>
				{/* Toggle track */}
				<span className={styles.track} aria-hidden="true">
					<span className={styles.thumb} />
				</span>
				<span className={styles.modeLabelNext}>{isAdmin ? 'Go to Waiter' : 'Go to Admin'}</span>
			</button>

			<div className={styles.badge} data-role={isAdmin ? 'admin' : 'waiter'}>
				{isAdmin ? 'Admin' : 'Waiter'}
			</div>
		</header>
	);
}
