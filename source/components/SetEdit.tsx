import React, {useEffect, useState} from 'react';
import {useDatabase} from '../context/DatabaseContext.js';
import {Box, Text, useFocus, useFocusManager, useInput} from 'ink';
import TextInput from './util/TextInput.js';
import {UncontrolledFocusableTextInput} from './util/FocusableTextInput.js';
import SetSelection from './SetSelection.js';
import Gradient from 'ink-gradient';
import ProgressBar from './util/ProgressBar.js';
import {formatPercentage} from '../util/formatPercentage.js';
import type {Set} from '../types/typings.js';

type SetEditState = 'search' | 'searchSelect' | 'edit' | 'loading';
type SetEditProps = {
	isActive: boolean;
};

export default function SetEdit({isActive}: SetEditProps): React.JSX.Element {
	const db = useDatabase();
	const [uiState, setUiState] = useState<SetEditState>('search');
	const [searchQuery, setSearchQuery] = useState('');
	const [searchResults, setSearchResults] = useState<Set[]>([]);
	const [selectedSet, setSelectedSet] = useState<Set | null>(null);
	const [status, setStatus] = useState('');

	const focusableFields = ['priority', 'completion', 'partList'] as const;
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
		} else disableFocus();
	}, [isActive, uiState]);

	useInput((_input, key) => {
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
					setUiState('search');
					setSearchQuery('');
					setSearchResults([]);
					setSelectedSet(null);
					setStatus('');
				} else if (key.downArrow) {
					focusNext();
				} else if (key.upArrow) {
					focusPrevious();
				}
				break;
		}
	});

	const handleSearch = (query: string) => {
		if (!query.trim()) return;

		setUiState('loading');
		setStatus('');

		// Search for sets by number or name
		const results = db
			.prepare(
				`SELECT id, name, priority, completion
                 FROM lego_sets
                 WHERE id LIKE ? OR name LIKE ?
                 ORDER BY priority ASC, completion DESC`,
			)
			.all(`%${query}%`, `%${query}%`) as Set[];
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
		setSearchResults([]);
		setUiState('edit');
		setStatus('');
	};

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

			{uiState === 'searchSelect' && searchResults.length > 0 && (
				<Box flexDirection="column" flexGrow={1}>
					<SetSelection
						sets={searchResults}
						onSetSelect={handleSetSelect}
						onCancel={() => {
							setUiState('search');
							setStatus('');
						}}
						isActive={isActive && uiState === 'searchSelect'}
					/>
					<Text color="gray">
						Use arrow keys to navigate • Enter to confirm
					</Text>
				</Box>
			)}

			{/* Selected Set */}
			{selectedSet && (
				<Box flexDirection="column">
					<Box
						flexDirection="row"
						flexShrink={0}
						width="100%"
						justifyContent="space-between"
					>
						<Box flexDirection="row">
							<Text wrap="truncate" bold>
								{selectedSet.name}
							</Text>
							<Box flexShrink={0} flexDirection="row">
								<Text>
									{' '}
									<Text color="gray">(ID: {selectedSet.id})</Text> Priority:
								</Text>
								<UncontrolledFocusableTextInput
									placeholder={`${selectedSet.priority}`}
									initialValue={selectedSet.priority}
									type="number"
									onSubmit={value => {
										setSelectedSet(prev =>
											prev && value ? {...prev, priority: value} : null,
										);
									}}
									focusKey="priority"
									isActive={isActive && uiState === 'edit'}
								/>
							</Box>
						</Box>
						<Box flexDirection="row" flexShrink={0}>
							<Text>|</Text>
							<Gradient name="retro">
								<ProgressBar
									percent={selectedSet.completion}
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
									color={selectedSet.completion === 1 ? 'green' : undefined}
								>
									{formatPercentage(selectedSet.completion)}
								</Text>
							</Box>
							<Text> </Text>
						</Box>
					</Box>
				</Box>
			)}

			{/* Error Status */}
			{status && <Text color="red">{status}</Text>}
		</Box>
	);
}
