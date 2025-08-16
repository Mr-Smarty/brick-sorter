import {Key} from 'ink';
import {useState} from 'react';

export const usePageState = () => {
	const [current, setCurrent] = useState(1);
	const [total, setTotal] = useState(1);
	const [size, setSize] = useState<number | 'all'>(10);
	return [
		{current, total, size},
		{current: setCurrent, total: setTotal, size: setSize},
		(key: Key) => {
			if (key.shift && key.pageDown) {
				setSize(prev => cyclePageSize(prev, 'down'));
				setCurrent(1);
			} else if (key.shift && key.pageUp) {
				setSize(prev => cyclePageSize(prev, 'up'));
				setCurrent(1);
			} else if (key.pageDown && current < total) {
				setCurrent(prev => prev + 1);
			} else if (key.pageUp && current > 1) {
				setCurrent(prev => prev - 1);
			}
		},
	] as const;
};

const pageSizeOptions: Array<number | 'all'> = [10, 20, 50, 100, 'all'];

export const cyclePageSize = (
	value: number | 'all',
	direction: 'up' | 'down',
): number | 'all' => {
	const index = pageSizeOptions.indexOf(value);
	if (direction === 'up') {
		return pageSizeOptions[(index + 1) % pageSizeOptions.length]!;
	}
	return pageSizeOptions[
		(index - 1 + pageSizeOptions.length) % pageSizeOptions.length
	]!;
};
