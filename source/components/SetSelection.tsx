import React, {useMemo, type JSX} from 'react';
import {Text, Box, useInput} from 'ink';
import ScrollerSelect from './util/ScrollerSelect.js';
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
	const items = useMemo(
		() =>
			sets.map(set => ({
				value: 'set_num' in set ? set.set_num : set.id,
				component: (
					<Box>
						<Text>
							{set.name} (ID: {'set_num' in set ? set.set_num : set.id})
						</Text>
					</Box>
				),
			})),
		[sets],
	);

	const handleSelect = (value: string) => {
		const selectedSet = sets.find(
			set => ('set_num' in set ? set.set_num : set.id) === value,
		);
		if (selectedSet) onSetSelect(selectedSet);
	};

	useInput((_input, key) => {
		if (isActive && key.escape) onCancel();
	});

	return (
		<Box
			flexDirection="column"
			borderStyle="round"
			borderColor="blue"
			padding={1}
			flexGrow={1}
			display={isActive && sets.length > 0 ? 'flex' : 'none'}
		>
			<Text bold>Select a Set:</Text>
			<Box height={1} flexShrink={0} />
			<Box flexGrow={1}>
				<ScrollerSelect
					key={sets.map(s => ('set_num' in s ? s.set_num : s.id)).join('|')}
					items={items}
					onChange={handleSelect}
					isActive={isActive}
					focusStyle="background"
					hideScrollBar
				/>
			</Box>
		</Box>
	);
}
