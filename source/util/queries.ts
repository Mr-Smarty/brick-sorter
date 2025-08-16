import {SetPart} from '../types/typings.js';

/**
 * Get parts for a set sorted by allocation progress
 * @returns SQL query that when executed returns SetPart[]
 */
export function SetParts_sortby_allocated(
	setId: string,
	allocatedOrder: 'ASC:count' | 'DESC:count' | 'ASC:%' | 'DESC:%' | ':',
): string {
	const orderBy = allocatedOrder.split(':')[0];
	const orderField = allocatedOrder.includes('count')
		? `(lsp.quantity_needed - lsp.quantity_allocated) ${
				orderBy === 'ASC' ? 'DESC' : 'ASC'
		  }`
		: `allocation_percent ${orderBy}`;

	return `SELECT lsp.part_num, lsp.color_id, p.element_id, p.name, p.quantity, p.bricklink_id,
            lsp.lego_set_id as set_id, lsp.quantity_needed, lsp.quantity_allocated,
            CAST(lsp.quantity_allocated AS REAL) / lsp.quantity_needed AS allocation_percent
            FROM lego_set_parts lsp
            JOIN parts p ON lsp.part_num = p.part_num AND lsp.color_id = p.color_id
            WHERE lsp.lego_set_id = '${setId}'
            ORDER BY ${orderField}`;
}

/**
 * Get parts for a set filtered by color
 * @param colorId Optional color ID to filter by. If not provided, all parts are provided grouped by color.
 * @returns SQL query that when executed returns SetPart[]
 */
export function SetParts_filterby_color(
	setId: string,
	colorId?: number,
): string {
	const whereClause = `WHERE lsp.lego_set_id = '${setId}'${
		colorId ? ` AND lsp.color_id = ${colorId}` : ''
	}`;
	const orderClause = colorId
		? ''
		: ' ORDER BY lsp.color_id ASC, lsp.part_num ASC';

	return `SELECT lsp.part_num, lsp.color_id, p.element_id, p.name, p.quantity, p.bricklink_id,
        	lsp.lego_set_id as set_id, lsp.quantity_needed, lsp.quantity_allocated
        	FROM lego_set_parts lsp
        	JOIN parts p ON lsp.part_num = p.part_num AND lsp.color_id = p.color_id
        	${whereClause}${orderClause}`;
}

/**
 * Get parts for a set sorted by part number
 * @returns SQL query that when executed returns SetPart[]
 */
export function SetParts_sortby_partNum(
	setId: string,
	partNumOrder: 'ASC' | 'DESC',
): string {
	return `SELECT lsp.part_num, lsp.color_id, p.element_id, p.name, p.quantity, p.bricklink_id,
            lsp.lego_set_id as set_id, lsp.quantity_needed, lsp.quantity_allocated
            FROM lego_set_parts lsp
            JOIN parts p ON lsp.part_num = p.part_num AND lsp.color_id = p.color_id
            WHERE lsp.lego_set_id = '${setId}'
            ORDER BY lsp.part_num ${partNumOrder}`;
}

/**
 * Get all parts for a set in database order
 * @returns SQL query that when executed returns SetPart[]
 */
export function SetParts(setId: string): string {
	return `SELECT lsp.part_num, lsp.color_id, p.element_id, p.name, p.quantity, p.bricklink_id,
            lsp.lego_set_id as set_id, lsp.quantity_needed, lsp.quantity_allocated
            FROM lego_set_parts lsp
            JOIN parts p ON lsp.part_num = p.part_num AND lsp.color_id = p.color_id
            WHERE lsp.lego_set_id = '${setId}'`;
}

/**
 * Get all sets that match a query by ID or name, ordered by completion and priority.
 * @returns SQL query that when executed returns Set[]
 */
export function Set_bylike_number_or_name(query: string): string {
	return `SELECT id, name, priority, completion
			FROM lego_sets
			WHERE id LIKE '%${query}%' OR name LIKE '%${query}%'
			ORDER BY ABS(completion) DESC, priority ASC`;
}

/**
 * Get IDs of colors used in a set.
 * @returns SQL query that when executed returns number[]
 */
export function SetParts_colors(setId: string): string {
	return `SELECT DISTINCT lsp.color_id
            FROM lego_set_parts lsp
            WHERE lsp.lego_set_id = '${setId}'
            ORDER BY lsp.color_id`;
}

/**
 * Update the quantity allocated for a set part
 * @returns SQL query that when executed updates the quantity allocated for a set part
 */
export function update_SetPart_quantity(
	part: SetPart,
	quantityChange: number,
): string {
	return `UPDATE lego_set_parts SET quantity_allocated = ${part.quantity_allocated} 
			WHERE lego_set_id = '${part.set_id}' AND part_num = '${part.part_num}' AND color_id = ${part.color_id};
			UPDATE parts SET quantity = quantity + ${quantityChange} 
			WHERE part_num = '${part.part_num}' AND color_id = ${part.color_id}`;
}
