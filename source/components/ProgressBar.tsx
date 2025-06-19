// Implemented from https://github.com/brigand/ink-progress-bar
// ink-progress-bar node module has compatibility issues

import React from 'react';
import {Text} from 'ink';

type ProgressBarProps = {
	percent: number; // Completion percentage (0 to 1)
	width?: number | `${number}%`; // Width of the progress bar (number of columns or percent string)
	minWidth?: number; // Minimum width of the progress bar
	left?: number; // Padding on the left side
	right?: number; // Padding on the right side
	character?: string; // Character used to fill the progress bar
	rightPad?: boolean; // Whether to pad the right side with spaces
	rightPadCharacter?: string; // Character used for right padding
};

/**
 * ProgressBar Component
 * Displays a progress bar based on the given props.
 */
const ProgressBar: React.FC<ProgressBarProps> = ({
	percent = 1,
	width = 0,
	minWidth = 20,
	left = 0,
	right = 0,
	character = '█',
	rightPad = false,
	rightPadCharacter = ' ',
}) => {
	// Calculate the progress bar width based on percentage or fixed value
	const calculateWidth = (): number => {
		if (typeof width === 'number') return width;

		const screenWidth = process.stdout.columns || 80; // Default to 80 if terminal width is unavailable
		if (typeof width === 'string') {
			if (/^(100|[1-9]?[0-9])%$/.test(width)) {
				const percentage = parseInt(width.slice(0, -1), 10) / 100;
				return Math.max(minWidth, Math.floor(screenWidth * percentage));
			}
			return Math.max(minWidth, screenWidth);
		}

		return Math.max(minWidth, width || screenWidth);
	};

	// Calculate the progress bar string
	const getString = (): string => {
		const screenWidth = calculateWidth();
		const availableSpace = screenWidth - right - left;
		const filledWidth = Math.min(
			Math.floor(availableSpace * percent),
			availableSpace,
		);
		const bar = character.repeat(filledWidth);

		if (!rightPad) {
			return bar;
		}

		return bar + rightPadCharacter.repeat(availableSpace - filledWidth);
	};

	return <Text>{getString()}</Text>;
};

export default ProgressBar;
