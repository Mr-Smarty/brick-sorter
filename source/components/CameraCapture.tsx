import React, {useState} from 'react';
import {Text, Box, useInput} from 'ink';
import Spinner from 'ink-spinner';
import {captureImage} from '../utils/camera.js';
import {recognizePart, getBestMatch} from '../utils/brickognizeApi.js';
import {getPartColors} from '../utils/rebrickableApi.js';
import {PartColor} from '../types/typings.js';
import {useDatabase} from '../context/DatabaseContext.js';

interface CameraCaptureProps {
	onPartRecognized: (
		elementId: string,
		partName: string,
		confidence: number,
	) => void;
	onColorSelectionChange: (isActive: boolean) => void;
	isEnabled: boolean;
}

export default function CameraCapture({
	onPartRecognized,
	onColorSelectionChange,
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
	const [selectedColorIndex, setSelectedColorIndex] = useState(0);
	const [showColorSelection, setShowColorSelection] = useState(false);

	const setColorSelectionState = (active: boolean) => {
		setShowColorSelection(active);
		onColorSelectionChange(active);
	};

	const handleImageCapture = async () => {
		if (!isEnabled || isCapturing) return;

		setIsCapturing(true);
		setStatus('Capturing image...');
		setColorSelectionState(false);
		setRecognizedPart(null);

		try {
			const imageBuffer = await captureImage();
			setLastCapture(imageBuffer);
			setStatus('Image captured, recognizing part...');

			const results = await recognizePart(imageBuffer);
			const match = getBestMatch(results); // 70% confidence threshold

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

				setIsLoadingColors(true);
				setStatus('Loading available colors...');

				try {
					const colors = await getPartColors(match.id);

					// Filter colors to only those with existing elements in the database
					const existingColors = colors
						.map(color => {
							const uniquePrioritizedElements = Array.from(
								new Set(
									color.elements.filter(elementId =>
										db
											.prepare('SELECT 1 FROM parts WHERE id = ?')
											.get(elementId),
									),
								),
							)
								// Reorder elements by set priority (lower number = higher priority)
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
					setSelectedColorIndex(0);

					if (existingColors.length > 0) {
						setColorSelectionState(true);
						setStatus('Select color using arrow keys and press Enter');
					} else {
						setStatus('No colors found in database - please enter manually');
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
			} else {
				setStatus('No confident part match found. Please enter manually.');
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

	const handleColorSelect = () => {
		if (recognizedPart && availableColors[selectedColorIndex]) {
			const selectedColor = availableColors[selectedColorIndex];
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

	useInput(async (input, key) => {
		if (input === ' ') {
			await handleImageCapture();
			return;
		}

		if (showColorSelection) {
			if (key.upArrow && selectedColorIndex > 0) {
				setSelectedColorIndex(selectedColorIndex - 1);
			} else if (
				key.downArrow &&
				selectedColorIndex < availableColors.length - 1
			) {
				setSelectedColorIndex(selectedColorIndex + 1);
			} else if (key.return) {
				handleColorSelect();
			} else if (key.escape) {
				setColorSelectionState(false);
				setStatus('Color selection cancelled');
			}
		}
		return;
	});

	return (
		<Box flexDirection="column" marginTop={1}>
			<Box>
				<Text dimColor>
					{showColorSelection
						? 'Select color with arrow keys, Enter to confirm, Esc to cancel'
						: 'Press SPACE to capture image and recognize part'}
				</Text>
			</Box>

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
								status.includes('recognized') || status.includes('selected')
									? 'green'
									: 'yellow'
							}
						>
							{status}
						</Text>
					)}
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
					{availableColors.slice(0, 10).map((color, index) => (
						<Box key={color.color_id}>
							<Text color={index === selectedColorIndex ? 'green' : 'white'}>
								{index === selectedColorIndex ? '> ' : '  '}
								{color.color_name}
								<Text dimColor> ({color.elements.length} elements)</Text>
							</Text>
						</Box>
					))}
					{availableColors.length > 10 && (
						<Text dimColor>
							... and {availableColors.length - 10} more colors
						</Text>
					)}
				</Box>
			)}

			{lastCapture && !showColorSelection && (
				<Box marginTop={1}>
					<Text dimColor>Last capture: {lastCapture.length} bytes</Text>
				</Box>
			)}
		</Box>
	);
}
