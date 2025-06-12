import React, {useState, useRef} from 'react';
import {Text, Box, useFocus, useFocusManager, useInput} from 'ink';
import TextInput from 'ink-text-input';
import {useDatabase} from '../context/DatabaseContext.js';
import addSet from '../utils/addSet.js';
import addPart from '../utils/addPart.js';
import fixPriorities from '../utils/fixPriorities.js';
import CameraCapture from './CameraCapture.js';
import Spinner from 'ink-spinner';
import type {InventoryPart} from '@rebrickableapi/types/data/inventory-part';
import {Set} from '@rebrickableapi/types/data/set';
import ElementSelector, {ElementSelectionNeeded} from './ElementSelector.js';

interface FocusableTextInputProps {
	value: string;
	onChange: (value: string) => void;
	placeholder: string;
	focusKey: string;
	width?: number;
}

const FocusableTextInput: React.FC<FocusableTextInputProps> = ({
	value,
	onChange,
	placeholder,
	focusKey,
	width,
}) => {
	const {isFocused} = useFocus({id: focusKey});

	return (
		<Box flexDirection="column" flexGrow={1} width={width}>
			<TextInput
				value={value}
				onChange={onChange}
				placeholder={placeholder}
				focus={isFocused}
				showCursor={isFocused}
			/>
		</Box>
	);
};

interface IdEntryProps {
	onAllocationUpdate: (
		allocations: Array<{setId: string; setName: string; allocated: number}>,
		partId: string,
	) => void;
}

export default function IdEntry({
	onAllocationUpdate,
}: IdEntryProps): JSX.Element {
	const db = useDatabase();
	const [setId, setSetId] = useState('');
	const [priority, setPriority] = useState(fixPriorities(db) + '');
	const [partId, setPartId] = useState('');
	const [quantity, setQuantity] = useState('1');
	const [status, setStatus] = useState('');
	const [statusField, setStatusField] = useState<
		'setId' | 'partId' | 'priority' | 'quantity' | ''
	>('');
	const [isLoading, setIsLoading] = useState(false);
	const [recognitionConfidence, setRecognitionConfidence] = useState(0);
	const [isColorSelectionActive, setIsColorSelectionActive] = useState(false);
	const [elementSelectionData, setElementSelectionData] = useState<{
		part: InventoryPart;
		set: Set;
		timelyElements: string[];
		elements: string[];
	} | null>(null);
	const [resolvedParts, setResolvedParts] = useState<
		Record<string, string | null>
	>({});

	const partsCache = useRef<InventoryPart[]>(undefined);
	const setCache = useRef<Set>(undefined);

	const {focusNext, focusPrevious} = useFocusManager();
	const {isFocused: isSetIdFocused} = useFocus({id: 'setId'});
	const {isFocused: isPriorityFocused} = useFocus({id: 'priority'});
	const {isFocused: isPartIdFocused} = useFocus({id: 'partId'});
	const {isFocused: isQuantityFocused} = useFocus({id: 'quantity'});

	const handlePartRecognized = (
		elementId: string,
		partName: string,
		confidence: number,
	) => {
		setPartId(elementId);
		setRecognitionConfidence(confidence);
		setStatus(`Selected: ${partName}`);
	};

	const handleColorSelectionChange = (isActive: boolean) => {
		setIsColorSelectionActive(isActive);
	};

	const handleElementSelect = async (elementId: string) => {
		if (elementSelectionData) {
			const newResolved = {
				...resolvedParts,
				[elementSelectionData.part.part.part_num]: elementId,
			};
			setResolvedParts(newResolved);
			try {
				setIsLoading(true);
				setStatus('Adding set with selected element...');

				// Update the part's element_id and continue with set addition
				const updatedPart = {
					...elementSelectionData.part,
					element_id: elementId,
				};

				// Continue the addSet process with the selected element
				await addSet(
					db,
					setId,
					Number(priority),
					elementId,
					updatedPart,
					newResolved,
					partsCache,
					setCache,
				);

				setSetId('');
				setResolvedParts({});
				setElementSelectionData(null);
				setPriority(Number(priority) + 1 + '');
				setStatus('Set added successfully');
				fixPriorities(db);
				partsCache.current = undefined;
				setCache.current = undefined;
			} catch (error) {
				if (error instanceof ElementSelectionNeeded) {
					setElementSelectionData({
						part: error.data.part,
						set: error.data.set,
						timelyElements: error.data.timelyElements,
						elements: error.data.elements,
					});
					setIsLoading(false);
					return;
				}
				if (error instanceof Error) {
					setStatus(error.message);
				} else {
					setStatus('An unknown error occurred');
				}
				setElementSelectionData(null);
			} finally {
				setIsLoading(false);
			}
		}
	};

	const handleElementSkip = async () => {
		if (elementSelectionData) {
			const newResolved = {
				...resolvedParts,
				[elementSelectionData.part.part.part_num]: '',
			};
			setResolvedParts(newResolved);
			try {
				setIsLoading(true);
				setStatus('Skipping element and continuing...');
				await addSet(
					db,
					setId,
					Number(priority),
					'SKIP',
					elementSelectionData.part,
					newResolved,
					partsCache,
					setCache,
				);

				setSetId('');
				setResolvedParts({});
				setElementSelectionData(null);
				setPriority(Number(priority) + 1 + '');
				setStatus('Set added successfully (some parts skipped)');
				fixPriorities(db);
				partsCache.current = undefined;
				setCache.current = undefined;
			} catch (error) {
				if (error instanceof ElementSelectionNeeded) {
					setElementSelectionData({
						part: error.data.part,
						set: error.data.set,
						timelyElements: error.data.timelyElements,
						elements: error.data.elements,
					});
					setIsLoading(false);
					return;
				}
				if (error instanceof Error) {
					setStatus(error.message);
				} else {
					setStatus('An unknown error occurred');
				}
				setElementSelectionData(null);
			} finally {
				setIsLoading(false);
			}
		}
	};

	const handleElementCancel = () => {
		setElementSelectionData(null);
		setResolvedParts({});
		setStatus('Set addition cancelled');
		setIsLoading(false);
		partsCache.current = undefined;
		setCache.current = undefined;
	};

	useInput(async (_input, key) => {
		if (isLoading || isColorSelectionActive || elementSelectionData) return;

		if (key.downArrow) {
			focusNext();
		} else if (key.upArrow) {
			focusPrevious();
		} else if (key.return) {
			if (isSetIdFocused || isPriorityFocused) {
				setIsLoading(true);
				setStatus('Processing...');
				setStatusField('setId');

				try {
					await addSet(
						db,
						setId,
						Number(priority),
						undefined,
						undefined,
						resolvedParts,
						partsCache,
						setCache,
					);

					setSetId('');
					setResolvedParts({});
					setPriority(Number(priority) + 1 + '');
					setStatus('Set added successfully');
					fixPriorities(db);
					partsCache.current = undefined;
					setCache.current = undefined;
				} catch (error) {
					if (error instanceof ElementSelectionNeeded) {
						setElementSelectionData({
							part: error.data.part,
							set: error.data.set,
							timelyElements: error.data.timelyElements,
							elements: error.data.elements,
						});
						setIsLoading(false);
						return;
					} else if (error instanceof Error) {
						setStatus(error.message);
						setStatusField(isSetIdFocused ? 'setId' : 'priority');
					} else {
						setStatus('An unknown error occurred');
						setStatusField(isSetIdFocused ? 'setId' : 'priority');
					}
				} finally {
					setIsLoading(false);
				}
			} else if (isPartIdFocused || isQuantityFocused) {
				setIsLoading(true);
				setStatus('Processing...');
				setStatusField('partId');

				try {
					const allocationResult = await addPart(
						db,
						partId,
						Number(quantity),
						setId || undefined,
					);
					onAllocationUpdate(allocationResult, partId);
					setPartId('');
					setQuantity('1');
					setRecognitionConfidence(0);
					if (setId) {
						setSetId('');
						setStatus(`Part added to set ${setId} successfully`);
					} else {
						setStatus('Part added successfully');
					}
				} catch (error) {
					if (error instanceof Error) {
						setStatus(error.message);
						setStatusField(isPartIdFocused ? 'partId' : 'quantity');
					} else {
						setStatus('An unknown error occurred');
						setStatusField(isPartIdFocused ? 'partId' : 'quantity');
					}
				} finally {
					setIsLoading(false);
				}
			}
		}
	});

	if (elementSelectionData) {
		return (
			<ElementSelector
				data={elementSelectionData}
				onSelect={handleElementSelect}
				onSkip={handleElementSkip}
				onCancel={handleElementCancel}
			/>
		);
	}

	return (
		<Box flexDirection="column" flexGrow={1}>
			<Box>
				<Box marginRight={2}>
					<Text>Set Number: </Text>
					<FocusableTextInput
						value={setId}
						onChange={setSetId}
						placeholder="Enter set #"
						focusKey="setId"
						width={12}
					/>
				</Box>

				<Box>
					<Text>Priority: </Text>
					<FocusableTextInput
						value={priority}
						onChange={setPriority}
						placeholder="#"
						focusKey="priority"
						width={5}
					/>
				</Box>
			</Box>

			<Box height={1}>
				{(statusField === 'setId' || statusField === 'priority') && status && (
					<>
						{isLoading ? (
							<Text>
								<Text>
									<Spinner type="dots" />
								</Text>
								{' Loading...'}
							</Text>
						) : (
							status && (
								<Text color={status.includes('successfully') ? 'green' : 'red'}>
									{status}
								</Text>
							)
						)}
					</>
				)}
			</Box>

			<Box height={1} />

			<Box>
				<Box marginRight={2}>
					<Text>Part Number: </Text>
					<FocusableTextInput
						value={partId}
						onChange={setPartId}
						placeholder="Enter part #"
						focusKey="partId"
						width={12}
					/>
				</Box>

				<Box>
					<Text>Quantity: </Text>
					<FocusableTextInput
						value={quantity}
						onChange={setQuantity}
						placeholder="1"
						focusKey="quantity"
						width={5}
					/>
				</Box>
			</Box>

			{recognitionConfidence > 0 && (
				<Box marginTop={1}>
					<Text dimColor>
						Recognition confidence: {Math.round(recognitionConfidence * 100)}%
					</Text>
				</Box>
			)}

			<Box height={1}>
				{(statusField === 'partId' || statusField === 'quantity') && status && (
					<>
						{isLoading ? (
							<Text>
								<Text color="green">
									<Spinner type="dots" />
								</Text>
								{' Loading...'}
							</Text>
						) : (
							status && (
								<Text color={status.includes('successfully') ? 'green' : 'red'}>
									{status}
								</Text>
							)
						)}
					</>
				)}
			</Box>

			{setId &&
				partId &&
				(isPartIdFocused || isQuantityFocused) &&
				!isColorSelectionActive && (
					<Box marginTop={1}>
						<Text dimColor>
							Both set and part entered - will add part directly to set {setId}
						</Text>
					</Box>
				)}

			<CameraCapture
				onPartRecognized={handlePartRecognized}
				onColorSelectionChange={handleColorSelectionChange}
				isEnabled={!isLoading && !isColorSelectionActive}
			/>

			<Box marginTop={1}>
				<Text dimColor>
					{isColorSelectionActive
						? 'Color selection active - other inputs disabled'
						: 'Use arrow keys to navigate • Enter to submit'}
				</Text>
			</Box>
		</Box>
	);
}
