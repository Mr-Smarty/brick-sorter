import React from 'react';
import BigTextFlex from './components/BigTextTitle.js';
import setup from './utils/setup.js';
import {DatabaseSync} from 'node:sqlite';
import IdEntry from './components/IdEntry.js';
import {DatabaseProvider} from './context/DatabaseContext.js';
import {Box} from 'ink';

type Props = {
	dbPath: string | undefined;
};

export default function App({dbPath = 'bricks.db'}: Props) {
	const db = new DatabaseSync(dbPath);
	setup(db);

	return (
		<DatabaseProvider db={db}>
			<Box flexDirection="column">
				<BigTextFlex text="Brick Sorter" font="block" gradient="retro" />
				<IdEntry />
			</Box>
		</DatabaseProvider>
	);
}
