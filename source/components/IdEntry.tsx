import React, {useState} from 'react';
import {Text, Box, useFocus, useFocusManager, useInput} from 'ink';
import TextInput from 'ink-text-input';
import {useDatabase} from '../context/DatabaseContext.js';
import addSet from '../utils/addSet.js';
import addPart from '../utils/addPart.js';
import fixPriorities from '../utils/fixPriorities.js';

interface FocusableTextInputProps {
	value: string;
	onChange: (value: string) => void;
	placeholder: string;
	focusKey: string;
	width?: number;
}

const FocusableTextInput: React.FC<FocusableTextInputProps> = ({
	value,
	onChange,
	placeholder,
	focusKey,
	width,
}) => {
	const {isFocused} = useFocus({id: focusKey});

	return (
		<Box flexDirection="column" flexGrow={1} width={width}>
			<TextInput
				value={value}
				onChange={onChange}
				placeholder={placeholder}
				focus={isFocused}
				showCursor={isFocused}
			/>
		</Box>
	);
};

export default function IdEntry() {
	const db = useDatabase();
	const [setId, setSetId] = useState('');
	const [priority, setPriority] = useState(fixPriorities(db) + '');
	const [partId, setPartId] = useState('');
	const [error, setError] = useState('');
	const [errorField, setErrorField] = useState<
		'setId' | 'partId' | 'priority' | ''
	>('');
	const {focusNext, focusPrevious} = useFocusManager();
	const {isFocused: isSetIdFocused} = useFocus({id: 'setId'});
	const {isFocused: isPriorityFocused} = useFocus({id: 'priority'});
	const {isFocused: isPartIdFocused} = useFocus({id: 'partId'});

	useInput(async (_input, key) => {
		if (key.downArrow) {
			focusNext();
		} else if (key.upArrow) {
			focusPrevious();
		} else if (key.return) {
			if (isSetIdFocused || isPriorityFocused) {
				try {
					await addSet(db, setId, Number(priority));
					setSetId('');
					setPriority(Number(priority) + 1 + '');
					setErrorField('');
					fixPriorities(db);
				} catch (error) {
					if (error instanceof Error) {
						setError(error.message);
						setErrorField(isSetIdFocused ? 'setId' : 'priority');
					} else {
						setError('An unknown error occurred');
						setErrorField(isSetIdFocused ? 'setId' : 'priority');
					}
				}
			} else if (isPartIdFocused) {
				try {
					addPart(db, partId);
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
				<Box marginRight={2}>
					<Text>Set Number: </Text>
					<FocusableTextInput
						value={setId}
						onChange={setSetId}
						placeholder="Enter set #"
						focusKey="setId"
						width={12}
					/>
				</Box>

				<Box>
					<Text>Priority: </Text>
					<FocusableTextInput
						value={priority}
						onChange={setPriority}
						placeholder="#"
						focusKey="priority"
						width={5}
					/>
				</Box>
			</Box>

			<Box height={1}>
				{(errorField === 'setId' || errorField === 'priority') && error && (
					<Text color="red">{error}</Text>
				)}
			</Box>

			<Box height={1} />

			<Box>
				<Text>Part Number: </Text>
				<FocusableTextInput
					value={partId}
					onChange={setPartId}
					placeholder="Enter part #"
					focusKey="partId"
				/>
			</Box>

			<Box height={1}>
				{errorField === 'partId' && error && <Text color="red">{error}</Text>}
			</Box>
		</Box>
	);
}
