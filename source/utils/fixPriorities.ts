import {DatabaseSync} from 'node:sqlite';

/**
 * Reorders priorities in the lego_sets table to be sequential integers
 * starting from 1 without gaps or duplicates.
 *
 * @param db Database connection
 * @returns next priority number
 */
export function fixPriorities(db: DatabaseSync): number {
	// Begin a transaction for better performance and data integrity
	db.exec('BEGIN TRANSACTION');

	try {
		// Get all sets ordered by current priority, then by rowid
		const sets = db
			.prepare(
				'SELECT id, priority FROM lego_sets ORDER BY priority ASC, rowid DESC',
			)
			.all() as {id: number; priority: number}[];

		// Reassign priorities in sequential order
		sets.forEach((set, index) => {
			const newPriority = index + 1; // Start with 1

			// Only update if the priority actually changed
			if (set.priority !== newPriority) {
				db.prepare('UPDATE lego_sets SET priority = ? WHERE id = ?').run(
					newPriority,
					set.id,
				);
			}
		});

		// Commit the transaction
		db.exec('COMMIT');

		// Return the next priority number
		return sets.length + 1;
	} catch (error) {
		// Rollback in case of any error
		db.exec('ROLLBACK');
		throw error;
	}
}

export default fixPriorities;
