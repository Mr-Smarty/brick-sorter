// Implemented from https://github.com/vadimdemedes/ink-text-input
// ink-progress-input is missing features like text edit shortcuts, ignoring control keys, enforcing input type and max length

import React, {useState, useEffect} from 'react';
import {Text, useInput} from 'ink';
import chalk from 'chalk';
import type {Except} from 'type-fest';

export type Props = {
	/**
	 * Text to display when `value` is empty.
	 */
	readonly placeholder?: string;
	/**
	 * Listen to user's input. Useful in case there are multiple input components
	 * at the same time and input must be "routed" to a specific component.
	 */
	readonly focus?: boolean;
	/**
	 * Replace all chars and mask the value. Useful for password inputs.
	 */
	readonly mask?: string;
	/**
	 * Whether to show cursor and allow navigation inside text input with arrow keys.
	 */
	readonly showCursor?: boolean;
	/**
	 * Highlight pasted text
	 */
	readonly highlightPastedText?: boolean;
	/**
	 * Type of input. Used to filter out unwanted characters.
	 * - `string` - allows all characters
	 * - `character` - allows only alphabetic characters
	 * - `number` - allows only digits
	 * - `float` - allows digits and a single dot
	 */
	readonly type?: 'string' | 'character' | 'number' | 'float';
	/**
	 * Maximum length of input.
	 */
	readonly maxInputLength?: number;
	/**
	 * Value to display in a text input.
	 */
	readonly value: string;
	/**
	 * Function to call when value updates.
	 */
	readonly onChange: (value: string) => void;
	/**
	 * Function to call when `Enter` is pressed, where first argument is a value of the input.
	 */
	readonly onSubmit?: (value: string) => void;
};

type UncontrolledProps = {
	/**
	 * Initial value.
	 */
	readonly initialValue?: string;
} & Except<Props, 'value' | 'onChange'>;

function TextInput({
	value: originalValue,
	placeholder = '',
	focus = true,
	mask,
	highlightPastedText = false,
	type = 'string',
	maxInputLength,
	showCursor = true,
	onChange,
	onSubmit,
}: Props): React.JSX.Element {
	const [state, setState] = useState({
		cursorOffset: (originalValue || '').length,
		cursorWidth: 0,
	});
	const {cursorOffset, cursorWidth} = state;
	useEffect(() => {
		setState(previousState => {
			if (!focus || !showCursor) {
				return previousState;
			}
			const newValue = originalValue || '';
			if (previousState.cursorOffset > newValue.length - 1) {
				return {
					cursorOffset: newValue.length,
					cursorWidth: 0,
				};
			}
			return previousState;
		});
	}, [originalValue, focus, showCursor]);
	const cursorActualWidth = highlightPastedText ? cursorWidth : 0;
	const value = mask ? mask.repeat(originalValue.length) : originalValue;
	let renderedValue = value;
	let renderedPlaceholder = placeholder ? chalk.grey(placeholder) : undefined;
	// Fake mouse cursor, because it's too inconvenient to deal with actual cursor and ansi escapes
	if (showCursor && focus) {
		renderedPlaceholder =
			placeholder.length > 0
				? chalk.inverse(placeholder[0]) + chalk.grey(placeholder.slice(1))
				: chalk.inverse(' ');
		renderedValue = value.length > 0 ? '' : chalk.inverse(' ');
		let i = 0;
		for (const char of value) {
			renderedValue +=
				i >= cursorOffset - cursorActualWidth && i <= cursorOffset
					? chalk.inverse(char)
					: char;
			i++;
		}
		if (value.length > 0 && cursorOffset === value.length) {
			renderedValue += chalk.inverse(' ');
		}
	}
	useInput(
		(input, key) => {
			if (
				key.upArrow ||
				key.downArrow ||
				(key.ctrl && input === 'c') ||
				key.tab ||
				(key.shift && key.tab) ||
				(key.ctrl && input)
			) {
				return;
			}
			if (key.return) {
				if (onSubmit) {
					onSubmit(originalValue);
				}
				return;
			}
			let nextCursorOffset = cursorOffset;
			let nextValue = originalValue;
			let nextCursorWidth = 0;
			if (key.leftArrow) {
				if (showCursor) {
					nextCursorOffset = Math.max(0, cursorOffset - 1);
				}
			} else if (key.rightArrow) {
				if (showCursor) {
					nextCursorOffset = Math.min(originalValue.length, cursorOffset + 1);
				}
			} else if (key.backspace) {
				if (cursorOffset > 0) {
					nextValue =
						originalValue.slice(0, cursorOffset - 1) +
						originalValue.slice(cursorOffset, originalValue.length);
					nextCursorOffset--;
				}
			} else if (key.delete) {
				if (cursorOffset < originalValue.length) {
					nextValue =
						originalValue.slice(0, cursorOffset) +
						originalValue.slice(cursorOffset + 1, originalValue.length);
					if (cursorOffset >= originalValue.length - 1) {
						nextCursorOffset = originalValue.length - 1;
					}
				} else {
					nextValue = originalValue.slice(0, originalValue.length - 1);
					nextCursorOffset = originalValue.length - 1;
				}
			} else {
				nextValue =
					originalValue.slice(0, cursorOffset) +
					input +
					originalValue.slice(cursorOffset, originalValue.length);
				nextCursorOffset += input.length;
				if (input.length > 1) {
					nextCursorWidth = input.length;
				}
			}
			nextCursorOffset = Math.max(
				0,
				Math.min(nextCursorOffset, nextValue.length),
			);
			setState({
				cursorOffset: nextCursorOffset,
				cursorWidth: nextCursorWidth,
			});

			if (type === 'number') {
				nextValue = nextValue.replace(/[^0-9]/g, '');
			} else if (type === 'float') {
				nextValue = nextValue.replace(/[^0-9.]/g, '');
				const parts = nextValue.split('.');
				if (parts.length > 2)
					nextValue = parts[0] + '.' + parts.slice(1).join('');
			} else if (type === 'character') {
				nextValue = nextValue.replace(/[^a-z]/gi, '');
			}
			if (maxInputLength !== undefined && nextValue.length > maxInputLength)
				nextValue = nextValue.slice(0, maxInputLength);

			if (nextValue !== originalValue) {
				onChange(nextValue);
			}
		},
		{isActive: focus},
	);
	return React.createElement(
		Text,
		null,
		placeholder
			? value.length > 0
				? renderedValue
				: renderedPlaceholder
			: renderedValue,
	);
}
export default TextInput;
export function UncontrolledTextInput({
	initialValue = '',
	...props
}: UncontrolledProps): React.JSX.Element {
	const [value, setValue] = useState(initialValue);
	return React.createElement(TextInput, {
		...props,
		value: value,
		onChange: setValue,
	});
}
