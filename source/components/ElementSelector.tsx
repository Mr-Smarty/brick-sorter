import React, {useState} from 'react';
import {Text, Box, useInput} from 'ink';
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
}

export default function ElementSelector({
	data,
	onSelect,
	onSkip,
	onCancel,
}: ElementSelectorProps) {
	const hasElements = data.elements.length > 0;
	const [selectedIndex, setSelectedIndex] = useState(0);

	const totalOptions = hasElements ? data.elements.length + 1 : 0; // +1 for the "Skip this part" option

	useInput((_input, key) => {
		if (!hasElements) {
			if (key.return) {
				onSkip();
			} else if (key.escape) {
				onCancel();
			}
			return;
		}

		if (key.upArrow && selectedIndex > 0) {
			setSelectedIndex(selectedIndex - 1);
		} else if (key.downArrow && selectedIndex < totalOptions - 1) {
			setSelectedIndex(selectedIndex + 1);
		} else if (key.return) {
			if (selectedIndex === totalOptions - 1) {
				onSkip();
			} else {
				onSelect(data.elements[selectedIndex]!);
			}
		} else if (key.escape) {
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
					: 'No Element IDs Found'}
			</Text>
			<Text>
				Part: {data.part.part.name} ({data.part.part.part_num})
			</Text>
			<Text dimColor>Part image: {data.part.part.part_img_url}</Text>
			<Text dimColor>
				Instructions: https://rebrickable.com/instructions/{data.set.set_num}/
			</Text>
			<Box height={1} />
			{hasElements ? (
				<>
					<Text>Select element ID:</Text>
					{data.elements.map((elementId, index) => {
						const isTimely = data.timelyElements.includes(elementId);
						return (
							<Box key={elementId}>
								<Text color={index === selectedIndex ? 'green' : 'white'}>
									{index === selectedIndex ? '> ' : '  '}
									{elementId}
									{isTimely ? ' (available during set year)' : ''}
								</Text>
							</Box>
						);
					})}
					<Box>
						<Text
							color={selectedIndex === totalOptions - 1 ? 'green' : 'yellow'}
						>
							{selectedIndex === totalOptions - 1 ? '> ' : '  '}
							Skip this part
						</Text>
					</Box>
				</>
			) : (
				<>
					<Text color="yellow">
						No element IDs found for this part in the Rebrickable database.
					</Text>
					<Box marginTop={1}>
						<Text color="green">{'> Skip this part and continue'}</Text>
					</Box>
				</>
			)}
			<Box height={1} />
			<Text dimColor>
				{hasElements
					? 'Use arrow keys to navigate • Enter to select • Esc to cancel entire set'
					: 'Press Enter to skip this part • Esc to cancel entire set'}
			</Text>
		</Box>
	);
}
