import React, {useState} from 'react';
import {Text, Box, useInput} from 'ink';
import {Spinner} from '@inkjs/ui';
import open from 'open';
import {captureImage} from '../util/camera.js';
import {recognizePart} from '../util/brickognizeApi.js';
import {getPartColors} from '../util/rebrickableApi.js';
import {useDatabase} from '../context/DatabaseContext.js';
import SelectInput from 'ink-select-input';
import {parsePartNumber} from '../util/addPart.js';
import type {PartColor} from '../types/typings.js';
import type {BrickognizeItem} from '../util/brickognizeApi.js';

import {config} from 'dotenv';
config({path: new URL('../../.env', import.meta.url)});
const CERTAINTY_THRESHOLD = parseFloat(
	process.env['CERTAINTY_THRESHOLD'] || '0.85',
);
const SIMILARITY_THRESHOLD = parseFloat(
	process.env['SIMILARITY_THRESHOLD'] || '0.05',
);

interface CameraCaptureProps {
	onPartRecognized: (
		elementId: string,
		colorId: number,
		setId?: string,
	) => void;
	onColorSelectionChange: (isActive: boolean) => void;
	onGuessSelectionChange: (isActive: boolean) => void;
	isEnabled: boolean;
	isActive: boolean;
}

export default function CameraCapture({
	onPartRecognized,
	onColorSelectionChange,
	onGuessSelectionChange,
	isEnabled,
	isActive,
}: CameraCaptureProps) {
	const db = useDatabase();
	const [isCapturing, setIsCapturing] = useState(false);
	const [isLoadingColors, setIsLoadingColors] = useState(false);
	const [status, setStatus] = useState<{text: string; color: string}>({
		text: '',
		color: 'green',
	});
	const [recognizedPart, setRecognizedPart] = useState<{
		partNumber: string;
		name: string;
		confidence: number;
		setId?: string;
	} | null>(null);
	const [availableColors, setAvailableColors] = useState<PartColor[]>([]);
	const [showColorSelection, setShowColorSelection] = useState(false);
	const [guesses, setGuesses] = useState<BrickognizeItem[]>([]);
	const [showGuessSelection, setShowGuessSelection] = useState(false);
	const [highlightedGuessURL, setHighlightedGuessURL] = useState<string>('');
	const [highlightedElement, setHighlightedElement] = useState<string>('');
	const [highlightedColor, setHighlightedColor] = useState<number | null>(null);

	const setColorSelectionState = (active: boolean) => {
		setShowColorSelection(active);
		onColorSelectionChange(active);
	};

	const setGuessSelectionState = (active: boolean) => {
		setShowGuessSelection(active);
		onGuessSelectionChange(active);
	};

	const loadAndShowColors = async (partNumber: string, setId?: string) => {
		setIsLoadingColors(true);
		setStatus({text: 'Loading available colors...', color: 'white'});
		try {
			const colors = await getPartColors(partNumber);

			let existingColors: PartColor[] = [];
			let set = setId
				? (db
						.prepare('SELECT id FROM lego_sets WHERE id = ? OR id LIKE ?')
						.all(setId, `${setId}-%`) as {id: string}[])
				: [];
			if (set?.length === 1) {
				setRecognizedPart(prev => (prev ? {...prev, setId: set[0]!.id} : null));
				existingColors = colors.filter(color =>
					db
						.prepare(
							`SELECT 1 FROM lego_set_parts sp
					 		 JOIN lego_sets s ON sp.lego_set_id = s.id
							 WHERE sp.part_num = ? AND sp.color_id = ? AND s.id = ?`,
						)
						.get(partNumber, color.color_id, set[0]!.id),
				);
			} else {
				existingColors = colors
					.filter(color =>
						db
							.prepare(
								'SELECT 1 FROM parts WHERE part_num = ? AND color_id = ?',
							)
							.get(partNumber, color.color_id),
					)
					.map(color => {
						const setPriorityRow = db
							.prepare(
								`SELECT s.priority FROM lego_set_parts sp
                     		 	 JOIN lego_sets s ON sp.lego_set_id = s.id
                    		 	 WHERE sp.part_num = ? AND sp.color_id = ?
                     		 	 ORDER BY s.priority ASC LIMIT 1`,
							)
							.get(partNumber, color.color_id) as
							| {priority: number}
							| undefined;

						return {
							...color,
							priority: setPriorityRow
								? setPriorityRow.priority
								: Number.MAX_SAFE_INTEGER,
						};
					})
					.sort((a, b) => a.priority - b.priority);
			}

			if (existingColors.length > 0) {
				setAvailableColors(existingColors);
				setColorSelectionState(true);
				setHighlightedElement(
					existingColors[0]!.elements[0] ||
						existingColors[0]!.part_img_url ||
						'',
				);
				setHighlightedColor(existingColors[0]!.color_id);
				if (setId)
					setStatus({
						text: `Confirm the part color for ${partNumber} from set ${setId}:`,
						color: 'yellow',
					});
				else
					setStatus({
						text: 'Select the part color from the options below:',
						color: 'yellow',
					});
			} else {
				setStatus({
					text: 'No parts found in database - please enter manually',
					color: 'red',
				});
			}
		} catch (colorError) {
			setStatus({
				text: `Failed to load colors: ${
					colorError instanceof Error ? colorError.message : 'Unknown error'
				}`,
				color: 'red',
			});
		} finally {
			setIsLoadingColors(false);
		}
	};

	const handleImageCapture = async () => {
		if (!isEnabled || !isActive || isCapturing) return;

		setIsCapturing(true);
		setStatus({text: 'Capturing image...', color: 'white'});
		setColorSelectionState(false);
		setGuessSelectionState(false);
		setRecognizedPart(null);
		setHighlightedColor(null);
		setHighlightedElement('');
		setHighlightedGuessURL('');

		try {
			const imageBuffer = await captureImage();
			setStatus({text: 'Image captured, recognizing part...', color: 'white'});

			const results = await recognizePart(imageBuffer);

			const searchIds: ((item: BrickognizeItem) => string)[] = [
				item => item.id,
				item => {
					const {base, mold, assemblyConst, assemblyNum} = parsePartNumber(
						item.id,
						false,
					);
					return base + mold + assemblyConst + assemblyNum;
				},
				item => parsePartNumber(item.id).base,
			];
			let existingParts: BrickognizeItem[] = [];
			for (const searchId of searchIds) {
				existingParts = results.items
					.map(item => {
						const id = searchId(item);
						const found = (db
							.prepare('SELECT part_num FROM parts WHERE part_num = ?')
							.get(id) ||
							db
								.prepare(
									`SELECT part_num FROM parts WHERE bricklink_id = ? 
									 OR bricklink_id LIKE ? 
									 OR bricklink_id LIKE ? 
									 OR bricklink_id LIKE ?;`,
								)
								.get(id, `${id}|%`, `%|${id}|%`, `%|${id}`)) as
							| {part_num: string}
							| undefined;

						return found ? {...item, id: found.part_num} : null;
					})
					.filter(Boolean) as BrickognizeItem[];
				if (existingParts.length) break;
				setStatus({text: 'Trying partial part numbers...', color: 'white'});
			}

			const sortedParts = [...existingParts].sort((a, b) => b.score - a.score);

			if (sortedParts.length > 0) {
				const topScore = sortedParts[0]!.score;

				if (topScore >= CERTAINTY_THRESHOLD) {
					const similarParts = sortedParts.filter(
						item => topScore - item.score <= SIMILARITY_THRESHOLD,
					);

					if (similarParts.length > 1) {
						setGuesses(similarParts);
						setHighlightedGuessURL(
							similarParts[0]!.external_sites.find(
								site => site.name === 'BrickLink',
							)?.url ||
								similarParts[0]!.external_sites[0]?.url ||
								'',
						);
						setGuessSelectionState(true);
						setStatus({
							text: 'Multiple similar parts found. Select the correct part:',
							color: 'yellow',
						});
						return;
					} else {
						const match = sortedParts[0]!;
						setRecognizedPart({
							partNumber: match.id,
							name: match.name,
							confidence: match.score,
						});
						setStatus({
							text: `Part recognized: ${match.name} (${Math.round(
								match.score * 100,
							)}% confidence)`,
							color: 'green',
						});

						let {set} = /Set (?<set>\d+(-\d)?)/.exec(match.name)?.groups || {};
						await loadAndShowColors(match.id, set);
						return;
					}
				} else {
					// Top score is below certainty threshold, show top guesses
					setGuesses(sortedParts.slice(0, 5));
					setHighlightedGuessURL(
						sortedParts[0]!.external_sites.find(
							site => site.name === 'BrickLink',
						)?.url ||
							sortedParts[0]!.external_sites[0]?.url ||
							'',
					);
					setGuessSelectionState(true);
					setStatus({
						text: 'Select the correct part from the guesses below:',
						color: 'yellow',
					});
					return;
				}
			} else
				setStatus({
					text: 'No matches found. Please enter manually.',
					color: 'red',
				});
		} catch (error) {
			if (error instanceof Error) {
				setStatus({text: `Camera error: ${error.message}`, color: 'red'});
			} else {
				setStatus({text: 'Camera capture failed', color: 'red'});
			}
		} finally {
			setIsCapturing(false);
		}
	};

	const handleColorSelect = (item: {value: number}) => {
		const selectedColor = availableColors.find(c => c.color_id === item.value);
		const setId = recognizedPart?.setId;
		if (recognizedPart && selectedColor) {
			onPartRecognized(
				recognizedPart.partNumber,
				selectedColor.color_id,
				setId,
			);
			setColorSelectionState(false);
			setHighlightedColor(null);
			setHighlightedElement('');
			setRecognizedPart(null);
			setAvailableColors([]);
			setStatus({
				text: `Part and color ${
					setId ? `from set ${setId} ` : ''
				}selected! (${Math.round(
					recognizedPart.confidence * 100,
				)}% confidence)`,
				color: 'green',
			});
		}
	};

	const handleColorHighlight = (item: {value: number}) => {
		const highlightedColor = availableColors.find(
			c => c.color_id === item.value,
		);
		if (highlightedColor) {
			setHighlightedElement(
				highlightedColor.elements[0] || highlightedColor.part_img_url || '',
			);
			setHighlightedColor(highlightedColor.color_id);
		}
	};

	const handleGuessSelect = async (item: {value: string}) => {
		const guess = guesses.find(g => g.id === item.value);
		if (!guess) return;
		setRecognizedPart({
			partNumber: guess.id,
			name: guess.name,
			confidence: guess.score,
		});
		setGuessSelectionState(false);
		setHighlightedGuessURL('');
		setStatus({
			text: `Selected guess: ${guess.name} (${Math.round(
				guess.score * 100,
			)}% confidence)`,
			color: 'green',
		});

		let {set} = /Set (?<set>\d+(-\d)?)/.exec(guess.name)?.groups || {};
		await loadAndShowColors(guess.id, set);
	};

	const handleGuessHighlight = (item: {value: string}) => {
		const guess = guesses.find(g => g.id === item.value);
		if (guess)
			setHighlightedGuessURL(
				guess.external_sites.find(site => site.name === 'BrickLink')?.url ||
					guess.external_sites[0]?.url ||
					'',
			);
	};

	useInput(async (input, key) => {
		if (!isActive) return;

		if (input === ' ') {
			await handleImageCapture();
		} else if (showColorSelection && key.escape) {
			setColorSelectionState(false);
			setHighlightedColor(null);
			setHighlightedElement('');
			setStatus({text: 'Color selection cancelled', color: 'yellow'});
		} else if (showGuessSelection && key.escape) {
			setGuessSelectionState(false);
			setHighlightedGuessURL('');
			setStatus({text: 'Guess selection cancelled', color: 'yellow'});
		} else if (
			key.ctrl &&
			input === 'o' &&
			(showColorSelection || showGuessSelection)
		) {
			if (highlightedGuessURL) await open(highlightedGuessURL);
			else if (highlightedElement)
				if (highlightedElement.startsWith('http'))
					await open(highlightedElement);
				else
					await open(`https://rebrickable.com/search/?q=${highlightedElement}`);
			else if (highlightedColor !== null)
				await open(
					`https://rebrickable.com/parts/?q=${recognizedPart?.partNumber}&exists_in_color=${highlightedColor}`,
				);
			setStatus({text: 'Opened preview in browser', color: 'green'});
		}
		return;
	});

	return (
		<Box flexDirection="column" marginTop={1}>
			{(isCapturing || isLoadingColors || status) && (
				<Box>
					{isCapturing || isLoadingColors ? (
						<Spinner label={status.text} />
					) : (
						<Text color={status.color}>{status.text}</Text>
					)}
				</Box>
			)}

			{showGuessSelection && guesses.length && (
				<Box
					flexDirection="column"
					borderStyle="round"
					borderColor="blue"
					padding={1}
				>
					<Text bold>Top Part Guesses:</Text>
					<Box height={1} />
					<SelectInput
						items={guesses.map(guess => ({
							label: `${guess.name} (${guess.id}) [${Math.round(
								guess.score * 100,
							)}%]`,
							value: guess.id,
						}))}
						onHighlight={handleGuessHighlight}
						onSelect={handleGuessSelect}
						isFocused={isActive}
					/>
				</Box>
			)}

			{showColorSelection && availableColors.length > 0 && (
				<Box
					flexDirection="column"
					borderStyle="round"
					borderColor="blue"
					padding={1}
				>
					<Text bold>Available Colors for {recognizedPart?.name}:</Text>
					<Box height={1} />
					<SelectInput
						items={availableColors.map(color => ({
							label: `${color.color_name} (ID: ${color.color_id})`,
							value: color.color_id,
						}))}
						onHighlight={handleColorHighlight}
						onSelect={handleColorSelect}
						isFocused={isActive}
					/>
				</Box>
			)}
		</Box>
	);
}
