import { AppProvider, useAppState } from './contexts/AppContext.jsx';
import AdminPage from './pages/AdminPage.jsx';
import WaiterPage from './pages/WaiterPage.jsx';
import RoleToggle from './components/common/RoleToggle/RoleToggle.jsx';
import styles from './App.module.css';

function AppContent() {
	const { role } = useAppState();

	return (
		<div className={styles.shell}>
			<RoleToggle />
			<main className={styles.main}>{role === 'admin' ? <AdminPage /> : <WaiterPage />}</main>
		</div>
	);
}

export default function App() {
	return (
		<AppProvider>
			<AppContent />
		</AppProvider>
	);
}
