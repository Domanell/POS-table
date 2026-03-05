import LayoutEditor from '../components/layout-editor/LayoutEditor/LayoutEditor.jsx';
import styles from './AdminPage.module.css';

export default function AdminPage() {
	return (
		<div className={styles.page}>
			<LayoutEditor />
		</div>
	);
}
