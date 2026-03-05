import { useState } from 'react';
import { useAppDispatch, useActiveHall } from '../../../contexts/AppContext.jsx';
import styles from './ZoneEditor.module.css';

/* Preset palette for new zones */
const PRESET_COLORS = [
	'rgba(79,128,255,0.22)',
	'rgba(76,175,80,0.22)',
	'rgba(251,140,0,0.22)',
	'rgba(229,57,53,0.22)',
	'rgba(142,36,170,0.22)',
	'rgba(0,188,212,0.22)',
];

export default function ZoneEditor() {
	const hall = useActiveHall();
	const dispatch = useAppDispatch();
	const [zoneName, setZoneName] = useState('');
	const [zoneColor, setZoneColor] = useState(PRESET_COLORS[0]);

	if (!hall) return null;

	function addZone() {
		if (!zoneName.trim()) return;
		dispatch({ type: 'ADD_ZONE', name: zoneName.trim(), color: zoneColor });
		setZoneName('');
	}

	function deleteZone(id) {
		if (!window.confirm('Delete this zone? Tables will be unassigned.')) return;
		dispatch({ type: 'DELETE_ZONE', zoneId: id });
	}

	return (
		<div className={styles.container}>
			<span className={styles.sectionTitle}>Zones</span>

			{/* Existing zones */}
			{hall.zones.length === 0 && <p className={styles.empty}>No zones defined.</p>}
			{hall.zones.map((zone) => (
				<div key={zone.id} className={styles.zoneRow}>
					<span className={styles.zoneColor} style={{ background: zone.color }} />
					<span className={styles.zoneName}>{zone.name}</span>
					<button className={styles.deleteBtn} onClick={() => deleteZone(zone.id)} title="Delete zone">
						×
					</button>
				</div>
			))}

			{/* Add zone form */}
			<div className={styles.addForm}>
				<input
					className={styles.input}
					type="text"
					placeholder="Zone name…"
					value={zoneName}
					onChange={(e) => setZoneName(e.target.value)}
					onKeyDown={(e) => e.key === 'Enter' && addZone()}
					maxLength={30}
				/>
				<div className={styles.colorRow}>
					{PRESET_COLORS.map((c) => (
						<button
							key={c}
							className={`${styles.colorSwatch} ${zoneColor === c ? styles.colorSwatchActive : ''}`}
							style={{ background: c.replace('0.22)', '0.7)') }}
							onClick={() => setZoneColor(c)}
							type="button"
							title="Select color"
						/>
					))}
				</div>
				<button className={styles.addBtn} onClick={addZone} type="button">
					+ Add Zone
				</button>
			</div>
		</div>
	);
}
