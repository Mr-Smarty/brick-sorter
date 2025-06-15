import React, {useState} from 'react';
import BigTextFlex from './components/BigTextFlex.js';
import setup from './utils/setup.js';
import {DatabaseSync} from 'node:sqlite';
import IdEntry from './components/IdEntry.js';
import AllocationDisplay from './components/AllocationDisplay.js';
import {DatabaseProvider} from './context/DatabaseContext.js';
import {Box, Text} from 'ink';
import {Tab, Tabs} from 'ink-tab';

type Props = {
	dbPath: string | undefined;
};

export default function App({dbPath = 'bricks.db'}: Props) {
	const db = new DatabaseSync(dbPath);
	setup(db);

	const [activeTab, setActiveTab] = useState('dashboard');
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

				<Box
					flexDirection="row"
					flexGrow={1}
					display={activeTab === 'dashboard' ? 'flex' : 'none'}
				>
					<IdEntry
						onAllocationUpdate={handleAllocationUpdate}
						isActive={activeTab === 'dashboard'}
					/>
					<AllocationDisplay allocations={allocations} partId={lastPartId} />
				</Box>

				<Box
					flexDirection="column"
					paddingLeft={4}
					minWidth={40}
					display={activeTab === 'test' ? 'flex' : 'none'}
				>
					<Text>test</Text>
				</Box>

				<Box
					borderStyle="round"
					borderColor="cyan"
					marginTop={1}
					justifyContent="center"
					width="100%"
				>
					<Tabs
						onChange={name => setActiveTab(name)}
						defaultValue="dashboard"
						showIndex={false}
						colors={{activeTab: {color: 'cyan'}}}
						keyMap={{
							useNumbers: false,
							previous: [],
							next: [],
						}}
					>
						<Tab name="dashboard">Dashboard</Tab>
						<Tab name="test">Test</Tab>
					</Tabs>
				</Box>
				<Box justifyContent="center">
					<Text dimColor>← shift+tab | tab →</Text>
				</Box>
			</Box>
		</DatabaseProvider>
	);
}
