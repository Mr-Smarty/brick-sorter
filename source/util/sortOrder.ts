export type SortOrder = 'ASC' | 'DESC' | '';
export type SortOrderExtended =
	| 'ASC:count'
	| 'DESC:count'
	| 'ASC:%'
	| 'DESC:%'
	| ':';

export function cycleSortOrder(value: SortOrder): SortOrder;
export function cycleSortOrder(value: SortOrderExtended): SortOrderExtended;
export function cycleSortOrder(value: SortOrder | SortOrderExtended): string {
	if (value === 'ASC') return 'DESC';
	if (value === 'DESC') return '';
	if (value === '') return 'ASC';

	if (value === 'ASC:count') return 'DESC:count';
	if (value === 'DESC:count') return 'ASC:%';
	if (value === 'ASC:%') return 'DESC:%';
	if (value === 'DESC:%') return ':';
	return 'ASC:count';
}
