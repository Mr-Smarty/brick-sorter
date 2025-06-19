import React, {useEffect, useState} from 'react';
import {useDatabase} from '../context/DatabaseContext.js';
import {Box, Text} from 'ink';
import Scroller from './Scroller.js';
import ProgressBar from './ProgressBar.js';
import type {Set} from '../types/typings.js';
import Gradient from 'ink-gradient';

type SetListProps = {
	isActive: boolean;
};

export default function SetList({isActive}: SetListProps): React.JSX.Element {
	const db = useDatabase();
	const [sets, setSets] = useState<Array<Set>>([]);

	useEffect(() => {
		if (isActive) {
			const fetchedSets = db
				.prepare(
					'SELECT id, name, completion FROM lego_sets ORDER BY priority ASC',
				)
				.all() as Array<Set>;
			setSets(fetchedSets);
		}
	}, [isActive, db]);

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
							key={set.id}
							flexDirection="row"
							flexShrink={0}
							width="100%"
							justifyContent="space-between"
						>
							<Box flexDirection="row">
								<Box flexShrink={0}>
									<Text color="green">{`${index + 1}. `}</Text>
								</Box>
								<Text wrap="truncate">{set.name}</Text>
								<Box flexShrink={0}>
									<Text>{` (ID: ${set.id}) `}</Text>
								</Box>
							</Box>
							<Box flexDirection="row" flexShrink={0}>
								<Text>|</Text>
								<Gradient name="retro">
									<ProgressBar
										percent={set.completion}
										width="25%"
										minWidth={30}
										rightPad={true}
										rightPadCharacter=" "
									/>
								</Gradient>
								<Text>| {(set.completion * 100).toFixed(1)}%</Text>
							</Box>
						</Box>
					))}
				</Scroller>
			</Box>
		</Box>
	);
}
