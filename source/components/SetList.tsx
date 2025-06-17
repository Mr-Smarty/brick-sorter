import React from 'react';
import {Box, Text} from 'ink';
import Scroller, {Layout} from './Scroller.js';

type SetListProps = {
	sets: Array<{setId: string; setName: string}>;
	size: Layout;
	isActive: boolean;
};

export default function SetList({
	sets,
	size,
	isActive,
}: SetListProps): React.JSX.Element {
	return (
		<Box flexDirection="column" width="100%" height="100%">
			<Text bold color="cyan">
				Available Sets:
			</Text>
			<Scroller
				height={size.height - 8}
				width={size.width - 4}
				size={size}
				isActive={isActive}
			>
				{sets.map((set, index) => (
					<Box key={set.setId} flexDirection="row">
						<Text color="green">{index + 1}. </Text>
						<Text>
							{set.setName} (ID: {set.setId})
						</Text>
					</Box>
				))}
			</Scroller>
		</Box>
	);
}

{
	// <Scrollbar>
	// 	{sets.map((set, index) => (
	// 		<Box key={set.setId} flexDirection="row" marginBottom={1}>
	// 			<Text color="green">{index + 1}. </Text>
	// 			<Text>
	// 				{set.setName} (ID: {set.setId})
	// 			</Text>
	// 		</Box>
	// 	))}
	// </Scrollbar>;
}
