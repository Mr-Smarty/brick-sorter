import React, {useState} from 'react';
import {useDatabase} from '../context/DatabaseContext.js';
import {Box, Text, useInput} from 'ink';
import TextInput from './util/TextInput.js';
import SetSelection from './SetSelection.js';
import type {Set} from '../types/typings.js';

type SetPartListState = 'search' | 'searchSelect' | 'partList' | 'loading';
type SetPartListProps = {
	isActive: boolean;
};

export default function SetPartList({
	isActive,
}: SetPartListProps): React.JSX.Element {
	const db = useDatabase();
	const [uiState, setUiState] = useState<SetPartListState>('search');
	const [searchQuery, setSearchQuery] = useState('');
	const [searchResults, setSearchResults] = useState<Set[]>([]);
	const [selectedSet, setSelectedSet] = useState<Set | null>(null);
	const [status, setStatus] = useState('');

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
			case 'partList':
				if (key.escape) {
					setUiState('search');
					setSearchQuery('');
					setSearchResults([]);
					setSelectedSet(null);
					setStatus('');
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
		setUiState('partList');
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
					<Text>
						Selected Set: <Text color="green">{selectedSet.name}</Text> (ID:{' '}
						{selectedSet.id})
					</Text>
					<Text>Priority: {selectedSet.priority}</Text>
					<Text>Completion: {Math.round(selectedSet.completion * 100)}%</Text>
				</Box>
			)}

			{/* Error Status */}
			{status && <Text color="red">{status}</Text>}
		</Box>
	);
}
