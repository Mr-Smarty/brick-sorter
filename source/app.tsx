import React, {useEffect, useState} from 'react';
import BigTextFlex from './components/util/BigTextFlex.js';
import setup from './util/setup.js';
import {DatabaseSync} from 'node:sqlite';
import IdEntry from './components/IdEntry.js';
import AllocationDisplay, {
	AllocationInfo,
} from './components/AllocationDisplay.js';
import SetList from './components/SetList.js';
import {DatabaseProvider} from './context/DatabaseContext.js';
import {Box, Text, useStdout} from 'ink';
import {Tab, Tabs} from 'ink-tab';
import SetEdit from './components/SetEdit.js';
import type {Set} from './types/typings.js';

const MIN_WIDTH = 104; // Minimum terminal width
const MIN_HEIGHT = 24; // Minimum terminal height

type Props = {
	dbPath: string | undefined;
};

export default function App({dbPath = 'bricks.db'}: Props) {
	const db = new DatabaseSync(dbPath);
	setup(db);

	const {stdout} = useStdout();
	const [size, setSize] = useState({
		width: stdout?.columns ?? 0,
		height: stdout?.rows ?? 0,
	});
	const [activeTab, setActiveTab] = useState('dashboard');
	const [allocations, setAllocations] = useState<Array<AllocationInfo>>([]);
	const [lastPart, setLastPart] = useState<
		| {
				partNumber: string;
				colorId: number;
		  }
		| {elementId: string}
	>();
	const [editSet, setEditSet] = useState<Set | null>(null);

	const handleAllocationUpdate = (
		newAllocations: Array<AllocationInfo>,
		part:
			| {
					partNumber: string;
					colorId: number;
			  }
			| {elementId: string},
	) => {
		setAllocations(newAllocations);
		setLastPart(part);
	};

	useEffect(() => {
		const update = () =>
			setSize({
				width: stdout?.columns ?? 0,
				height: stdout?.rows ?? 0,
			});
		update();
		stdout?.on('resize', update);
		return () => {
			stdout?.off?.('resize', update);
		};
	}, [stdout]);

	const tooSmall =
		size.width > 0 &&
		size.height > 0 &&
		(size.width < MIN_WIDTH || size.height < MIN_HEIGHT);

	return (
		<DatabaseProvider db={db}>
			{tooSmall ? (
				<Box
					flexDirection="column"
					alignItems="center"
					justifyContent="center"
					height="100%"
				>
					<Text color="red">
						Terminal window size is too small (need at least {MIN_WIDTH}x
						{MIN_HEIGHT}, got {size.width}x{size.height})
					</Text>
					<Text color="gray">Resize the window to continue.</Text>
				</Box>
			) : (
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
						{lastPart && (
							<AllocationDisplay allocations={allocations} part={lastPart} />
						)}
					</Box>

					<Box
						flexDirection="column"
						flexGrow={1}
						display={activeTab === 'sets' ? 'flex' : 'none'}
					>
						<SetList
							isActive={activeTab === 'sets'}
							onOpenSet={set => {
								setEditSet(set);
								setActiveTab('setEdit');
							}}
						/>
					</Box>

					<Box
						flexDirection="column"
						flexGrow={1}
						display={activeTab === 'setEdit' ? 'flex' : 'none'}
					>
						<SetEdit isActive={activeTab === 'setEdit'} set={editSet} />
					</Box>

					<Box
						borderStyle="round"
						borderColor="cyan"
						marginTop={1}
						justifyContent="center"
						width="100%"
					>
						<Tabs
							key={activeTab}
							onChange={name => setActiveTab(name)}
							defaultValue={activeTab}
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
							<Tab name="setEdit">Set Edit</Tab>
						</Tabs>
					</Box>
					<Box justifyContent="center">
						<Text color="gray">Shift+Tab | Tab</Text>
					</Box>
				</Box>
			)}
		</DatabaseProvider>
	);
}
