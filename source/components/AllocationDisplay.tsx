import React from 'react';
import {Box, Text} from 'ink';
import {getColorInfo} from '../util/rebrickableApi.js';

interface AllocationInfo {
	setId: string;
	setName: string;
	allocated: number;
}

interface AllocationDisplayProps {
	allocations: AllocationInfo[];
	part:
		| {
				partNumber: string;
				colorId: number;
		  }
		| {elementId: string};
}

export default function AllocationDisplay({
	allocations,
	part,
}: AllocationDisplayProps) {
	if (!allocations.length) {
		return (
			<Box flexDirection="column" paddingLeft={4} minWidth={40}>
				<Text bold>Part Allocation</Text>
				<Text color="gray">Add a part to see allocation details</Text>
			</Box>
		);
	}

	if ('elementId' in part) {
		return (
			<Box flexDirection="column" paddingLeft={4} minWidth={40}>
				<Text bold>Element {part.elementId} Allocated To:</Text>
				<Box height={1} />
				{allocations.map((allocation, index) => (
					<Box key={index} flexDirection="column">
						<Box flexDirection="row">
							<Text color="green">[+] </Text>
							<Text>
								{allocation.setName} ({allocation.setId})
							</Text>
						</Box>
						<Box paddingLeft={4}>
							<Text color="gray">Quantity: {allocation.allocated}</Text>
						</Box>
						{index < allocations.length - 1 && <Box height={1} />}
					</Box>
				))}
			</Box>
		);
	}

	const partColor = getColorInfo(part.colorId)?.name || 'Unknown Color';
	return (
		<Box flexDirection="column" paddingLeft={4} minWidth={40}>
			<Text bold>
				Part {part.partNumber} ({partColor}) Allocated To:
			</Text>
			<Box height={1} />
			{allocations.map((allocation, index) => (
				<Box key={index} flexDirection="column">
					<Box flexDirection="row">
						<Text color="green">[+] </Text>
						<Text>
							{allocation.setName} ({allocation.setId})
						</Text>
					</Box>
					<Box paddingLeft={4}>
						<Text color="gray">Quantity: {allocation.allocated}</Text>
					</Box>
					{index < allocations.length - 1 && <Box height={1} />}
				</Box>
			))}
		</Box>
	);
}
