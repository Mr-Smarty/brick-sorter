import {DatabaseSync} from 'node:sqlite';
import {updateSetCompletion} from '../util/updateSet.js';
import type {Part} from '../types/typings.js';
import {
	SetPart_quantityAllocated,
	Sets_with_Part_sortby_priority,
	update_Part_quantity,
	update_SetPart_quantityAllocated,
} from './queries.js';
import {AllocationInfo} from '../components/AllocationDisplay.js';

type PartNumberComponents = {
	base: string;
	mold: string;
	patternConst: string;
	patternNum: string;
	assemblyConst: string;
	assemblyNum: string;
};

/**
 * Validates and normalizes BrickLink part numbers.
 * @param partNumber - The part number to validate.
 * @param allowUndefined - Whether to return undefined fields or empty strings.
 * @throws Error if the part number is invalid.
 * @returns The normalized part number if valid, or throws an error if invalid.
 */
export function parsePartNumber(
	partNumber: string,
	allowUndefined?: true,
): {base: string} & Partial<PartNumberComponents>;
export function parsePartNumber(
	partNumber: string,
	allowUndefined: false,
): PartNumberComponents;
export function parsePartNumber(
	partNumber: string,
	allowUndefined: boolean = true,
): (Partial<PartNumberComponents> & {base: string}) | PartNumberComponents {
	const partNumberRegex =
		/^(?<base>\d+)(?<mold>[a-z])?((?<patternConst>p[bx]?)(?<patternNum>\d+))?((?<assemblyConst>c)(?<assemblyNum>\d{2}))?$/;
	if (!partNumberRegex.test(partNumber))
		throw new Error(`Invalid part number: ${partNumber}`);
	const partNumberComponents = partNumber.match(partNumberRegex)?.groups!;
	if (allowUndefined)
		return partNumberComponents as Partial<PartNumberComponents> & {
			base: string;
		};
	else
		return Object.fromEntries(
			Object.entries(partNumberComponents).map(([k, v]) => [k, v ?? '']),
		) as PartNumberComponents;
}

type AddPartParams =
	| {
			partNumber: string;
			colorId: number;
			elementId?: never;
	  }
	| {
			elementId: string;
			partNumber?: never;
			colorId?: never;
	  };
export async function addPart(
	db: DatabaseSync,
	params: AddPartParams,
	quantity: number = 1,
	setId?: string,
): Promise<Array<AllocationInfo>> {
	let partNumber: string;
	let colorId: number;

	if ('elementId' in params && params.elementId) {
		const element = db
			.prepare('SELECT part_num, color_id FROM parts WHERE element_id = ?')
			.get(params.elementId) as
			| {part_num: string; color_id: number}
			| undefined;
		if (!element)
			throw new Error(`Element ID ${params.elementId} not found in database.`);
		partNumber = element.part_num;
		colorId = element.color_id;
	} else {
		partNumber = params.partNumber!;
		colorId = params.colorId!;
	}

	if (isNaN(colorId)) throw new Error('Invalid color ID');
	if (isNaN(quantity)) throw new Error('Quantity must be a number');
	if (quantity % 1 !== 0) throw new Error('Quantity must be an integer');
	if (quantity <= 0) throw new Error('Quantity must be greater than 0');

	// Check if part exists in the database
	const existingPart = db
		.prepare(
			'SELECT part_num, color_id, name, quantity FROM parts WHERE part_num = ? AND color_id = ?',
		)
		.get(partNumber, colorId) as Part | undefined;

	if (!existingPart)
		throw new Error(
			`Part ${partNumber} not found in database. Add a set containing this part first.`,
		);

	// If setId is provided, allocate directly to that set
	if (setId) {
		if (!/\d+(-\d)?/.test(setId)) throw new Error('Invalid set number');

		// Check if set exists
		const existingSet = db
			.prepare('SELECT id, name, completion FROM lego_sets WHERE id = ?')
			.get(setId) as {id: string; name: string; completion: number} | undefined;

		if (!existingSet) {
			throw new Error(`Set ${setId} not found in database. Add the set first.`);
		}

		// Prevent allocation to soft-completed set
		if (existingSet.completion < 0)
			throw new Error(
				`Set ${setId} is marked complete; Unmark it before allocating parts.`,
			);

		// Check if this set actually uses this part
		const setPartRelation = db
			.prepare(
				`SELECT quantity_needed, COALESCE(quantity_allocated, 0) as allocated
				 FROM lego_set_parts 
				 WHERE lego_set_id = ? AND part_num = ? AND color_id = ?`,
			)
			.get(setId, partNumber, colorId) as
			| {quantity_needed: number; allocated: number}
			| undefined;

		if (!setPartRelation)
			throw new Error(
				`Part ${partNumber} (color: ${colorId}) is not used in set ${setId}.`,
			);

		const stillNeeded =
			setPartRelation.quantity_needed - setPartRelation.allocated;
		if (stillNeeded <= 0)
			throw new Error(
				`Set ${setId} already has enough of part ${partNumber} (color: ${colorId}).`,
			);

		const beforeRow = db
			.prepare('SELECT ABS(completion) AS c FROM lego_sets WHERE id = ?')
			.get(setId) as {c: number} | undefined;
		const beforeCompletion = beforeRow?.c ?? 0;

		// Begin transaction
		db.exec('BEGIN TRANSACTION');

		try {
			const toAllocate = Math.min(quantity, stillNeeded);

			// Update the allocated quantity for this set-part relationship
			db.prepare(
				update_SetPart_quantityAllocated(
					toAllocate,
					setId,
					partNumber,
					colorId,
				),
			).run();

			// Update global part inventory
			db.prepare(update_Part_quantity(partNumber, colorId, toAllocate)).run();

			const newCompletion = updateSetCompletion(db, setId);

			db.exec('COMMIT');

			return [
				{
					setId: setId,
					setName: existingSet.name,
					allocated: toAllocate,
					firstAllocated: beforeCompletion === 0 && newCompletion > 0,
					lastNeeded: beforeCompletion < 1 && newCompletion === 1,
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

	const allocations: Array<AllocationInfo> = [];

	try {
		// Get all sets that use this part, ordered by priority (lowest number = highest priority)
		const setsUsingPart = db
			.prepare(Sets_with_Part_sortby_priority(partNumber, colorId))
			.all() as Array<{
			lego_set_id: string;
			quantity_needed: number;
			priority: number;
			set_name: string;
		}>;

		const beforeCompletions = new Map<string, number>();
		for (const s of setsUsingPart) {
			const row = db
				.prepare('SELECT completion AS c FROM lego_sets WHERE id = ?')
				.get(s.lego_set_id) as {c: number} | undefined;
			if (row && row.c < 0) continue; // Skip soft-completed sets
			beforeCompletions.set(s.lego_set_id, row?.c ?? 0);
		}

		// Allocate parts to sets based on priority
		let remainingQuantity = quantity;
		let totalAllocated = 0;

		for (const setInfo of setsUsingPart) {
			if (remainingQuantity <= 0) break;

			// Skip soft-completed sets
			const completionRow = db
				.prepare('SELECT completion FROM lego_sets WHERE id = ?')
				.get(setInfo.lego_set_id) as {completion: number} | undefined;
			if (completionRow && completionRow.completion < 0) continue;
			if (!beforeCompletions.has(setInfo.lego_set_id)) continue;

			// Check how many of this part we still need for this set
			const currentAllocated = db
				.prepare(
					SetPart_quantityAllocated(setInfo.lego_set_id, partNumber, colorId),
				)
				.get() as {allocated: number} | undefined;

			const allocated = currentAllocated?.allocated || 0;
			const stillNeeded = Math.max(0, setInfo.quantity_needed - allocated);

			if (stillNeeded > 0) {
				const toAllocate = Math.min(remainingQuantity, stillNeeded);

				// Update the allocated quantity for this set-part relationship
				db.prepare(
					update_SetPart_quantityAllocated(
						toAllocate,
						setInfo.lego_set_id,
						partNumber,
						colorId,
					),
				).run();

				remainingQuantity -= toAllocate;
				totalAllocated += toAllocate;

				const newCompletion = updateSetCompletion(db, setInfo.lego_set_id);
				const beforeCompletion =
					beforeCompletions.get(setInfo.lego_set_id) ?? 0;

				// Track the allocation
				allocations.push({
					setId: setInfo.lego_set_id,
					setName: setInfo.set_name,
					allocated: toAllocate,
					firstAllocated: beforeCompletion === 0 && newCompletion > 0,
					lastNeeded: beforeCompletion < 1 && newCompletion === 1,
				});
			}
		}

		// Only update global inventory with parts that were actually allocated
		db.prepare(update_Part_quantity(partNumber, colorId, totalAllocated)).run();

		// If no parts were allocated, throw an error
		if (!totalAllocated) {
			throw new Error(
				`Part ${partNumber} (color: ${colorId}) is not needed for any sets not marked complete. ${remainingQuantity} parts not added.`,
			);
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
