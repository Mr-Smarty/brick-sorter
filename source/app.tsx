import React, {useState} from 'react';
import BigTextFlex from './components/BigTextFlex.js';
import setup from './utils/setup.js';
import {DatabaseSync} from 'node:sqlite';
import IdEntry from './components/IdEntry.js';
import AllocationDisplay from './components/AllocationDisplay.js';
import {DatabaseProvider} from './context/DatabaseContext.js';
import {Box} from 'ink';

type Props = {
	dbPath: string | undefined;
};

export default function App({dbPath = 'bricks.db'}: Props) {
	const db = new DatabaseSync(dbPath);
	setup(db);

	const [allocations, setAllocations] = useState<
		Array<{setId: string; setName: string; allocated: number}>
	>([]);
	const [lastPartId, setLastPartId] = useState('');

	const handleAllocationUpdate = (
		newAllocations: Array<{setId: string; setName: string; allocated: number}>,
		partId: string,
	) => {
		setAllocations(newAllocations);
		setLastPartId(partId);
	};

	return (
		<DatabaseProvider db={db}>
			<Box flexDirection="column" width="100%" height="100%">
				<BigTextFlex
					text="Brick Sorter"
					font="block"
					gradient="retro"
					align="center"
				/>
				<Box flexDirection="row" flexGrow={1}>
					<IdEntry onAllocationUpdate={handleAllocationUpdate} />
					<AllocationDisplay allocations={allocations} partId={lastPartId} />
				</Box>
			</Box>
		</DatabaseProvider>
	);
}
