import React, {useEffect, useRef, useState} from 'react';
import {useDatabase} from '../context/DatabaseContext.js';
import {Box, Text, useInput} from 'ink';
import Scroller from './util/Scroller.js';
import ProgressBar from './util/ProgressBar.js';
import Gradient from 'ink-gradient';
import PaginationDisplay from './util/PaginationDisplay.js';
import type {Set} from '../types/typings.js';
import {formatPercentage} from '../util/formatPercentage.js';

type SetListProps = {
	isActive: boolean;
};

export default function SetList({isActive}: SetListProps): React.JSX.Element {
	const db = useDatabase();
	const [sets, setSets] = useState<Array<Set>>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [pageSize, setPageSize] = useState<number | 'all'>(10);
	const [sortMode, setSortMode] = useState<'priority' | 'completion'>(
		'priority',
	);
	const [priorityOrder, setPriorityOrder] = useState<'ASC' | 'DESC' | ''>(
		'ASC',
	);
	const [completionOrder, setCompletionOrder] = useState<'ASC' | 'DESC' | ''>(
		'DESC',
	);

	const scrollerRef = useRef<{setScroll: (pos: number) => void}>(null);

	useEffect(() => {
		if (isActive) {
			let query: string;
			if (sortMode === 'priority' && priorityOrder)
				query = `SELECT id, name, completion, priority FROM lego_sets ORDER BY priority ${priorityOrder}`;
			else if (sortMode === 'completion' && completionOrder)
				query = `SELECT id, name, completion, priority FROM lego_sets ORDER BY completion ${completionOrder}`;
			else query = 'SELECT id, name, completion, priority FROM lego_sets';

			const allSets = db.prepare(query).all() as Array<Set>;
			setTotalPages(
				pageSize === 'all' ? 1 : Math.ceil(allSets.length / pageSize),
			);
			const startIndex = pageSize === 'all' ? 0 : (currentPage - 1) * pageSize;
			const paginatedSets =
				pageSize === 'all'
					? allSets
					: allSets.slice(startIndex, startIndex + pageSize);
			setSets(paginatedSets);
		}
	}, [
		isActive,
		sortMode,
		priorityOrder,
		completionOrder,
		currentPage,
		pageSize,
		db,
	]);
	useEffect(
		() => scrollerRef.current?.setScroll(0),
		[sortMode, priorityOrder, completionOrder, currentPage, pageSize],
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
		} else if (key.shift && key.pageDown) {
			setPageSize(prev => cyclePageSize(prev, 'down'));
			setCurrentPage(1);
		} else if (key.shift && key.pageUp) {
			setPageSize(prev => cyclePageSize(prev, 'up'));
			setCurrentPage(1);
		} else if (key.pageDown && currentPage < totalPages) {
			setCurrentPage(prev => prev + 1);
		} else if (key.pageUp && currentPage > 1) {
			setCurrentPage(prev => prev - 1);
		} else if (key.escape) {
			setCurrentPage(1);
			setSortMode('priority');
			setPriorityOrder('ASC');
			setCompletionOrder('');
		}
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

			<Box flexGrow={1} minHeight={0}>
				<Scroller ref={scrollerRef} isActive={isActive} characters={['█', '▒']}>
					{sets.map(set => (
						<Box
							key={set.id}
							flexDirection="row"
							flexShrink={0}
							width="100%"
							justifyContent="space-between"
						>
							<Box flexDirection="row">
								<Box flexShrink={0}>
									<Text color={priorityColor}>{`${set.priority}. `}</Text>
								</Box>
								<Text wrap="truncate">{set.name}</Text>
								<Box flexShrink={0}>
									<Text color="gray">{` (ID: ${set.id}) `}</Text>
								</Box>
							</Box>
							<Box flexDirection="row" flexShrink={0}>
								<Text>|</Text>
								<Gradient name="retro">
									<ProgressBar
										percent={set.completion}
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
											(set.completion === 1 ? 'green' : undefined)
										}
									>
										{formatPercentage(set.completion)}
									</Text>
								</Box>
							</Box>
						</Box>
					))}
				</Scroller>
			</Box>

			<Box justifyContent="center" alignItems="center" flexDirection="column">
				<Box>
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
					<Text color="gray">↑/↓ to scroll. </Text>
					<Text>Page: </Text>
					<Text color="gray">PgUp </Text>
					<PaginationDisplay current={currentPage} total={totalPages} />
					<Text color="gray"> PgDn</Text>
					<Text> | Page Size: </Text>
					<Text>{pageSize}</Text>
					<Text color="gray"> (Shift+PgUp/PgDn to change)</Text>
				</Box>
			</Box>
		</Box>
	);
}

const cycleSortOrder = (value: 'ASC' | 'DESC' | ''): 'ASC' | 'DESC' | '' => {
	if (value === 'ASC') return 'DESC';
	if (value === 'DESC') return '';
	return 'ASC';
};

const pageSizeOptions: Array<number | 'all'> = [10, 20, 50, 100, 'all'];
const cyclePageSize = (
	value: number | 'all',
	direction: 'up' | 'down',
): number | 'all' => {
	const index = pageSizeOptions.indexOf(value);
	if (direction === 'up') {
		return pageSizeOptions[(index + 1) % pageSizeOptions.length]!;
	}
	return pageSizeOptions[
		(index - 1 + pageSizeOptions.length) % pageSizeOptions.length
	]!;
};
