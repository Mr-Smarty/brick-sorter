import {DatabaseSync} from 'node:sqlite';
import fixPriorities from './fixPriorities.js';
import {
	findMissingElement,
	getSetDetails,
	getSetParts,
} from './rebrickableApi.js';
import {ElementSelectionNeeded} from '../components/ElementSelector.js';
import type {InventoryPart} from '@rebrickableapi/types/data/inventory-part';
import type {Set} from '@rebrickableapi/types/data/set';

/**
 * Resolves missing element IDs for parts.
 * Throws ElementSelectionNeeded if user input is required (multiple or no possible elements).
 * Skips parts with element_id === '' (already skipped).
 *
 * @param parts Array of InventoryPart objects
 * @param set Set object for context
 * @param skipPartNum Optional part_num to skip (the one just resolved/skipped)
 * @throws {ElementSelectionNeeded} When user input is required for a part
 */
async function resolvePartElements(
	parts: InventoryPart[],
	set: any,
	skipPartNum?: string,
): Promise<void> {
	for (let part of parts.filter(
		p => !p.is_spare && p.part.part_num !== skipPartNum && p.element_id !== '',
	)) {
		if (!part.element_id) {
			try {
				let possibleElements = await findMissingElement(part);
				let possibleElementIds = possibleElements.flatMap(e => e.elements);

				if (!possibleElementIds.length) {
					throw new ElementSelectionNeeded({
						part: part,
						set: set,
						timelyElements: [],
						elements: [], // empty array indicates no elements found
					});
				}

				// If a single element is found, use it
				if (possibleElementIds.length === 1) {
					part.element_id = possibleElementIds[0]!;
				}

				// If multiple elements are found, reorder them and present choices
				else {
					let timelyElements: string[] = [];
					let orderedPossibleElements: string[] = [];
					possibleElements.forEach(e => {
						if (e.year_from <= set.year && e.year_to >= set.year) {
							timelyElements.push(...e.elements);
						} else {
							orderedPossibleElements.push(...e.elements);
						}
					});
					orderedPossibleElements = [
						...timelyElements,
						...orderedPossibleElements,
					];

					// Return element selection data to be handled by UI
					throw new ElementSelectionNeeded({
						part: part,
						set: set,
						timelyElements: timelyElements,
						elements: orderedPossibleElements,
					});
				}
			} catch (error) {
				if (error instanceof ElementSelectionNeeded) throw error;
				throw new Error(
					`Failed to resolve element for part ${part.part.part_num}: ${error}`,
				);
			}
		}
	}
}

/**
 * Inserts parts and their relationships to a set in the database.
 * Skips parts with element_id === '' (skipped by user).
 *
 * @param db Database connection
 * @param setNumber Set number
 * @param parts Array of InventoryPart objects
 * @param skipPartNum Optional part_num to skip (the one just resolved/skipped)
 */
function insertPartsToDatabase(
	db: DatabaseSync,
	setNumber: string,
	parts: InventoryPart[],
	skipPartNum?: string,
): void {
	for (let part of parts.filter(
		p => !p.is_spare && (!skipPartNum || p.part.part_num !== skipPartNum),
	)) {
		if (!part.element_id) {
			continue; // Skip parts that don't have element IDs (were skipped)
		}

		// First insert the part if it doesn't exist
		db.prepare(
			'INSERT OR IGNORE INTO parts (id, name, quantity, part_num, color_id) VALUES (?, ?, ?, ?, ?)',
		).run(
			part.element_id,
			part.part.name,
			0,
			part.part.part_num,
			part.color.id,
		);

		// Then create the relationship between the set and part
		db.prepare(
			'INSERT INTO lego_set_parts (lego_set_id, part_id, quantity_needed) VALUES (?, ?, ?)',
		).run(setNumber, part.element_id, part.quantity);
	}
}

/**
 * Adds a new LEGO set to the database with all its parts.
 * Handles element selection/skip prompts by throwing ElementSelectionNeeded when user input is required.
 * Uses in-memory cache and resolvedParts to persist progress across prompts.
 *
 * @param db Database connection
 * @param setNumber The LEGO set number to add
 * @param priority Optional priority of the set (lower numbers are higher priority)
 * @param selectedElementId Optional element ID for resolving ambiguity in part selection, or 'SKIP' to skip a part
 * @param pendingPartData Optional part data to continue set addition after element selection/skip
 * @param resolvedParts Map of part_num to resolved element_id or '' for skipped parts
 * @param partCache Optional ref to cached parts array (mutated in place)
 * @param setCache Optional ref to cached set object (mutated in place)
 * @returns The created set object and the full parts array (for caching)
 * @throws {ElementSelectionNeeded} When multiple possible elements are found for a part or a part has no elements
 * @throws {Error} When validation fails or set already exists
 */
export async function addSet(
	db: DatabaseSync,
	setNumber: string,
	priority?: number,
	selectedElementId?: string,
	pendingPartData?: InventoryPart,
	resolvedParts: Record<string, string | null> = {},
	partCache?: React.MutableRefObject<InventoryPart[] | undefined>,
	setCache?: React.MutableRefObject<Set | undefined>,
): Promise<{
	set: Set;
	parts: InventoryPart[];
}> {
	if (!/\d+(-\d)?/.test(setNumber)) throw new Error('Invalid set number');

	if (priority === undefined) priority = fixPriorities(db);
	else {
		if (isNaN(priority)) throw new Error('Priority must be a number');
		if (priority % 1 !== 0) throw new Error('Priority must be an integer');
		if (priority <= 0) throw new Error('Priority must be greater than 0');
	}

	// Check if set already exists (only if this is a new set addition, not continuation)
	if (!pendingPartData) {
		const existingSet = db
			.prepare('SELECT id FROM lego_sets WHERE id = ?')
			.get(setNumber);

		if (existingSet) {
			throw new Error(`Set ${setNumber} already exists in the database`);
		}
	}

	// If parts or set are not provided, fetch them from the API
	let set = setCache?.current;
	let parts = partCache?.current;
	if (!set) {
		set = await getSetDetails(setNumber);
		if (setCache) setCache.current = set;
	}
	if (!parts) {
		parts = await getSetParts(setNumber);
		if (!parts.length) throw new Error(`No parts found for set ${setNumber}`);
		if (partCache) partCache.current = parts;
	}

	// Apply resolved/skipped parts from previous steps
	for (const part of parts) {
		if (resolvedParts[part.part.part_num] !== undefined) {
			part.element_id = resolvedParts[part.part.part_num] || '';
		}
	}

	// If we're continuing with a selected element or skip, update the resolvedParts map
	if (selectedElementId && pendingPartData) {
		if (selectedElementId === 'SKIP') {
			resolvedParts[pendingPartData.part.part_num] = '';
		} else {
			resolvedParts[pendingPartData.part.part_num] = selectedElementId;
		}
		// Apply to the current parts array as well
		const targetPart = parts.find(
			p => p.part.part_num === pendingPartData.part.part_num,
		);
		if (targetPart) {
			targetPart.element_id = resolvedParts[pendingPartData.part.part_num]!;
		}
	}

	// Resolve all missing element IDs before making database changes
	await resolvePartElements(parts, set, pendingPartData?.part.part_num);

	// All elements resolved, now add to database
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

		// Add parts and relationships to the set (including the selected element if any)
		insertPartsToDatabase(
			db,
			setNumber,
			parts,
			selectedElementId === 'SKIP' ? pendingPartData?.part.part_num : undefined,
		);

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
