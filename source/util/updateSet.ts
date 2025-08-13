import type {Set} from '../types/typings.js';
import {DatabaseSync} from 'node:sqlite';
import fixPriorities from './fixPriorities.js';

/**
 * Updates a set's priority or completion status in the database.
 * If `priority` is provided, updates the set's priority.
 * If `setComplete` is provided, sets completion to 100% or recalculates.
 * Returns a new Set object with the updated values.
 */
export default function updateSet(
	db: DatabaseSync,
	set: Set,
	options: {priority?: number; setComplete?: boolean},
): Set {
	if (
		typeof options.priority === 'number' &&
		options.priority != set.priority
	) {
		if (options.priority % 1 !== 0)
			throw new Error('Priority must be an integer');
		if (options.priority <= 0)
			throw new Error('Priority must be greater than 0');

		set.priority = options.priority;
		db.prepare('UPDATE lego_sets SET priority = ? WHERE id = ?').run(
			options.priority,
			set.id,
		);
		fixPriorities(db, set);
	}

	if (options.setComplete === true) {
		set.completion = -1;
		db.prepare('UPDATE lego_sets SET completion = -1 WHERE id = ?').run(set.id); // -1 indicates soft completion
	} else if (options.setComplete === false) {
		set.completion = updateSetCompletion(db, set.id);
	}

	return {...set};
}

/**
 * Updates the completion (0-1) for a given set in the database.
 * @param db Database connection
 * @param setId The ID of the set to update
 */
export function updateSetCompletion(db: DatabaseSync, setId: string): number {
	const setParts = db
		.prepare(
			`SELECT SUM(quantity_needed) AS total_needed, SUM(quantity_allocated) AS total_allocated
            FROM lego_set_parts
            WHERE lego_set_id = ?`,
		)
		.get(setId) as {total_needed: number; total_allocated: number};

	if (!setParts || setParts.total_needed === 0) {
		// If no parts are needed, set completion to 0
		db.prepare(`UPDATE lego_sets SET completion = 0 WHERE id = ?`).run(setId);
		return 0;
	}

	const completion = setParts.total_allocated / setParts.total_needed;
	db.prepare(`UPDATE lego_sets SET completion = ? WHERE id = ?`).run(
		completion,
		setId,
	);
	return completion;
}
