import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext.jsx';
import AdminPage from './pages/AdminPage.jsx';
import WaiterPage from './pages/WaiterPage.jsx';
import RoleToggle from './components/common/RoleToggle/RoleToggle.jsx';
import styles from './App.module.css';

export default function App() {
	return (
		<AppProvider>
			<BrowserRouter basename="/POS-table">
				<div className={styles.shell}>
					<RoleToggle />
					<main className={styles.main}>
						<Routes>
							<Route path="/admin" element={<AdminPage />} />
							<Route path="/waiter" element={<WaiterPage />} />
							<Route path="*" element={<Navigate to="/waiter" replace />} />
						</Routes>
					</main>
				</div>
			</BrowserRouter>
		</AppProvider>
	);
}
