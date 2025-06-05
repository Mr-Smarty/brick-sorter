import React from 'react';
import {Box, Text} from 'ink';

interface AllocationInfo {
	setId: string;
	setName: string;
	allocated: number;
}

interface AllocationDisplayProps {
	allocations: AllocationInfo[];
	partId: string;
}

export default function AllocationDisplay({
	allocations,
	partId,
}: AllocationDisplayProps) {
	if (allocations.length === 0) {
		return (
			<Box flexDirection="column" paddingLeft={4} minWidth={40}>
				<Text bold>Part Allocation</Text>
				<Text dimColor>Add a part to see allocation details</Text>
			</Box>
		);
	}

	return (
		<Box flexDirection="column" paddingLeft={4} minWidth={40}>
			<Text bold>Part {partId} Allocated To:</Text>
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
						<Text dimColor>Quantity: {allocation.allocated}</Text>
					</Box>
					{index < allocations.length - 1 && <Box height={1} />}
				</Box>
			))}
		</Box>
	);
}
