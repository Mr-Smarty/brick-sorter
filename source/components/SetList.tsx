import React from 'react';
import {Box, Text} from 'ink';
import Scroller from './Scroller.js';

type SetListProps = {
	sets: Array<{setId: string; setName: string}>;
	isActive: boolean;
};

export default function SetList({
	sets,
	isActive,
}: SetListProps): React.JSX.Element {
	return (
		<Box flexDirection="column" flexGrow={1}>
			<Box flexShrink={0} marginBottom={1}>
				<Text bold color="cyan">
					Available Sets:
				</Text>
			</Box>

			<Box flexGrow={1} minHeight={0}>
				<Scroller isActive={isActive}>
					{sets.map((set, index) => (
						<Box
							key={set.setId}
							flexDirection="row"
							flexShrink={0}
							width="auto"
						>
							<Text color="green">{index + 1}. </Text>
							<Text>
								{set.setName} (ID: {set.setId})
							</Text>
						</Box>
					))}
				</Scroller>
			</Box>
		</Box>
	);
}
