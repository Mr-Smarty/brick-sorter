import React from 'react';
import {Text, Box, useInput} from 'ink';
import SelectInput from 'ink-select-input';
import type {Set} from '@rebrickableapi/types/data/set';

interface SetSelectionProps {
	sets: Set[];
	onSetSelect: (set: Set) => void;
	onCancel: () => void;
	isActive: boolean;
}

export default function SetSelection({
	sets,
	onSetSelect,
	onCancel,
	isActive,
}: SetSelectionProps): JSX.Element {
	const items = sets.map(set => ({
		label: `${set.name} (ID: ${set.set_num})`,
		value: set.set_num,
	}));

	const handleSelect = (item: {value: string}) => {
		const selectedSet = sets.find(set => set.set_num === item.value);
		if (selectedSet) onSetSelect(selectedSet);
	};

	useInput((_input, key) => {
		if (isActive && key.escape) onCancel();
	});

	return (
		<>
			{isActive && sets.length && (
				<Box
					flexDirection="column"
					borderStyle="round"
					borderColor="blue"
					padding={1}
				>
					<Text bold>Select a Set:</Text>
					<Box height={1} />
					<SelectInput
						items={items}
						onSelect={handleSelect}
						isFocused={isActive}
					/>
				</Box>
			)}
		</>
	);
}
