import {DatabaseSync} from 'node:sqlite';
import type {Set} from '../typings.js';
import fixPriorities from './fixPriorities.js';
import {config} from 'dotenv';
import {getSetDetails, getSetParts} from './rebrickableApi.js';
config({path: new URL('../../.env', import.meta.url)});
const apiKey = process.env['REBRICKABLE_API_KEY'];

/**
 * Adds a new LEGO set to the database with placeholder parts
 * @param db Database connection
 * @param setNumber The LEGO set number to add
 * @param name Optional name for the set (defaults to set number if not provided)
 * @param priority Priority of the set (lower numbers are higher priority)
 * @returns The created set object
 */
export async function addSet(
	db: DatabaseSync,
	setNumber: string,
	priority?: number,
): Promise<Set> {
	if (!/\d+(-\d)?/.test(setNumber)) throw new Error('Invalid set number');

	if (priority === undefined) priority = fixPriorities(db);
	else {
		if (isNaN(priority)) throw new Error('Priority must be a number');
		if (priority % 1 !== 0) throw new Error('Priority must be an integer');
		if (priority <= 0) throw new Error('Priority must be greater than 0');
	}

	// Check if set already exists
	const existingSet = db
		.prepare('SELECT id FROM lego_sets WHERE id = ?')
		.get(setNumber);

	if (existingSet) {
		throw new Error(`Set ${setNumber} already exists in the database`);
	}

	// Fetch parts from Rebrickable API
	if (!apiKey) {
		throw new Error('REBRICKABLE_API_KEY environment variable is not set');
	}
	const set = await getSetDetails(setNumber, apiKey);
	const parts = await getSetParts(setNumber, apiKey);
	if (parts.length === 0) throw new Error(`No set found for set ${setNumber}`);

	// Add the set to the database
	db.prepare('INSERT INTO lego_sets (id, name, priority) VALUES (?, ?, ?)').run(
		setNumber,
		set.name || `Set ${setNumber}`,
		priority,
	);

	// Add placeholder parts and relationships to the set
	for (const part of parts) {
		// First insert the part if it doesn't exist
		db.prepare(
			'INSERT OR IGNORE INTO parts (id, name, quantity) VALUES (?, ?, ?)',
		).run(part.element_id, part.part.name, 0);

		// Then create the relationship between the set and part
		db.prepare(
			'INSERT INTO lego_set_parts (lego_set_id, part_id, quantity_needed) VALUES (?, ?, ?)',
		).run(setNumber, part.element_id, part.quantity);
	}

	// Return the created set
	return {
		id: setNumber,
		name: set.name || `Set ${setNumber}`,
		priority: priority,
	};
}

export default addSet;
