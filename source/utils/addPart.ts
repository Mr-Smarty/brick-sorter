import {DatabaseSync} from 'node:sqlite';
import {Part} from '../types/typings.js';
import updateSetCompletion from './updateSetCompletion.js';

export async function addPart(
	db: DatabaseSync,
	partNumber: string,
	quantity: number = 1,
	setId?: string,
): Promise<Array<{setId: string; setName: string; allocated: number}>> {
	if (!/\d+/.test(partNumber)) throw new Error('Invalid part number');

	if (isNaN(quantity)) throw new Error('Quantity must be a number');
	if (quantity % 1 !== 0) throw new Error('Quantity must be an integer');
	if (quantity <= 0) throw new Error('Quantity must be greater than 0');

	// Check if part exists in the database
	const existingPart = db
		.prepare('SELECT id, name, quantity FROM parts WHERE id = ?')
		.get(partNumber) as Part | undefined;

	if (!existingPart) {
		throw new Error(
			`Part ${partNumber} not found in database. Add a set containing this part first.`,
		);
	}

	// If setId is provided, allocate directly to that set
	if (setId) {
		if (!/\d+(-\d)?/.test(setId)) throw new Error('Invalid set number');

		// Check if set exists
		const existingSet = db
			.prepare('SELECT id, name FROM lego_sets WHERE id = ?')
			.get(setId) as {id: string; name: string} | undefined;

		if (!existingSet) {
			throw new Error(`Set ${setId} not found in database. Add the set first.`);
		}

		// Check if this set actually uses this part
		const setPartRelation = db
			.prepare(
				`SELECT quantity_needed, COALESCE(quantity_allocated, 0) as allocated
                 FROM lego_set_parts 
                 WHERE lego_set_id = ? AND part_id = ?`,
			)
			.get(setId, partNumber) as
			| {quantity_needed: number; allocated: number}
			| undefined;

		if (!setPartRelation) {
			throw new Error(`Part ${partNumber} is not used in set ${setId}.`);
		}

		const stillNeeded =
			setPartRelation.quantity_needed - setPartRelation.allocated;
		if (stillNeeded <= 0) {
			throw new Error(`Set ${setId} already has enough of part ${partNumber}.`);
		}

		// Begin transaction
		db.exec('BEGIN TRANSACTION');

		try {
			const toAllocate = Math.min(quantity, stillNeeded);

			// Update the allocated quantity for this set-part relationship
			db.prepare(
				`UPDATE lego_set_parts 
                 SET quantity_allocated = quantity_allocated + ?
                 WHERE lego_set_id = ? AND part_id = ?`,
			).run(toAllocate, setId, partNumber);

			// Update global part inventory
			db.prepare('UPDATE parts SET quantity = quantity + ? WHERE id = ?').run(
				toAllocate,
				partNumber,
			);

			updateSetCompletion(db, setId);

			db.exec('COMMIT');

			return [
				{
					setId: setId,
					setName: existingSet.name,
					allocated: toAllocate,
				},
			];
		} catch (error) {
			db.exec('ROLLBACK');
			throw error;
		}
	}

	// priority-based allocation logic
	// Begin transaction for atomicity
	db.exec('BEGIN TRANSACTION');

	let finalQuantity = existingPart.quantity;
	const allocations: Array<{
		setId: string;
		setName: string;
		allocated: number;
	}> = [];

	try {
		// Get all sets that use this part, ordered by priority (lowest number = highest priority)
		const setsUsingPart = db
			.prepare(
				`
				SELECT 
					lsp.lego_set_id,
					lsp.quantity_needed,
					ls.priority,
					ls.name as set_name
				FROM lego_set_parts lsp
				JOIN lego_sets ls ON lsp.lego_set_id = ls.id
				WHERE lsp.part_id = ?
				ORDER BY ls.priority ASC
			`,
			)
			.all(partNumber) as Array<{
			lego_set_id: string;
			quantity_needed: number;
			priority: number;
			set_name: string;
		}>;

		// Allocate parts to sets based on priority
		let remainingQuantity = quantity;
		let totalAllocated = 0;

		for (const setInfo of setsUsingPart) {
			if (remainingQuantity <= 0) break;

			// Check how many of this part we still need for this set
			const currentAllocated = db
				.prepare(
					`
					SELECT COALESCE(quantity_allocated, 0) as allocated
					FROM lego_set_parts 
					WHERE lego_set_id = ? AND part_id = ?
				`,
				)
				.get(setInfo.lego_set_id, partNumber) as
				| {allocated: number}
				| undefined;

			const allocated = currentAllocated?.allocated || 0;
			const stillNeeded = Math.max(0, setInfo.quantity_needed - allocated);

			if (stillNeeded > 0) {
				const toAllocate = Math.min(remainingQuantity, stillNeeded);

				// Update the allocated quantity for this set-part relationship
				db.prepare(
					`
					UPDATE lego_set_parts 
					SET quantity_allocated = quantity_allocated + ?
					WHERE lego_set_id = ? AND part_id = ?
				`,
				).run(toAllocate, setInfo.lego_set_id, partNumber);

				remainingQuantity -= toAllocate;
				totalAllocated += toAllocate;

				// Track the allocation
				allocations.push({
					setId: setInfo.lego_set_id,
					setName: setInfo.set_name,
					allocated: toAllocate,
				});
			}
		}

		// Only update global inventory with parts that were actually allocated
		finalQuantity = existingPart.quantity + totalAllocated;
		db.prepare('UPDATE parts SET quantity = ? WHERE id = ?').run(
			finalQuantity,
			partNumber,
		);

		// If no parts were allocated, throw an error
		if (!totalAllocated) {
			throw new Error(
				`Part ${partNumber} is not needed for any sets. ${remainingQuantity} parts not added.`,
			);
		}

		for (const allocation of allocations) {
			updateSetCompletion(db, allocation.setId);
		}

		db.exec('COMMIT');
	} catch (error) {
		db.exec('ROLLBACK');
		throw error;
	}

	// Return the allocation details
	return allocations;
}

export default addPart;
