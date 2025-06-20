import {DatabaseSync} from 'node:sqlite';

/**
 * Updates the completion (0-1) for a given set in the database.
 * @param db Database connection
 * @param setId The ID of the set to update
 */
export function updateSetCompletion(db: DatabaseSync, setId: string): void {
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
		return;
	}

	db.prepare(`UPDATE lego_sets SET completion = ? WHERE id = ?`).run(
		setParts.total_allocated / setParts.total_needed,
		setId,
	);
}

export default updateSetCompletion;
