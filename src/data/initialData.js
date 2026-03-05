import { v4 as uuidv4 } from 'uuid';

/* ── Stable IDs used in seed data so the app has a predictable initial state ── */
export const SEED_RESTAURANT_ID = 'seed-restaurant-1';
export const SEED_HALL_MAIN_ID = 'seed-hall-main';
export const SEED_HALL_TERRACE_ID = 'seed-hall-terrace';

/* ── Default layout JSON that is written to localStorage if no data exists ── */
export function createInitialData() {
	return {
		version: 1,
		restaurants: [
			{
				id: SEED_RESTAURANT_ID,
				name: 'My Restaurant',
				halls: [
					{
						id: SEED_HALL_MAIN_ID,
						name: 'Main Hall',
						width: 1100,
						height: 700,
						tables: [
							{ id: uuidv4(), number: '1', capacity: 4, shape: 'round', layout: { x: 100, y: 100, width: 90, height: 90, rotation: 0 } },
							{ id: uuidv4(), number: '2', capacity: 4, shape: 'round', layout: { x: 230, y: 100, width: 90, height: 90, rotation: 0 } },
							{ id: uuidv4(), number: '3', capacity: 6, shape: 'rectangular', layout: { x: 380, y: 90, width: 150, height: 90, rotation: 0 } },
							{ id: uuidv4(), number: '4', capacity: 2, shape: 'square', layout: { x: 100, y: 260, width: 80, height: 80, rotation: 0 } },
							{ id: uuidv4(), number: '5', capacity: 4, shape: 'square', layout: { x: 230, y: 260, width: 80, height: 80, rotation: 0 } },
							{ id: uuidv4(), number: '6', capacity: 8, shape: 'rectangular', layout: { x: 380, y: 250, width: 200, height: 100, rotation: 0 } },
							{ id: uuidv4(), number: '7', capacity: 2, shape: 'round', layout: { x: 620, y: 100, width: 70, height: 70, rotation: 0 } },
							{ id: uuidv4(), number: '8', capacity: 4, shape: 'round', layout: { x: 730, y: 100, width: 90, height: 90, rotation: 0 } },
						],
					},
					{
						id: SEED_HALL_TERRACE_ID,
						name: 'Terrace',
						width: 1100,
						height: 700,
						tables: [
							{ id: uuidv4(), number: '9', capacity: 4, shape: 'square', layout: { x: 80, y: 80, width: 90, height: 90, rotation: 0 } },
							{ id: uuidv4(), number: '10', capacity: 4, shape: 'square', layout: { x: 220, y: 80, width: 90, height: 90, rotation: 0 } },
							{ id: uuidv4(), number: '11', capacity: 6, shape: 'rectangular', layout: { x: 80, y: 230, width: 160, height: 90, rotation: 0 } },
						],
					},
				],
			},
		],
		/* tableStatuses is keyed by tableId and lives outside the layout */
		tableStatuses: {},
	};
}
