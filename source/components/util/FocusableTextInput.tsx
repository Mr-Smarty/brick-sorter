import {Box, useFocus} from 'ink';
import TextInput from 'ink-text-input';
import React, {forwardRef, useImperativeHandle, useState} from 'react';

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
	const [inputKey, setInputKey] = useState(0);

	const handleChange = (newValue: string) => {
		if (type === 'number') {
			newValue = newValue.replace(/[^0-9]/g, '');
		} else if (type === 'float') {
			newValue = newValue.replace(/[^0-9.]/g, '');
			const parts = newValue.split('.');
			if (parts.length > 2) newValue = parts[0] + '.' + parts.slice(1).join('');
		} else if (type === 'character') {
			newValue = newValue.replace(/[^a-z]/gi, '');
		}
		if (maxInputLength !== undefined && newValue.length > maxInputLength)
			newValue = newValue.slice(0, maxInputLength);

		if (newValue !== value) onChange(newValue);
		else setInputKey(prev => prev + 1);
	};

	return (
		<Box flexDirection="column" flexGrow={1} width={width}>
			<TextInput
				key={inputKey}
				value={value}
				onChange={handleChange}
				placeholder={placeholder}
				mask={mask}
				focus={isActive && isFocused}
				showCursor={isActive && isFocused}
			/>
		</Box>
	);
});
