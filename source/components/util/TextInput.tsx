// Implemented from https://github.com/vadimdemedes/ink-text-input
// ink-progress-input is missing features like text edit shortcuts, ignoring control keys, enforcing input type and max length

import React, {useState, useEffect} from 'react';
import {Text, useInput} from 'ink';
import chalk from 'chalk';
import type {Except} from 'type-fest';

type InputType = 'string' | 'character' | 'number' | 'float';
type ValueType<T extends InputType> = T extends 'number' | 'float'
	? number | null
	: string;

export type Props<T extends InputType = 'string'> = {
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
	readonly type?: T;
	/**
	 * Maximum length of input.
	 */
	readonly maxInputLength?: number;
	/**
	 * Value to display in a text input.
	 */
	readonly value: ValueType<T>;
	/**
	 * Function to call when value updates.
	 */
	readonly onChange: (value: ValueType<T>) => void;
	/**
	 * Function to call when `Enter` is pressed, where first argument is a value of the input.
	 */
	readonly onSubmit?: (value: ValueType<T>) => void;
};

type UncontrolledProps<T extends InputType = 'string'> = {
	/**
	 * Initial value of the input.
	 */
	readonly initialValue?: ValueType<T>;
} & Except<Props<T>, 'value' | 'onChange'>;

function TextInput<T extends InputType = 'string'>({
	value: originalValue,
	placeholder = '',
	focus = true,
	mask,
	highlightPastedText = false,
	type = 'string' as T,
	maxInputLength,
	showCursor = true,
	onChange,
	onSubmit,
}: Props<T>): React.JSX.Element {
	const toRawString = (val: ValueType<T>) =>
		val == null ? '' : String(val) || '';
	const rawString = toRawString(originalValue);

	const [state, setState] = useState({
		cursorOffset: rawString.length,
		cursorWidth: 0,
	});
	const {cursorOffset, cursorWidth} = state;
	useEffect(() => {
		const rawString = originalValue == null ? '' : String(originalValue) || '';
		setState(previousState => {
			if (!focus || !showCursor) {
				return previousState;
			}
			const newValue = rawString;
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
	const value = mask ? mask.repeat(rawString.length) : rawString;
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
					const outputValue = toValueType(rawString, type);
					onSubmit(outputValue);
				}
				return;
			}
			let nextCursorOffset = cursorOffset;
			let nextCursorWidth = 0;

			let workingRaw = rawString;

			if (key.leftArrow) {
				if (showCursor) {
					nextCursorOffset = Math.max(0, cursorOffset - 1);
				}
			} else if (key.rightArrow) {
				if (showCursor) {
					nextCursorOffset = Math.min(rawString.length, cursorOffset + 1);
				}
			} else if (key.backspace) {
				if (cursorOffset > 0) {
					workingRaw =
						rawString.slice(0, cursorOffset - 1) +
						rawString.slice(cursorOffset);
					nextCursorOffset--;
				}
			} else if (key.delete) {
				if (cursorOffset < rawString.length) {
					workingRaw =
						rawString.slice(0, cursorOffset) +
						rawString.slice(cursorOffset + 1);
				} else if (rawString.length > 0) {
					workingRaw = rawString.slice(0, rawString.length - 1);
					nextCursorOffset = Math.max(0, rawString.length - 1);
				}
			} else {
				workingRaw =
					rawString.slice(0, cursorOffset) +
					input +
					rawString.slice(cursorOffset);
				nextCursorOffset += input.length;
				if (input.length > 1) nextCursorWidth = input.length;
			}

			let sanitizedRaw = workingRaw;
			if (type === 'number') {
				sanitizedRaw = workingRaw.replace(/[^0-9]/g, '');
			} else if (type === 'float') {
				sanitizedRaw = workingRaw.replace(/[^0-9.]/g, '');
				const parts = sanitizedRaw.split('.');
				if (parts.length > 2)
					sanitizedRaw = parts[0] + '.' + parts.slice(1).join('');
			} else if (type === 'character') {
				sanitizedRaw = workingRaw.replace(/[^a-z]/gi, '');
			}

			if (maxInputLength !== undefined && sanitizedRaw.length > maxInputLength)
				sanitizedRaw = sanitizedRaw.slice(0, maxInputLength);

			const invalidInsertion =
				rawString === sanitizedRaw && workingRaw !== rawString;
			if (invalidInsertion) {
				nextCursorOffset = cursorOffset;
				nextCursorWidth = 0;
				return;
			}

			nextCursorOffset = Math.max(
				0,
				Math.min(nextCursorOffset, sanitizedRaw.length),
			);
			setState({
				cursorOffset: nextCursorOffset,
				cursorWidth: nextCursorWidth,
			});

			const nextValue = toValueType(sanitizedRaw, type);
			if (sanitizedRaw !== rawString) onChange(nextValue);
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
export function UncontrolledTextInput<T extends InputType = 'string'>({
	initialValue = '' as ValueType<T>,
	...props
}: UncontrolledProps<T>): React.JSX.Element {
	const [value, setValue] = useState<ValueType<T>>(
		initialValue ?? ('' as ValueType<T>),
	);

	const handleChange = (val: ValueType<T>) => {
		setValue(val);
	};

	const Component = TextInput as React.ComponentType<Props<T>>;
	return React.createElement(Component, {
		...(props as Props<T>),
		value: value as Props<T>['value'],
		onChange: handleChange,
	});
}

function toValueType<T extends InputType>(raw: string, type: T): ValueType<T> {
	if (type === 'number' || type === 'float') {
		if (raw.trim() === '') return null as ValueType<T>;
		const n = Number(raw);
		return (Number.isNaN(n) ? null : n) as ValueType<T>;
	}
	return raw as ValueType<T>;
}
