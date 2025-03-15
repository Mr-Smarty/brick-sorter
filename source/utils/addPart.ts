import {DatabaseSync} from 'node:sqlite';
import {Part} from '../typings.js';

export function addPart(
	_db: DatabaseSync,
	_partNumber: string,
	_name?: string,
	_quantity: number = 100,
): Part {
	return {
		id: '1',
		name: 'Placeholder Part 1',
		quantity: 5,
	};
}

export default addPart;
