import React, {useEffect, useRef, useState} from 'react';
import {useDatabase} from '../context/DatabaseContext.js';
import {Box, Text, useInput} from 'ink';
import ScrollerSelect from './util/ScrollerSelect.js';
import ProgressBar from './util/ProgressBar.js';
import Gradient from 'ink-gradient';
import PaginationDisplay from './util/PaginationDisplay.js';
import {formatPercentage} from '../util/formatPercentage.js';
import {usePageState} from '../util/pagination.js';
import {cycleSortOrder} from '../util/sortOrder.js';
import type {Set} from '../types/typings.js';

type SetListProps = {
	isActive: boolean;
	onOpenSet: (set: Set) => void;
};

export default function SetList({
	isActive,
	onOpenSet,
}: SetListProps): React.JSX.Element {
	const db = useDatabase();
	const [sets, setSets] = useState<Array<Set>>([]);
	const [page, setPage, handlePageInput] = usePageState();
	const [sortMode, setSortMode] = useState<'priority' | 'completion'>(
		'priority',
	);
	const [priorityOrder, setPriorityOrder] = useState<'ASC' | 'DESC' | ''>(
		'ASC',
	);
	const [completionOrder, setCompletionOrder] = useState<'ASC' | 'DESC' | ''>(
		'DESC',
	);

	const scrollerRef = useRef<{
		setScroll: (pos: number) => void;
		clearSelection: () => void;
	}>(null);

	useEffect(() => {
		if (isActive) {
			let query: string;
			if (sortMode === 'priority' && priorityOrder)
				query = `SELECT id, name, completion, priority FROM lego_sets ORDER BY priority ${priorityOrder}`;
			else if (sortMode === 'completion' && completionOrder)
				query = `SELECT id, name, completion, priority FROM lego_sets ORDER BY ABS(completion) ${completionOrder}`;
			else query = 'SELECT id, name, completion, priority FROM lego_sets';

			const allSets = db.prepare(query).all() as Array<Set>;
			setPage.total(
				page.size === 'all' ? 1 : Math.ceil(allSets.length / page.size),
			);
			const startIndex =
				page.size === 'all' ? 0 : (page.current - 1) * page.size;
			const paginatedSets =
				page.size === 'all'
					? allSets
					: allSets.slice(startIndex, startIndex + page.size);
			setSets(paginatedSets);
		}
	}, [
		isActive,
		sortMode,
		priorityOrder,
		completionOrder,
		page.current,
		page.size,
		db,
	]);
	useEffect(
		() => scrollerRef.current?.setScroll(0),
		[sortMode, priorityOrder, completionOrder, page.current, page.size],
	);

	useInput((_input, key) => {
		if (!isActive) return;

		if (key.leftArrow) {
			setSortMode('priority');
		} else if (key.rightArrow) {
			setSortMode('completion');
		} else if (key.return) {
			if (sortMode === 'priority') setPriorityOrder(cycleSortOrder);
			else setCompletionOrder(cycleSortOrder);
		} else if (key.escape) {
			setPage.current(1);
			setSortMode('priority');
			setPriorityOrder('ASC');
			setCompletionOrder('');
			scrollerRef.current?.setScroll(0);
		} else handlePageInput(key);
	});

	const priorityColor = sortMode === 'priority' ? 'blue' : undefined;
	const completionColor = sortMode === 'completion' ? 'blue' : undefined;

	return (
		<Box flexDirection="column" flexGrow={1}>
			<Box paddingX={1} flexDirection="row" justifyContent="space-between">
				<Box flexDirection="row" flexShrink={0}>
					<Text bold color={priorityColor}>
						Priority
					</Text>
					{sortMode === 'priority' && (
						<Text color="green">
							{priorityOrder === 'ASC'
								? ' ↑'
								: priorityOrder === 'DESC'
								? ' ↓'
								: ''}
						</Text>
					)}
					<Text bold>{' | Set Name'}</Text>
					<Text bold color="gray">
						{' (Set ID)'}
					</Text>
				</Box>
				<Box flexDirection="row" flexShrink={0}>
					<Text bold color={completionColor}>
						Completion
					</Text>
					{sortMode === 'completion' && (
						<Text color="green">
							{completionOrder === 'ASC'
								? ' ↑'
								: completionOrder === 'DESC'
								? ' ↓'
								: ''}
						</Text>
					)}
				</Box>
			</Box>

			<Box borderStyle="round" borderColor="cyan" flexGrow={1} minHeight={1}>
				<ScrollerSelect
					ref={scrollerRef}
					isActive={isActive}
					characters={['█', '▒']}
					onChange={value => {
						const selectedSet = sets.find(set => set.id === value);
						if (selectedSet) onOpenSet(selectedSet);
						scrollerRef.current?.clearSelection();
					}}
					keys={{
						select: (input, key) => key.ctrl && input === 'o',
					}}
					items={sets.map(set => ({
						component: (
							<Box
								key={set.id}
								flexDirection="row"
								flexShrink={0}
								flexGrow={1}
								justifyContent="space-between"
							>
								<Box flexDirection="row">
									<Box flexShrink={0}>
										<Text color={priorityColor}>{`${set.priority}. `}</Text>
									</Box>
									<Text wrap="truncate">{set.name}</Text>
									<Box flexShrink={0}>
										<Text color="gray">{` (${set.id}) `}</Text>
									</Box>
								</Box>
								<Box flexDirection="row" flexShrink={0}>
									<Text>|</Text>
									<Gradient name="retro">
										<ProgressBar
											percent={Math.abs(set.completion)}
											width="25%"
											minWidth={30}
											character="■"
											rightPad={true}
											rightPadCharacter=" "
										/>
									</Gradient>
									<Text>|</Text>
									<Box width={6} justifyContent="flex-end">
										<Text
											color={
												completionColor ||
												(Math.abs(set.completion) === 1 ? 'green' : undefined)
											}
										>
											{formatPercentage(Math.abs(set.completion))}
											{set.completion < 0 ? '*' : ' '}
										</Text>
									</Box>
								</Box>
							</Box>
						),
						value: set.id,
					}))}
				/>
			</Box>

			<Box justifyContent="center" alignItems="center" flexDirection="column">
				<Box>
					<Text color="gray">ctrl+o to open Set Edit. </Text>
					<Text>Sort by: </Text>
					<Text color="gray">{'← '}</Text>
					<Text color={priorityColor} bold={sortMode === 'priority'}>
						Priority
					</Text>
					<Text>{' or '}</Text>
					<Text color={completionColor} bold={sortMode === 'completion'}>
						Completion
					</Text>
					<Text color="gray">{' →'}</Text>
					<Text color="gray"> (Enter to change Sort order)</Text>
				</Box>
				<Box>
					<Text color="gray">↑/↓ to scroll. Esc to reset. </Text>
					<Text>Page: </Text>
					<Text color="gray">PgUp </Text>
					<PaginationDisplay current={page.current} total={page.total} />
					<Text color="gray"> PgDn</Text>
					<Text> | Page Size: </Text>
					<Text>{page.size}</Text>
					<Text color="gray"> (Shift+PgUp/PgDn to change)</Text>
				</Box>
			</Box>
		</Box>
	);
}
