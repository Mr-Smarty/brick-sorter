import {DatabaseSync} from 'node:sqlite';
import type {Set} from '../typings.js';

/**
 * Adds a new LEGO set to the database with placeholder parts
 * @param db Database connection
 * @param setNumber The LEGO set number to add
 * @param name Optional name for the set (defaults to set number if not provided)
 * @param priority Priority of the set (lower numbers are higher priority)
 * @returns The created set object
 */
export function addSet(
	db: DatabaseSync,
	setNumber: number,
	name?: string,
	priority: number = 100,
): Set {
	if (isNaN(setNumber)) throw new Error('Set number must be a number');
	if (setNumber % 1 !== 0) throw new Error('Set number must be an integer');
	if (setNumber <= 0) throw new Error('Set number must be a positive number');
	if (priority <= 0) throw new Error('Priority must be greater than 0');

	// Check if set already exists
	const existingSet = db
		.prepare('SELECT id FROM lego_sets WHERE id = ?')
		.get(setNumber);

	if (existingSet) {
		throw new Error(`Set ${setNumber} already exists in the database`);
	}

	// Add the set to the database
	db.prepare('INSERT INTO lego_sets (id, name, priority) VALUES (?, ?, ?)').run(
		setNumber,
		name || `Set ${setNumber}`,
		priority,
	);

	// Create placeholder parts for demonstration
	const placeholderParts = [
		{id: 1, name: 'Placeholder Part 1', quantity: 5},
		{id: 2, name: 'Placeholder Part 2', quantity: 3},
		{id: 3, name: 'Placeholder Part 3', quantity: 2},
	];

	// Add placeholder parts and relationships to the set
	for (const part of placeholderParts) {
		// First insert the part if it doesn't exist
		db.prepare(
			'INSERT OR IGNORE INTO parts (id, name, quantity) VALUES (?, ?, ?)',
		).run(part.id, part.name, part.quantity);

		// Then create the relationship between the set and part
		db.prepare(
			'INSERT INTO lego_set_parts (lego_set_id, part_id, quantity_needed) VALUES (?, ?, ?)',
		).run(setNumber, part.id, part.quantity);
	}

	// Return the created set with its parts
	return {
		id: setNumber,
		parts: placeholderParts,
	};
}

export default addSet;
