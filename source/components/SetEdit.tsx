import React, {useEffect, useRef, useState} from 'react';
import {useDatabase} from '../context/DatabaseContext.js';
import {Box, Text, useFocus, useFocusManager, useInput} from 'ink';
import TextInput from './util/TextInput.js';
import {UncontrolledFocusableTextInput} from './util/FocusableTextInput.js';
import SetSelection from './SetSelection.js';
import Gradient from 'ink-gradient';
import ProgressBar from './util/ProgressBar.js';
import {formatPercentage} from '../util/formatPercentage.js';
import updateSet, {updateSetCompletion} from '../util/updateSet.js';
import ScrollerSelect from './util/ScrollerSelect.js';
import PaginationDisplay from './util/PaginationDisplay.js';
import {usePageState} from '../util/pagination.js';
import {cycleSortOrder} from '../util/sortOrder.js';
import open from 'open';
import * as q from '../util/queries.js';
import type {Set, SetPart} from '../types/typings.js';
import {rebrickableColors} from '../util/rebrickableApi.js';

type SetEditState = 'search' | 'searchSelect' | 'edit' | 'loading';
type SortMode = 'allocated' | 'color' | 'partNum';
type SetEditProps = {
	isActive: boolean;
	set: Set | null;
};

export default function SetEdit({
	isActive,
	set,
}: SetEditProps): React.JSX.Element {
	const db = useDatabase();
	const [uiState, setUiState] = useState<SetEditState>('search');
	const [searchQuery, setSearchQuery] = useState('');
	const [searchResults, setSearchResults] = useState<Set[]>([]);
	const [selectedSet, setSelectedSet] = useState<Set | null>(null);
	const [exitOnNextEsc, setExitOnNextEsc] = useState(false);
	const [page, setPage, handlePageInput] = usePageState();
	const [parts, setParts] = useState<SetPart[]>([]);
	const [allParts, setAllParts] = useState<SetPart[]>([]);
	const [sortMode, setSortMode] = useState<SortMode>('color');
	const [allocatedOrder, setAllocatedOrder] = useState<
		'ASC:count' | 'DESC:count' | 'ASC:%' | 'DESC:%' | ':'
	>('ASC:count');
	const [colorFilter, setColorFilter] = useState<number>();
	const [showColorPicker, setShowColorPicker] = useState(false);
	const [availableColors, setAvailableColors] = useState<number[]>([]);
	const [partNumOrder, setPartNumOrder] = useState<'ASC' | 'DESC' | ''>('ASC');
	const [focusedPart, setFocusedPart] = useState<number>(0);
	const [skipListFocusReset, setSkipListFocusReset] = useState<boolean>(false);
	const [status, setStatus] = useState('');

	const scrollerRef = useRef<{
		setScroll: (scroll: number) => void;
		clearSelection: () => void;
	}>(null);

	const focusableFields = ['priority2', 'completion', 'partList'] as const;
	type focusableFields = (typeof focusableFields)[number];
	const {focusNext, focusPrevious, focus, disableFocus, enableFocus} =
		useFocusManager();
	const [lastFocused, setLastFocused] = useState<string | null>('partList');
	const isFocused = {} as Record<focusableFields, boolean>;
	for (const key of focusableFields)
		isFocused[key] = useFocus({id: key, isActive}).isFocused;
	const trueFocus = <T extends string>(
		isFocused: Record<T, boolean>,
	): T | null => Object.entries(isFocused).find(([_, v]) => v)?.[0] as T | null;
	useEffect(() => {
		if (isActive) setLastFocused(() => trueFocus(isFocused));
	}, [...Object.values(isFocused)]);

	useEffect(() => {
		if (isActive && uiState === 'edit') {
			enableFocus();
			if (lastFocused) focus(lastFocused);
			else focus('partList');
		} else disableFocus();
		resetSort();
	}, [isActive, uiState]);

	useEffect(() => {
		if (!isActive || !set) return;
		handleSetSelect(set);
	}, [isActive, set, db]);

	useEffect(() => {
		if (!skipListFocusReset) {
			scrollerRef.current?.setScroll(0);
			setFocusedPart(0);
		}
		setSkipListFocusReset(false);
		if (!selectedSet) return;
		handleSetSelect(selectedSet);
		setShowColorPicker(false);
	}, [
		sortMode,
		allocatedOrder,
		colorFilter,
		partNumOrder,
		page.current,
		page.size,
	]);

	const resetSort = () => {
		setSortMode('color');
		setColorFilter(undefined);
		setPartNumOrder('ASC');
		setAllocatedOrder('ASC:count');
	};

	useInput((input, key) => {
		if (!isActive || uiState === 'loading') return;

		switch (uiState) {
			case 'search':
				if (key.return) handleSearch(searchQuery);
				else if (key.escape) {
					setSearchQuery('');
					setSearchResults([]);
					setSelectedSet(null);
					setStatus('');
				}
				break;
			case 'searchSelect':
				if (key.escape) {
					setUiState('search');
					setStatus('');
				}
				break;
			case 'edit':
				if (key.escape) {
					if (exitOnNextEsc) {
						setExitOnNextEsc(false);
						setUiState('search');
						setSearchQuery('');
						setSearchResults([]);
						setSelectedSet(null);
						setStatus('');
					} else if (showColorPicker) {
						setShowColorPicker(false);
						focus('partList');
					} else {
						setExitOnNextEsc(true);
						setPage.current(1);
						scrollerRef.current?.setScroll(0);
						setFocusedPart(0);
						resetSort();
						focus('partList');
					}
				} else {
					setExitOnNextEsc(false);
					if (showColorPicker) return;

					if (key.downArrow) {
						if (key.shift) focusNext();
						else if (isFocused.partList && parts)
							setFocusedPart(prev =>
								prev < parts.length - 1 ? prev + 1 : prev,
							);
					} else if (key.upArrow) {
						if (key.shift) focusPrevious();
						else if (isFocused.partList && parts)
							setFocusedPart(prev => (prev > 0 ? prev - 1 : 0));
					} else if (key.return) {
						if (isFocused.completion)
							setSelectedSet(
								updateSet(db, selectedSet!, {
									setComplete: selectedSet!.completion >= 0,
								}),
							);
						else if (isFocused.partList) {
							if (sortMode === 'allocated') setAllocatedOrder(cycleSortOrder);
							else if (sortMode === 'color') setShowColorPicker(true);
							else setPartNumOrder(cycleSortOrder);
						}
					} else if (key.leftArrow) {
						if (sortMode === 'allocated') setSortMode('color');
						else if (sortMode === 'color') setSortMode('partNum');
					} else if (key.rightArrow) {
						if (sortMode === 'color') setSortMode('allocated');
						else if (sortMode === 'partNum') setSortMode('color');
					} else if (
						input === '.' &&
						isFocused.partList &&
						parts[focusedPart] &&
						parts[focusedPart].quantity_allocated <
							parts[focusedPart].quantity_needed
					) {
						parts[focusedPart].quantity_allocated++;
						db.prepare(q.update_SetPart_quantity(parts[focusedPart], 1)).run();
						updateSetCompletionAndResort(parts[focusedPart]);
					} else if (
						input === ',' &&
						isFocused.partList &&
						parts[focusedPart] &&
						parts[focusedPart].quantity_allocated > 0
					) {
						parts[focusedPart].quantity_allocated--;
						db.prepare(q.update_SetPart_quantity(parts[focusedPart], -1)).run();
						updateSetCompletionAndResort(parts[focusedPart]);
					} else if (
						input === '>' &&
						isFocused.partList &&
						parts[focusedPart] &&
						parts[focusedPart].quantity_allocated <
							parts[focusedPart].quantity_needed
					) {
						const difference =
							parts[focusedPart].quantity_needed -
							parts[focusedPart].quantity_allocated;
						parts[focusedPart].quantity_allocated += difference;
						db.prepare(
							q.update_SetPart_quantity(parts[focusedPart], difference),
						).run();
						updateSetCompletionAndResort(parts[focusedPart]);
					} else if (
						input === '<' &&
						isFocused.partList &&
						parts[focusedPart] &&
						parts[focusedPart].quantity_allocated > 0
					) {
						const allocated = parts[focusedPart].quantity_allocated;
						parts[focusedPart].quantity_allocated = 0;
						db.prepare(
							q.update_SetPart_quantity(parts[focusedPart], -allocated),
						).run();
						updateSetCompletionAndResort(parts[focusedPart]);
					} else if (key.ctrl && input === 'o') {
						if (isFocused.priority2 || isFocused.completion) {
							open(`https://rebrickable.com/sets/?q=${selectedSet?.id}`);
						} else {
							if (parts[focusedPart]?.element_id)
								open(
									`https://rebrickable.com/search/?q=${parts[focusedPart].element_id}`,
								);
							else if (parts[focusedPart])
								open(
									`https://rebrickable.com/parts/?q=${parts[focusedPart].part_num}&exists_in_color=${parts[focusedPart].color_id}`,
								);
						}
						setStatus('successfully opened preview in browser');
					} else handlePageInput(key);
				}
		}
	});

	const handleSearch = (query: string) => {
		if (!query.trim()) return;

		setUiState('loading');
		setStatus('');

		// Search for sets by number or name
		const dbQuery = q.Set_bylike_number_or_name(query);
		const results = db.prepare(dbQuery).all() as unknown as Set[];
		const exactMatch = results.find(
			set => set.id === query || set.name.toLowerCase() === query.toLowerCase(),
		);

		if (exactMatch) {
			handleSetSelect(exactMatch);
		} else if (results.length > 0) {
			// Multiple or partial matches, show the top options
			setSearchResults(results);
			setUiState('searchSelect');
		} else {
			// No results found
			setStatus(`No results found for "${query}".`);
			setUiState('search');
		}
	};

	const handleSetSelect = (set: Set) => {
		setSelectedSet(set);

		const colors = (
			db.prepare(q.SetParts_colors(set.id)).all() as {color_id: number}[]
		).map(c => c.color_id);
		setAvailableColors(colors);

		const allParts = db
			.prepare(q.SetParts(set.id))
			.all() as unknown as SetPart[];

		let query: string;
		if (sortMode === 'allocated' && allocatedOrder)
			query = q.SetParts_sortby_allocated(set.id, allocatedOrder);
		else if (sortMode === 'color')
			query = q.SetParts_filterby_color(set.id, colorFilter);
		else if (sortMode === 'partNum' && partNumOrder)
			query = q.SetParts_sortby_partNum(set.id, partNumOrder);
		else query = q.SetParts(set.id);

		const sortedParts = db.prepare(query).all() as unknown as SetPart[];
		setPage.total(
			page.size === 'all' ? 1 : Math.ceil(sortedParts.length / page.size),
		);
		const startIndex = page.size === 'all' ? 0 : (page.current - 1) * page.size;
		const paginatedParts =
			page.size === 'all'
				? sortedParts
				: sortedParts.slice(startIndex, startIndex + page.size);
		setParts(paginatedParts);
		setAllParts(allParts);
		setSearchResults([]);
		setUiState('edit');
		setStatus('');
	};

	const updateSetCompletionAndResort = (changedPart: SetPart) => {
		if (!selectedSet) return;

		const newCompletion = updateSetCompletion(db, selectedSet.id);
		setSelectedSet({...selectedSet, completion: newCompletion});

		if (sortMode === 'allocated') {
			const partKey = `${changedPart.part_num}:${changedPart.color_id}`;

			const query = q.SetParts_sortby_allocated(selectedSet.id, allocatedOrder);
			const sortedParts = db.prepare(query).all() as unknown as SetPart[];

			const absoluteIndex = sortedParts.findIndex(
				part => `${part.part_num}:${part.color_id}` === partKey,
			);

			if (absoluteIndex !== -1 && page.size !== 'all') {
				const newPageNumber = Math.floor(absoluteIndex / page.size) + 1;
				const newFocusIndex = absoluteIndex % page.size;

				setSkipListFocusReset(true);
				if (newPageNumber !== page.current) setPage.current(newPageNumber);

				const startIndex = (newPageNumber - 1) * page.size;
				const paginatedParts = sortedParts.slice(
					startIndex,
					startIndex + page.size,
				);
				setParts(paginatedParts);
				setFocusedPart(newFocusIndex);
				scrollerRef.current?.setScroll(newFocusIndex);
			} else if (absoluteIndex !== -1) {
				setParts(sortedParts);
				setFocusedPart(absoluteIndex);
				scrollerRef.current?.setScroll(absoluteIndex);
			}
		} else setParts([...parts]);
	};

	const allocatedColor = sortMode === 'allocated' ? 'blue' : undefined;
	const colorColor = sortMode === 'color' ? 'blue' : undefined;
	const partNumColor = sortMode === 'partNum' ? 'blue' : undefined;

	return (
		<Box flexDirection="column" flexGrow={1}>
			{/* Search Input */}
			{uiState === 'search' && (
				<Box>
					<Text>Search: </Text>
					<TextInput
						focus={isActive && uiState === 'search'}
						value={searchQuery}
						onChange={setSearchQuery}
						onSubmit={handleSearch}
						placeholder="Enter set # or name"
					/>
				</Box>
			)}

			{/* Search Results */}
			{uiState === 'loading' && <Text color="yellow">Searching...</Text>}

			<Box
				flexDirection="column"
				flexGrow={1}
				display={uiState === 'searchSelect' ? 'flex' : 'none'}
			>
				<SetSelection
					sets={searchResults}
					onSetSelect={handleSetSelect}
					onCancel={() => {
						setUiState('search');
						setStatus('');
					}}
					isActive={isActive && uiState === 'searchSelect'}
				/>
				<Text color="gray">Use arrow keys to navigate • Enter to confirm</Text>
			</Box>

			{/* Selected Set */}
			{selectedSet && (
				<Box flexDirection="column" flexGrow={1}>
					<Box flexDirection="row" paddingX={1} justifyContent="space-between">
						<Box flexDirection="row">
							<Text wrap="truncate" bold underline>
								{selectedSet.name}
							</Text>
							<Box flexShrink={0} flexDirection="row">
								<Text>
									{' '}
									<Text color="gray">
										(ID: {selectedSet.id})
									</Text> Priority:{' '}
								</Text>
								<UncontrolledFocusableTextInput
									key={selectedSet.priority}
									placeholder={`${selectedSet.priority}`}
									initialValue={selectedSet.priority}
									type="number"
									onSubmit={value => {
										setSelectedSet(
											updateSet(db, selectedSet, {
												priority: value || undefined,
											}),
										);
									}}
									focusKey="priority2"
									isActive={isActive && uiState === 'edit'}
								/>
							</Box>
						</Box>
						<Box flexDirection="row" flexShrink={0}>
							<Text>|</Text>
							<Gradient name="retro">
								<ProgressBar
									percent={Math.abs(selectedSet.completion)}
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
										Math.abs(selectedSet.completion) === 1 &&
										!isFocused.completion
											? 'green'
											: undefined
									}
									inverse={isFocused.completion}
								>
									{formatPercentage(Math.abs(selectedSet.completion))}
									{selectedSet.completion < 0 ? '*' : ' '}
								</Text>
							</Box>
						</Box>
					</Box>

					<Box paddingX={1} flexDirection="row" justifyContent="space-between">
						<Box flexDirection="row" flexShrink={0}>
							<Text bold color={partNumColor}>
								Part Number
							</Text>
							{sortMode === 'partNum' && (
								<Text color="green">
									{partNumOrder === 'ASC'
										? ' ↑'
										: partNumOrder === 'DESC'
										? ' ↓'
										: ''}
								</Text>
							)}
							<Text bold>{' | '}</Text>
							<Text bold color={colorColor}>
								Color
							</Text>
							{sortMode === 'color' && colorFilter && (
								<>
									<Text color={colorColor}>: </Text>
									<Text
										backgroundColor={`#${
											rebrickableColors.find(c => c.id === colorFilter)?.rgb
										}`}
									>
										{rebrickableColors.find(c => c.id === colorFilter)?.name}
									</Text>
								</>
							)}
							<Text bold>
								{' | Part Name | '}
								<Text color="gray">{'[Element ID]'}</Text>
							</Text>
						</Box>
						<Box flexDirection="row" flexShrink={0}>
							{isFocused.partList && (
								<Text color={'gray'}>
									Use {'<'} , . {'>'} to adjust quantities.{' '}
								</Text>
							)}
							<Text bold color={allocatedColor}>
								Allocation
							</Text>
							{sortMode === 'allocated' && (
								<Text color="green">
									{allocatedOrder === 'ASC:count'
										? ' # ↑'
										: allocatedOrder === 'ASC:%'
										? ' % ↑'
										: allocatedOrder === 'DESC:count'
										? ' # ↓'
										: allocatedOrder === 'DESC:%'
										? ' % ↓'
										: ''}
								</Text>
							)}
						</Box>
					</Box>

					<Box
						borderStyle="round"
						borderColor="cyan"
						flexGrow={1}
						minHeight={1}
					>
						<Box flexGrow={1} display={showColorPicker ? 'flex' : 'none'}>
							<ScrollerSelect
								isActive={
									isActive &&
									uiState === 'edit' &&
									isFocused.partList &&
									showColorPicker
								}
								characters={['█', '▒']}
								items={[
									{
										component: <Text>All Colors</Text>,
										value: 'all',
									},
									...availableColors.map(colorId => {
										const color = rebrickableColors.find(c => c.id === colorId);
										const colorPartsUnique = allParts.filter(
											part => part.color_id === colorId,
										);
										const colorPartsCount = colorPartsUnique.reduce(
											(acc, part) => acc + part.quantity_needed,
											0,
										);
										const colorPartsAllocated = colorPartsUnique.reduce(
											(acc, part) => acc + part.quantity_allocated,
											0,
										);
										return {
											component: (
												<Text>
													<Text color={`#${color?.rgb}`}>
														{color?.name} ({color?.id})
													</Text>{' '}
													<Text color="gray">
														{colorPartsAllocated}/{colorPartsCount} parts,{' '}
														{colorPartsUnique.length} unique
													</Text>
												</Text>
											),
											value: colorId,
										};
									}),
								]}
								onChange={value => {
									if (value === 'all') setColorFilter(undefined);
									else setColorFilter(value as number);
									setShowColorPicker(false);
								}}
							/>
						</Box>
						<Box flexGrow={1} display={showColorPicker ? 'none' : 'flex'}>
							<ScrollerSelect
								ref={scrollerRef}
								isActive={
									isActive &&
									uiState === 'edit' &&
									isFocused.partList &&
									!showColorPicker
								}
								characters={['█', '▒']}
								colors={
									isFocused.partList
										? {focused: 'cyan', selected: 'cyan'}
										: {focused: 'gray'}
								}
								items={parts.map((part, i) => {
									const color = rebrickableColors.find(
										c => c.id === part.color_id,
									);
									const partIsFocused = focusedPart === i;
									return {
										component: (
											<Box
												flexDirection="row"
												flexShrink={1}
												flexGrow={1}
												justifyContent="space-between"
											>
												<Box flexDirection="row">
													<Box flexShrink={0}>
														<Text color={partNumColor}>{part.part_num} </Text>
														<Text
															backgroundColor={`#${color?.rgb}`}
															underline={sortMode === 'color'}
														>
															({color?.name})
														</Text>
														<Text> </Text>
													</Box>
													<Text wrap="truncate">{part.name}</Text>
													{part.element_id && (
														<Box flexShrink={0}>
															<Text color="gray"> [{part.element_id}] </Text>
														</Box>
													)}
												</Box>
												<Box flexDirection="row" flexShrink={0}>
													{partIsFocused && part.quantity_allocated > 0 && (
														<>
															<Text color={'gray'}>{'<'}</Text>
															<Text bold>0 </Text>
														</>
													)}
													{partIsFocused && part.quantity_allocated > 0 && (
														<>
															<Text color={'gray'}>,</Text>
															<Text bold>- </Text>
														</>
													)}
													<Text
														color={
															allocatedOrder === 'ASC:count' ||
															allocatedOrder === 'DESC:count'
																? allocatedColor
																: undefined
														}
														bold={partIsFocused}
														backgroundColor={
															partIsFocused
																? isFocused.partList
																	? 'cyan'
																	: 'gray'
																: undefined
														}
													>
														{part.quantity_allocated}
													</Text>
													{partIsFocused &&
														part.quantity_allocated < part.quantity_needed && (
															<>
																<Text bold> +</Text>
																<Text color={'gray'}>.</Text>
															</>
														)}
													<Text>
														{' '}
														/{' '}
														<Text
															bold={
																partIsFocused &&
																part.quantity_allocated < part.quantity_needed
															}
														>
															{part.quantity_needed}
														</Text>
													</Text>
													{partIsFocused &&
														part.quantity_allocated < part.quantity_needed && (
															<Text color={'gray'}>{'>'}</Text>
														)}
													<Text
														color={
															allocatedOrder === 'ASC:%' ||
															allocatedOrder === 'DESC:%'
																? allocatedColor
																: undefined
														}
													>
														{' '}
														(
														{formatPercentage(
															part.quantity_allocated / part.quantity_needed,
														)}
														)
													</Text>
												</Box>
											</Box>
										),
										value: `${part.part_num}:${part.color_id}`,
									};
								})}
								onChange={() => scrollerRef.current?.clearSelection()}
							/>
						</Box>
					</Box>
					<Box
						justifyContent="center"
						alignItems="center"
						flexDirection="column"
					>
						<Box>
							<Text color={'gray'}>Ctrl+o to preview selection. </Text>
							<Text>Sort by: </Text>
							<Text color="gray">{'← '}</Text>
							<Text color={partNumColor} bold={sortMode === 'partNum'}>
								Part Number
							</Text>
							<Text>{' or '}</Text>
							<Text color={colorColor} bold={sortMode === 'color'}>
								Color
							</Text>
							<Text>{' or '}</Text>
							<Text color={allocatedColor} bold={sortMode === 'allocated'}>
								Allocated
							</Text>
							<Text color="gray">{' →'}</Text>
							<Text color="gray"> (Enter to change Sort order)</Text>
						</Box>
						<Box>
							<Text color="gray">
								↑/↓ to scroll. Esc to{' '}
								{exitOnNextEsc ? 'exit Set Edit' : 'reset'}.{' '}
							</Text>
							<Text>Page: </Text>
							<Text color="gray">PgUp </Text>
							<PaginationDisplay current={page.current} total={page.total} />
							<Text color="gray"> PgDn</Text>
							<Text> | Page Size: </Text>
							<Text>{page.size}</Text>
							<Text color="gray"> (Shift+PgUp/PgDn to change)</Text>
						</Box>
						<Box>
							<Text color="gray">
								Use shift+↑/↓ to navigate between fields.
							</Text>
						</Box>
					</Box>
				</Box>
			)}

			{/* Error Status */}
			{status && <Text color="red">{status}</Text>}
		</Box>
	);
}
