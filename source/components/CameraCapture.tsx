import React, {useState} from 'react';
import {Text, Box, useInput} from 'ink';
import Spinner from 'ink-spinner';
import {captureImage} from '../utils/camera.js';
import {recognizePart, getBestMatch} from '../utils/brickognizeApi.js';
import {getPartColors} from '../utils/rebrickableApi.js';
import {PartColor} from '../types/typings.js';
import {useDatabase} from '../context/DatabaseContext.js';
import SelectInput from 'ink-select-input';
import type {BrickognizeItem} from '../utils/brickognizeApi.js';

interface CameraCaptureProps {
	onPartRecognized: (
		elementId: string,
		partName: string,
		confidence: number,
	) => void;
	onColorSelectionChange: (isActive: boolean) => void;
	onGuessSelectionChange: (isActive: boolean) => void;
	isEnabled: boolean;
}

export default function CameraCapture({
	onPartRecognized,
	onColorSelectionChange,
	onGuessSelectionChange,
	isEnabled,
}: CameraCaptureProps) {
	const db = useDatabase();
	const [isCapturing, setIsCapturing] = useState(false);
	const [isLoadingColors, setIsLoadingColors] = useState(false);
	const [status, setStatus] = useState('');
	const [lastCapture, setLastCapture] = useState<Buffer | null>(null);
	const [recognizedPart, setRecognizedPart] = useState<{
		partNumber: string;
		name: string;
		confidence: number;
	} | null>(null);
	const [availableColors, setAvailableColors] = useState<PartColor[]>([]);
	const [showColorSelection, setShowColorSelection] = useState(false);
	const [guesses, setGuesses] = useState<BrickognizeItem[]>([]);
	const [showGuessSelection, setShowGuessSelection] = useState(false);

	const setColorSelectionState = (active: boolean) => {
		setShowColorSelection(active);
		onColorSelectionChange(active);
	};

	const setGuessSelectionState = (active: boolean) => {
		setShowGuessSelection(active);
		onGuessSelectionChange(active);
	};

	const loadAndShowColors = async (partId: string) => {
		setIsLoadingColors(true);
		setStatus('Loading available colors...');
		try {
			const colors = await getPartColors(partId);

			const existingColors = colors
				.map(color => {
					const uniquePrioritizedElements = Array.from(
						new Set(
							color.elements.filter(elementId =>
								db.prepare('SELECT 1 FROM parts WHERE id = ?').get(elementId),
							),
						),
					)
						.map(elementId => {
							const setPriorityRow = db
								.prepare(
									`SELECT s.priority FROM lego_set_parts sp
                                JOIN lego_sets s ON sp.lego_set_id = s.id
                                WHERE sp.part_id = ?
                                ORDER BY s.priority ASC LIMIT 1`,
								)
								.get(elementId) as {priority: number} | undefined;
							return {
								elementId,
								priority: setPriorityRow
									? setPriorityRow.priority
									: Number.MAX_SAFE_INTEGER,
							};
						})
						.sort((a, b) => a.priority - b.priority)
						.map(e => e.elementId);

					return {
						...color,
						elements: uniquePrioritizedElements,
					};
				})
				.filter(color => color.elements.length > 0);

			setAvailableColors(existingColors);

			if (existingColors.length > 0) {
				setColorSelectionState(true);
				setStatus('Select the part color from the options below:');
			} else {
				setStatus('No parts found in database - please enter manually');
			}
		} catch (colorError) {
			setStatus(
				`Failed to load colors: ${
					colorError instanceof Error ? colorError.message : 'Unknown error'
				}`,
			);
		} finally {
			setIsLoadingColors(false);
		}
	};

	const handleImageCapture = async () => {
		if (!isEnabled || isCapturing) return;

		setIsCapturing(true);
		setStatus('Capturing image...');
		setColorSelectionState(false);
		setGuessSelectionState(false);
		setRecognizedPart(null);

		try {
			const imageBuffer = await captureImage();
			setLastCapture(imageBuffer);
			setStatus('Image captured, recognizing part...');

			const results = await recognizePart(imageBuffer);

			const existingParts = results.items.filter(item =>
				db.prepare('SELECT 1 FROM parts WHERE part_num = ?').get(item.id),
			);

			const match = getBestMatch(existingParts);

			if (match) {
				setRecognizedPart({
					partNumber: match.id,
					name: match.name,
					confidence: match.score,
				});
				setStatus(
					`Part recognized: ${match.name} (${Math.round(
						match.score * 100,
					)}% confidence)`,
				);

				await loadAndShowColors(match.id);
			} else {
				const topGuesses = results.items.slice(0, 5); // Show top 5 guesses
				if (topGuesses.length) {
					setGuesses(topGuesses);
					setGuessSelectionState(true);
					setStatus('Select the correct part from the guesses below:');
				} else {
					setStatus('No matches found. Please enter manually.');
				}
			}
		} catch (error) {
			if (error instanceof Error) {
				setStatus(`Camera error: ${error.message}`);
			} else {
				setStatus('Camera capture failed');
			}
		} finally {
			setIsCapturing(false);
		}
	};

	const handleColorSelect = (item: {value: number}) => {
		const selectedColor = availableColors.find(c => c.color_id === item.value);
		if (recognizedPart && selectedColor) {
			onPartRecognized(
				selectedColor.elements[0]!,
				`${recognizedPart.name} (${selectedColor.color_name})`,
				recognizedPart.confidence,
			);
			setColorSelectionState(false);
			setRecognizedPart(null);
			setAvailableColors([]);
			setStatus('Part and color selected!');
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
		setStatus(
			`Selected guess: ${guess.name} (${Math.round(
				guess.score * 100,
			)}% confidence)`,
		);
		await loadAndShowColors(guess.id);
	};

	useInput(async (input, key) => {
		if (input === ' ') {
			await handleImageCapture();
		} else if (showColorSelection && key.escape) {
			setColorSelectionState(false);
			setStatus('Color selection cancelled');
		} else if (showGuessSelection && key.escape) {
			setGuessSelectionState(false);
			setStatus('Guess selection cancelled');
		}
		return;
	});

	return (
		<Box flexDirection="column" marginTop={1}>
			{(isCapturing || isLoadingColors || status) && (
				<Box marginTop={1}>
					{isCapturing || isLoadingColors ? (
						<Text>
							<Text color="green">
								<Spinner type="dots" />
							</Text>
							{isCapturing ? ' Capturing...' : ' Loading colors...'}
						</Text>
					) : (
						<Text
							color={
								status.includes('recognized') ||
								status.includes('selected') ||
								status.includes('Select the right part')
									? 'green'
									: 'yellow'
							}
						>
							{status}
						</Text>
					)}
				</Box>
			)}

			{showGuessSelection && guesses.length && (
				<Box
					flexDirection="column"
					marginTop={1}
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
						onSelect={handleGuessSelect}
					/>
				</Box>
			)}

			{showColorSelection && availableColors.length > 0 && (
				<Box
					flexDirection="column"
					marginTop={1}
					borderStyle="round"
					borderColor="blue"
					padding={1}
				>
					<Text bold>Available Colors for {recognizedPart?.name}:</Text>
					<Box height={1} />
					<SelectInput
						items={availableColors.map(color => ({
							label: `${color.color_name} (${color.elements.length} elements)`,
							value: color.color_id,
						}))}
						onSelect={handleColorSelect}
					/>
				</Box>
			)}

			{lastCapture && !showColorSelection && !showGuessSelection && (
				<Box marginTop={1}>
					<Text dimColor>Last capture: {lastCapture.length} bytes</Text>
				</Box>
			)}
		</Box>
	);
}
