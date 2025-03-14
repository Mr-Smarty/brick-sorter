import React from 'react';
import Gradient from 'ink-gradient';
import BigText from 'ink-big-text';
import setup from './utils/setup.js';
import {DatabaseSync} from 'node:sqlite';
import IdEntry from './components/IdEntry.js';
import {DatabaseProvider} from './context/DatabaseContext.js';

type Props = {
	dbPath: string | undefined;
};

export default function App({dbPath = 'bricks.db'}: Props) {
	const db = new DatabaseSync(dbPath);
	setup(db);

	return (
		<DatabaseProvider db={db}>
			<>
				<Gradient name="retro">
					<BigText text="BRICK SORTER CLI" align="center" font="block" />
				</Gradient>
				<IdEntry />
			</>
		</DatabaseProvider>
	);
}
