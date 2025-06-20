import React, {useEffect, useState} from 'react';
import BigTextFlex from './components/util/BigTextFlex.js';
import setup from './util/setup.js';
import {DatabaseSync} from 'node:sqlite';
import IdEntry from './components/IdEntry.js';
import AllocationDisplay from './components/util/AllocationDisplay.js';
import SetList from './components/SetList.js';
import {DatabaseProvider} from './context/DatabaseContext.js';
import {Box, Text} from 'ink';
import {Tab, Tabs} from 'ink-tab';

const MIN_WIDTH = 100; // Minimum terminal width
const MIN_HEIGHT = 24; // Minimum terminal height

type Props = {
	dbPath: string | undefined;
};

export default function App({dbPath = 'bricks.db'}: Props) {
	const db = new DatabaseSync(dbPath);
	setup(db);

	const [size, setSize] = useState({
		width: process.stdout.columns,
		height: process.stdout.rows,
	});
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

	useEffect(() => {
		const onResize = () => {
			setSize({
				width: process.stdout.columns,
				height: process.stdout.rows,
			});
		};

		onResize();
		process.stdout.on('resize', onResize);

		return () => {
			process.stdout.off('resize', onResize);
		};
	}, []);

	if (size.width < MIN_WIDTH || size.height < MIN_HEIGHT)
		return <Text color="red">{'Terminal window size is too small :('}</Text>;

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
					flexGrow={1}
					display={activeTab === 'sets' ? 'flex' : 'none'}
				>
					<SetList isActive={activeTab === 'sets'} />
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
						<Tab name="sets">Sets</Tab>
					</Tabs>
				</Box>
				<Box justifyContent="center">
					<Text color="gray">Shift+Tab | Tab</Text>
				</Box>
			</Box>
		</DatabaseProvider>
	);
}
