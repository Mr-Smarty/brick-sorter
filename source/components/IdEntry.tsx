import React, {useState} from 'react';
import {Text, Box, useFocus, useFocusManager, useInput} from 'ink';
import TextInput from 'ink-text-input';
import {useDatabase} from '../context/DatabaseContext.js';
import addSet from '../utils/addSet.js';
import addPart from '../utils/addPart.js';

interface FocusableTextInputProps {
	value: string;
	onChange: (value: string) => void;
	placeholder: string;
	focusKey: string;
	error?: string;
}

const FocusableTextInput: React.FC<FocusableTextInputProps> = ({
	value,
	onChange,
	placeholder,
	focusKey,
	error,
}) => {
	const {isFocused} = useFocus({id: focusKey});

	return (
		<Box flexDirection="column" flexGrow={1}>
			<TextInput
				value={value}
				onChange={onChange}
				placeholder={placeholder}
				focus={isFocused}
				showCursor={isFocused}
			/>
			<Box height={1}>{error && <Text color="red">{error}</Text>}</Box>
		</Box>
	);
};

export default function IdEntry() {
	const db = useDatabase();
	const [setId, setSetId] = useState('');
	const [partId, setPartId] = useState('');
	const [error, setError] = useState('');
	const [errorField, setErrorField] = useState<'setId' | 'partId' | ''>('');
	const {focusNext, focusPrevious} = useFocusManager();
	const {isFocused: isSetIdFocused} = useFocus({id: 'setId'});
	const {isFocused: isPartIdFocused} = useFocus({id: 'partId'});

	useInput((_input, key) => {
		if (key.downArrow) {
			focusNext();
		} else if (key.upArrow) {
			focusPrevious();
		} else if (key.return) {
			if (isSetIdFocused) {
				try {
					addSet(db, Number(setId));
					setSetId('');
					setErrorField('');
				} catch (error) {
					if (error instanceof Error) {
						setError(error.message);
						setErrorField('setId');
					} else {
						setError('An unknown error occurred');
						setErrorField('setId');
					}
				}
			} else if (isPartIdFocused) {
				try {
					addPart(db, Number(setId));
					setPartId('');
					setErrorField('');
				} catch (error) {
					if (error instanceof Error) {
						setError(error.message);
						setErrorField('partId');
					} else {
						setError('An unknown error occurred');
						setErrorField('partId');
					}
				}
			}
		}
	});

	return (
		<Box flexDirection="column">
			<Box>
				<Text>Set Number: </Text>
				<FocusableTextInput
					value={setId}
					onChange={setSetId}
					placeholder="Enter set number"
					focusKey="setId"
					error={errorField === 'setId' ? error : undefined}
				/>
			</Box>

			<Box height={1} />

			<Box>
				<Text>Part Number: </Text>
				<FocusableTextInput
					value={partId}
					onChange={setPartId}
					placeholder="Enter part number"
					focusKey="partId"
					error={errorField === 'partId' ? error : undefined}
				/>
			</Box>
		</Box>
	);
}
