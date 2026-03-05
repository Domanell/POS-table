import { createInitialData } from '../data/initialData.js';

const STORAGE_KEY = 'pos_table_data';

/* Migrates tables that still have flat x/y/width/height/rotation to the layout field. */
function normalizeTables(tables) {
	return tables.map((t) => {
		if (t.layout) return t;
		const { x, y, width, height, rotation, ...rest } = t;
		return { ...rest, layout: { x, y, width, height, rotation: rotation ?? 0 } };
	});
}

/* Returns parsed JSON from localStorage, or the seed data if nothing is stored. */
export function loadData() {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (raw) {
			const data = JSON.parse(raw);
			/* Normalise layout field for tables saved with the old flat format */
			data.restaurants?.forEach((r) => {
				r.halls?.forEach((h) => {
					if (Array.isArray(h.tables)) h.tables = normalizeTables(h.tables);
				});
			});
			return data;
		}
	} catch {
		/* Corrupt data — fall through to defaults */
	}
	return createInitialData();
}

/* Serialises the full data object and writes it to localStorage. */
export function saveData(data) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
	} catch {
		/* Quota exceeded or private-mode restriction — silently ignore */
	}
}

/* Downloads a JSON blob as a file. */
export function exportJSON(data) {
	const json = JSON.stringify(data, null, 2);
	const blob = new Blob([json], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = 'pos-layout.json';
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

/* Reads a JSON file selected via <input type="file">, resolves with parsed object. */
export function importJSON(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				resolve(JSON.parse(e.target.result));
			} catch {
				reject(new Error('Invalid JSON file'));
			}
		};
		reader.onerror = () => reject(new Error('Could not read file'));
		reader.readAsText(file);
	});
}
