import React from 'react';
import {Text, Box, useInput} from 'ink';
import SelectInput from 'ink-select-input';
import type {Set as ApiSet} from '@rebrickableapi/types/data/set';
import type {Set} from '../types/typings.js';

interface SetSelectionProps<T extends Set | ApiSet> {
	sets: T[];
	onSetSelect: (set: T) => void;
	onCancel: () => void;
	isActive: boolean;
}

export default function SetSelection<T extends Set | ApiSet>({
	sets,
	onSetSelect,
	onCancel,
	isActive,
}: SetSelectionProps<T>): JSX.Element {
	const items = sets.map(set => ({
		label: `${set.name} (ID: ${'set_num' in set ? set.set_num : set.id})`,
		value: 'set_num' in set ? set.set_num : set.id,
	}));

	const handleSelect = (item: {value: string}) => {
		const selectedSet = sets.find(
			set => ('set_num' in set ? set.set_num : set.id) === item.value,
		);
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
