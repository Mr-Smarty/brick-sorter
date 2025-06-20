import React from 'react';
import {Text, Box, useInput} from 'ink';
import SelectInput from 'ink-select-input';
import type {InventoryPart} from '@rebrickableapi/types/data/inventory-part';
import type {Set} from '@rebrickableapi/types/data/set';

export class ElementSelectionNeeded extends Error {
	constructor(
		public data: {
			part: InventoryPart;
			set: Set;
			timelyElements: string[];
			elements: string[];
		},
	) {
		super(
			`Element selection needed for part ${data.part.part.part_num} (${data.part.part.name}) - ${data.elements.length} elements found - Set: ${data.set.set_num}`,
		);
		this.name = 'ElementSelectionNeeded';
	}
}

interface ElementSelectorProps {
	data: {
		part: InventoryPart;
		set: Set;
		timelyElements: string[];
		elements: string[];
	};
	onSelect: (elementId: string) => void;
	onSkip: () => void;
	onCancel: () => void;
	isActive: boolean;
}

export default function ElementSelector({
	data,
	onSelect,
	onSkip,
	onCancel,
	isActive,
}: ElementSelectorProps) {
	const hasElements = data.elements.length > 0;

	const items = [
		...data.elements.map(elementId => ({
			label: `${elementId}${
				data.timelyElements.includes(elementId)
					? ' (available during set year)'
					: ''
			}`,
			value: elementId,
		})),
		{label: 'Skip this part', value: '__SKIP__'},
	];

	const handleSelect = (item: {value: string}) => {
		if (item.value === '__SKIP__') {
			onSkip();
		} else {
			onSelect(item.value);
		}
	};

	useInput((_input, key) => {
		if (!isActive) return;

		if (key.escape) {
			onCancel();
		}
	});

	return (
		<Box
			flexDirection="column"
			padding={1}
			borderStyle="round"
			borderColor="blue"
		>
			<Text bold>
				{hasElements
					? 'Multiple Element IDs Found - Check element ID against part list'
					: 'No Element IDs Found in Rebrickable Database'}
			</Text>
			<Text>
				Part: {data.part.part.name} ({data.part.part.part_num})
			</Text>
			<Text color="gray">Part image: {data.part.part.part_img_url}</Text>
			<Text color="gray">
				Instructions: https://rebrickable.com/instructions/{data.set.set_num}/
			</Text>
			<Box height={1} />
			<SelectInput items={items} onSelect={handleSelect} isFocused={isActive} />
			<Box height={1} />
			<Text color="gray">
				Use arrow keys to navigate • Enter to select • Esc to cancel entire set
			</Text>
		</Box>
	);
}
