/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { loadData, saveData } from '../utils/storage.js';

/* ── Context objects ── */
const AppStateContext = createContext(null);
const AppDispatchContext = createContext(null);

/* ═══════════════════════════════════════════════════════════════
 *  Initial state
 * ═══════════════════════════════════════════════════════════════ */
function buildInitialState() {
	const data = loadData();
	const restaurant = data.restaurants[0];
	return {
		restaurant,
		halls: restaurant.halls,
		activeHallId: restaurant.halls[0]?.id ?? null,
		tableStatuses: data.tableStatuses ?? {},
		role: 'waiter', // 'admin' | 'waiter'
		selectedTableId: null,
		/* Snapshot of previous state for single-level undo */
		_undoSnapshot: null,
	};
}

/* ═══════════════════════════════════════════════════════════════
 *  Reducer
 * ═══════════════════════════════════════════════════════════════ */
function reducer(state, action) {
	switch (action.type) {
		/* ── Role ── */
		case 'SET_ROLE':
			return { ...state, role: action.role, selectedTableId: null };

		/* ── Hall navigation ── */
		case 'SET_ACTIVE_HALL':
			return { ...state, activeHallId: action.hallId, selectedTableId: null };

		/* ── Hall management ── */
		case 'ADD_HALL': {
			const newHall = {
				id: uuidv4(),
				name: action.name,
				width: 1100,
				height: 700,
				tables: [],
			};
			const halls = [...state.halls, newHall];
			return { ...state, halls, activeHallId: newHall.id };
		}

		case 'RENAME_HALL':
			return {
				...state,
				halls: state.halls.map((h) => (h.id === action.hallId ? { ...h, name: action.name } : h)),
			};

		case 'DELETE_HALL': {
			if (state.halls.length <= 1) return state; // must keep at least one hall
			const halls = state.halls.filter((h) => h.id !== action.hallId);
			const activeHallId = state.activeHallId === action.hallId ? halls[0].id : state.activeHallId;
			return { ...state, halls, activeHallId };
		}

		/* ── Table CRUD ── */
		case 'ADD_TABLE': {
			/* Save undo snapshot before adding */
			const snapshot = captureSnapshot(state);
			/* Normalise: accept either a nested layout field or flat x/y/width/height/rotation */
			const { x, y, width, height, rotation, layout: incomingLayout, ...rest } = action.table;
			const tableRecord = {
				...rest,
				layout: incomingLayout ?? { x, y, width, height, rotation: rotation ?? 0 },
			};
			const halls = state.halls.map((h) => (h.id === state.activeHallId ? { ...h, tables: [...h.tables, tableRecord] } : h));
			return { ...state, halls, selectedTableId: tableRecord.id, _undoSnapshot: snapshot };
		}

		case 'UPDATE_TABLE': {
			const snapshot = captureSnapshot(state);
			/* Layout-related keys are merged into the nested layout object; all others stay flat */
			const LAYOUT_KEYS = new Set(['x', 'y', 'width', 'height', 'rotation']);
			const halls = state.halls.map((h) =>
				h.id === state.activeHallId
					? {
							...h,
							tables: h.tables.map((t) => {
								if (t.id !== action.tableId) return t;
								const layoutChanges = {};
								const otherChanges = {};
								for (const [k, v] of Object.entries(action.changes)) {
									if (LAYOUT_KEYS.has(k)) layoutChanges[k] = v;
									else otherChanges[k] = v;
								}
								const hasLayoutChanges = Object.keys(layoutChanges).length > 0;
								return {
									...t,
									...otherChanges,
									...(hasLayoutChanges ? { layout: { ...t.layout, ...layoutChanges } } : {}),
								};
							}),
						}
					: h,
			);
			return { ...state, halls, _undoSnapshot: snapshot };
		}

		case 'DELETE_TABLE': {
			const snapshot = captureSnapshot(state);
			const halls = state.halls.map((h) => (h.id === state.activeHallId ? { ...h, tables: h.tables.filter((t) => t.id !== action.tableId) } : h));
			/* Remove status entry too */
			const tableStatuses = { ...state.tableStatuses };
			delete tableStatuses[action.tableId];
			return {
				...state,
				halls,
				tableStatuses,
				selectedTableId: state.selectedTableId === action.tableId ? null : state.selectedTableId,
				_undoSnapshot: snapshot,
			};
		}

		case 'SELECT_TABLE':
			return { ...state, selectedTableId: action.tableId };

		/* ── Delete table if one is selected (keyboard shortcut) ── */
		case 'DELETE_TABLE_IF_SELECTED': {
			if (!state.selectedTableId) return state;
			const snapshot = captureSnapshot(state);
			const halls = state.halls.map((h) => (h.id === state.activeHallId ? { ...h, tables: h.tables.filter((t) => t.id !== state.selectedTableId) } : h));
			const tableStatuses = { ...state.tableStatuses };
			delete tableStatuses[state.selectedTableId];
			return { ...state, halls, tableStatuses, selectedTableId: null, _undoSnapshot: snapshot };
		}

		/* ── Undo ── */
		case 'UNDO': {
			if (!state._undoSnapshot) return state;
			return { ...state, ...state._undoSnapshot, _undoSnapshot: null };
		}

		/* ── Table statuses (waiter mode) ── */
		case 'SET_TABLE_STATUS':
			return {
				...state,
				tableStatuses: {
					...state.tableStatuses,
					[action.tableId]: {
						...(state.tableStatuses[action.tableId] ?? defaultTableStatus()),
						status: action.status,
					},
				},
			};

		case 'SET_TABLE_RESERVATION':
			return {
				...state,
				tableStatuses: {
					...state.tableStatuses,
					[action.tableId]: {
						...(state.tableStatuses[action.tableId] ?? defaultTableStatus()),
						reservation: action.reservation,
					},
				},
			};

		case 'SET_TABLE_ORDER':
			return {
				...state,
				tableStatuses: {
					...state.tableStatuses,
					[action.tableId]: {
						...(state.tableStatuses[action.tableId] ?? defaultTableStatus()),
						order: action.order,
					},
				},
			};

		case 'CLEAR_TABLE':
			return {
				...state,
				tableStatuses: {
					...state.tableStatuses,
					[action.tableId]: defaultTableStatus(),
				},
			};

		/* ── Bulk load (import JSON) ── */
		case 'LOAD_DATA': {
			const restaurant = action.data.restaurants[0];
			return {
				...state,
				restaurant,
				halls: restaurant.halls,
				activeHallId: restaurant.halls[0]?.id ?? null,
				tableStatuses: action.data.tableStatuses ?? {},
				selectedTableId: null,
				_undoSnapshot: null,
			};
		}

		default:
			return state;
	}
}

/* ── Helpers ── */
function captureSnapshot(state) {
	/* Deep-enough clone for undo: halls and tables spread, layout object copied */
	return {
		halls: state.halls.map((h) => ({ ...h, tables: h.tables.map((t) => ({ ...t, layout: { ...t.layout } })) })),
		selectedTableId: state.selectedTableId,
		tableStatuses: { ...state.tableStatuses },
	};
}

export function defaultTableStatus() {
	return {
		status: 'available',
		reservation: { guestName: '', startTime: '', endTime: '', guestCount: 0 },
		order: { status: 'none', items: [] },
	};
}

/* ═══════════════════════════════════════════════════════════════
 *  Provider
 * ═══════════════════════════════════════════════════════════════ */
export function AppProvider({ children }) {
	const [state, dispatch] = useReducer(reducer, undefined, buildInitialState);

	/* Auto-save whenever layout or statuses change */
	useEffect(() => {
		const data = {
			version: 1,
			restaurants: [{ ...state.restaurant, halls: state.halls }],
			tableStatuses: state.tableStatuses,
		};
		saveData(data);
	}, [state.halls, state.tableStatuses, state.restaurant]);

	return (
		<AppStateContext.Provider value={state}>
			<AppDispatchContext.Provider value={dispatch}>{children}</AppDispatchContext.Provider>
		</AppStateContext.Provider>
	);
}

/* ═══════════════════════════════════════════════════════════════
 *  Hooks
 * ═══════════════════════════════════════════════════════════════ */
export function useAppState() {
	return useContext(AppStateContext);
}
export function useAppDispatch() {
	return useContext(AppDispatchContext);
}

/* Convenience selector returns the currently active hall object */
export function useActiveHall() {
	const { halls, activeHallId } = useAppState();
	return halls.find((h) => h.id === activeHallId) ?? halls[0] ?? null;
}

/* Convenience selector that finds a table status, providing defaults if absent */
export function useTableStatus(tableId) {
	const { tableStatuses } = useAppState();
	return tableStatuses[tableId] ?? defaultTableStatus();
}
