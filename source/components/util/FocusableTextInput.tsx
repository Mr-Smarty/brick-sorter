import {Box, useFocus} from 'ink';
import TextInput from './TextInput.js';
import React, {forwardRef, useImperativeHandle} from 'react';

interface FocusableTextInputProps {
	value: string;
	onChange: (value: string) => void;
	placeholder: string;
	focusKey: string;
	width?: number;
	type?: 'string' | 'character' | 'number' | 'float';
	mask?: string;
	maxInputLength?: number;
	isActive: boolean;
}

export const FocusableTextInput = forwardRef<
	{focus: () => void},
	FocusableTextInputProps
>(function FocusableTextInput(
	{
		value,
		onChange,
		placeholder,
		focusKey,
		width,
		type = 'string',
		mask,
		maxInputLength,
		isActive,
	}: FocusableTextInputProps,
	ref: React.Ref<{focus: () => void}>,
) {
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
				placeholder={placeholder}
				mask={mask}
				type={type}
				maxInputLength={maxInputLength}
				focus={isActive && isFocused}
				showCursor={isActive && isFocused}
			/>
		</Box>
	);
});
