import {Box, useFocus} from 'ink';
import TextInput, {UncontrolledTextInput} from './TextInput.js';
import React, {forwardRef, useImperativeHandle} from 'react';
import type {Except} from 'type-fest';

type InputType = 'string' | 'character' | 'number' | 'float';
type ValueType<T extends InputType> = T extends 'number' | 'float'
	? number | null
	: string;

interface FocusableTextInputProps<T extends InputType = 'string'> {
	value: ValueType<T>;
	onChange: (value: ValueType<T>) => void;
	onSubmit?: (value: ValueType<T>) => void;
	placeholder: string;
	focusKey: string;
	width?: number;
	type?: T;
	mask?: string;
	maxInputLength?: number;
	isActive: boolean;
}

export const FocusableTextInput = forwardRef(function FocusableTextInput<
	T extends InputType = 'string',
>(
	{
		value,
		onChange,
		onSubmit,
		placeholder,
		focusKey,
		width,
		type = 'string' as T,
		mask,
		maxInputLength,
		isActive,
	}: FocusableTextInputProps<T>,
	ref: React.Ref<{focus: () => void}>,
): React.JSX.Element {
	const {isFocused, focus} = useFocus({id: focusKey, isActive: isActive});
	useImperativeHandle(ref, () => ({focus: () => focus(focusKey)}), [
		focus,
		focusKey,
	]);

	return (
		<Box flexDirection="column" flexGrow={1} width={width}>
			<TextInput
				value={String(value)}
				onChange={onChange}
				onSubmit={onSubmit}
				placeholder={placeholder}
				mask={mask}
				type={type}
				maxInputLength={maxInputLength}
				focus={isActive && isFocused}
				showCursor={isActive && isFocused}
			/>
		</Box>
	);
}) as <T extends InputType = 'string'>(
	props: FocusableTextInputProps<T> & {ref?: React.Ref<{focus: () => void}>},
) => JSX.Element;

interface FocusableUncontrolledTextInputProps<T extends InputType = 'string'>
	extends Except<FocusableTextInputProps<T>, 'onChange' | 'value'> {
	initialValue?: ValueType<T>;
}

export const UncontrolledFocusableTextInput = forwardRef(
	function UncontrolledFocusableTextInput<T extends InputType = 'string'>(
		{
			initialValue = '' as ValueType<T>,
			...props
		}: FocusableUncontrolledTextInputProps<T>,
		ref: React.Ref<{focus: () => void}>,
	): React.JSX.Element {
		const {isFocused, focus} = useFocus({
			id: props.focusKey,
			isActive: props.isActive,
		});
		useImperativeHandle(ref, () => ({focus: () => focus(props.focusKey)}), [
			focus,
			props.focusKey,
		]);

		return (
			<Box flexDirection="column" flexGrow={1} width={props.width}>
				<UncontrolledTextInput
					initialValue={initialValue}
					onSubmit={props.onSubmit}
					placeholder={props.placeholder}
					mask={props.mask}
					type={props.type}
					maxInputLength={props.maxInputLength}
					focus={props.isActive && isFocused}
					showCursor={props.isActive && isFocused}
				/>
			</Box>
		);
	},
) as <T extends InputType = 'string'>(
	props: FocusableUncontrolledTextInputProps<T> & {
		ref?: React.Ref<{focus: () => void}>;
	},
) => JSX.Element;
