import React, {useEffect, useState} from 'react';
import BigTextFlex from './components/BigTextFlex.js';
import setup from './utils/setup.js';
import {DatabaseSync} from 'node:sqlite';
import IdEntry from './components/IdEntry.js';
import AllocationDisplay from './components/AllocationDisplay.js';
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
	const [sets, _setSets] = useState<Array<{setId: string; setName: string}>>([
		{setId: '1234', setName: 'Set A'},
		{setId: '5678', setName: 'Set B'},
		{setId: '12341', setName: 'Set D'},
		{setId: '91011', setName: 'Set E'},
		{setId: '12342', setName: 'Set F'},
		{setId: '12343', setName: 'Set G'},
		{setId: '12344', setName: 'Set H'},
		{setId: '12345', setName: 'Set I'},
		{setId: '12346', setName: 'Set J'},
		{setId: '12347', setName: 'Set K'},
		{setId: '12348', setName: 'Set L'},
		{setId: '12349', setName: 'Set M'},
		{setId: '12350', setName: 'Set N'},
		{setId: '12351', setName: 'Set O'},
		{setId: '12352', setName: 'Set P'},
		{setId: '12353', setName: 'Set Q'},
		{setId: '12354', setName: 'Set R'},
		{setId: '12355', setName: 'Set S'},
		// Add more sets here
	]);

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
					<SetList sets={sets} isActive={activeTab === 'sets'} />
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
					<Text dimColor>← shift+tab | tab →</Text>
				</Box>
			</Box>
		</DatabaseProvider>
	);
}
