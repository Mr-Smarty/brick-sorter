import {DatabaseSync} from 'node:sqlite';
import fixPriorities from './fixPriorities.js';
import {getSetDetails, getSetParts} from './rebrickableApi.js';
import type {InventoryPart} from '@rebrickableapi/types/data/inventory-part';
import type {Set} from '@rebrickableapi/types/data/set';

/**
 * Inserts parts and their relationships to a set in the database.
 *
 * @param db Database connection
 * @param setNumber Set number
 * @param parts Array of InventoryPart objects
 */
function insertPartsToDatabase(
	db: DatabaseSync,
	setNumber: string,
	parts: InventoryPart[],
): void {
	for (let part of parts.filter(p => !p.is_spare)) {
		// First insert the part if it doesn't exist
		db.prepare(
			'INSERT OR IGNORE INTO parts (part_num, color_id, name, quantity, bricklink_id, element_id) VALUES (?, ?, ?, ?, ?, ?)',
		).run(
			part.part.part_num,
			part.color.id,
			part.part.name,
			0,
			part.part.external_ids.BrickLink.join('|'),
			part.element_id || null,
		);

		// Then create the relationship between the set and part
		db.prepare(
			'INSERT INTO lego_set_parts (lego_set_id, part_num, color_id, quantity_needed) VALUES (?, ?, ?, ?)',
		).run(setNumber, part.part.part_num, part.color.id, part.quantity);
	}
}

/**
 * Adds a new LEGO set to the database with all its parts.
 *
 * @param db Database connection
 * @param setNumber The LEGO set number to add
 * @param priority Optional priority of the set (lower numbers are higher priority)
 * @returns {Promise<{set: Set; parts: InventoryPart[]}>} The created set object and the full parts array (for caching)
 * @throws {Error} When validation fails or set already exists
 */
export async function addSet(
	db: DatabaseSync,
	setNumber: `${number}-${number}` | `${number}`,
	onSetSelection: (set: Set[]) => Promise<Set>,
	priority?: number,
): Promise<{
	set: Set;
	parts: InventoryPart[];
}> {
	if (priority === undefined) priority = fixPriorities(db);
	else {
		if (isNaN(priority)) throw new Error('Priority must be a number');
		if (priority % 1 !== 0) throw new Error('Priority must be an integer');
		if (priority <= 0) throw new Error('Priority must be greater than 0');
	}

	let set = await getSetDetails(setNumber);
	if (Array.isArray(set)) {
		if (set.length === 1) set = set[0]!;
		else set = await onSetSelection(set);
		setNumber = set.set_num as `${number}-${number}`;
	}

	const existingSet = db
		.prepare('SELECT id FROM lego_sets WHERE id = ?')
		.get(setNumber);
	if (existingSet)
		throw new Error(`Set ${setNumber} already exists in the database`);

	const parts = await getSetParts(setNumber);
	if (!parts.length) throw new Error(`No parts found for set ${setNumber}`);

	db.exec('BEGIN TRANSACTION');

	try {
		const existingSet = db
			.prepare('SELECT id FROM lego_sets WHERE id = ?')
			.get(setNumber);
		if (!existingSet) {
			db.prepare(
				'INSERT INTO lego_sets (id, name, priority) VALUES (?, ?, ?)',
			).run(setNumber, set.name || `Set ${setNumber}`, priority);
		}

		insertPartsToDatabase(db, setNumber, parts);
		db.exec('COMMIT');
	} catch (error) {
		db.exec('ROLLBACK');
		throw error;
	}

	// Return the created set
	return {
		set: set,
		parts: parts,
	};
}

export default addSet;
