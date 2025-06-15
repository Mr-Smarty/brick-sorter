import React, {
	useState,
	useRef,
	useImperativeHandle,
	forwardRef,
	useEffect,
} from 'react';
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
	isActive: boolean;
}

const FocusableTextInput = forwardRef<
	{focus: () => void},
	FocusableTextInputProps
>(function FocusableTextInput(
	{
		value,
		onChange,
		placeholder,
		focusKey,
		width,
		isActive,
	}: FocusableTextInputProps,
	ref: React.Ref<{focus: () => void}>,
) {
	const {isFocused, focus} = useFocus({id: focusKey, isActive: isActive});
	useImperativeHandle(ref, () => ({focus: () => focus(focusKey)}), [
		focus,
		focusKey,
	]);

	return (
		<Box flexDirection="column" flexGrow={1} width={width}>
			<TextInput
				value={value}
				onChange={onChange}
				placeholder={placeholder}
				focus={isActive && isFocused}
				showCursor={isActive && isFocused}
			/>
		</Box>
	);
});

interface IdEntryProps {
	onAllocationUpdate: (
		allocations: Array<{setId: string; setName: string; allocated: number}>,
		partId: string,
	) => void;
	isActive: boolean;
}

export default function IdEntry({
	onAllocationUpdate,
	isActive,
}: IdEntryProps): JSX.Element {
	const db = useDatabase();
	const [setId, setSetId] = useState('');
	const [priority, setPriority] = useState(fixPriorities(db) + '');
	const [partId, setPartId] = useState('');
	const [quantity, setQuantity] = useState('1');
	const [status, setStatus] = useState('');
	const focusableFields = ['setId', 'partId', 'priority', 'quantity'] as const;
	type focusableFields = (typeof focusableFields)[number];
	const [statusField, setStatusField] = useState<focusableFields | ''>('');
	const [isLoading, setIsLoading] = useState(false);
	const [isColorSelectionActive, setIsColorSelectionActive] = useState(false);
	const [isGuessSelectionActive, setIsGuessSelectionActive] = useState(false);
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

	const {focusNext, focusPrevious, focus, disableFocus, enableFocus} =
		useFocusManager();
	const [lastFocused, setLastFocused] = useState<string | null>('setId');
	const isFocused = {} as Record<focusableFields, boolean>;
	for (const key of focusableFields)
		isFocused[key] = useFocus({id: key, isActive}).isFocused;
	const trueFocus = <T extends string>(
		isFocused: Record<T, boolean>,
	): T | null => Object.entries(isFocused).find(([_, v]) => v)?.[0] as T | null;
	useEffect(() => {
		if (isActive) setLastFocused(() => trueFocus(isFocused));
	}, [...Object.values(isFocused)]);

	const partIdInputRef = useRef<{focus: () => void}>(null);

	const handlePartRecognized = (elementId: string) => {
		setPartId(elementId);
		partIdInputRef.current?.focus();
		focus('partId');
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

	useEffect(() => {
		if (isActive) {
			enableFocus();
			if (lastFocused) focus(lastFocused);
		} else disableFocus();
	}, [isActive]);

	useInput(async (_input, key) => {
		if (!isActive) return;

		if (
			isLoading ||
			isColorSelectionActive ||
			isGuessSelectionActive ||
			elementSelectionData
		)
			return;

		if (key.downArrow) {
			focusNext();
		} else if (key.upArrow) {
			focusPrevious();
		} else if (key.return) {
			if (isFocused.setId || isFocused.priority) {
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
						setStatusField(trueFocus(isFocused) || '');
					} else {
						setStatus('An unknown error occurred');
						setStatusField(trueFocus(isFocused) || '');
					}
				} finally {
					setIsLoading(false);
				}
			} else if (isFocused.partId || isFocused.quantity) {
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
					if (setId) {
						setSetId('');
						setStatus(`Part added to set ${setId} successfully`);
					} else {
						setStatus('Part added successfully');
					}
				} catch (error) {
					if (error instanceof Error) {
						setStatus(error.message);
						setStatusField(trueFocus(isFocused) || '');
					} else {
						setStatus('An unknown error occurred');
						setStatusField(trueFocus(isFocused) || '');
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
				isActive={isActive}
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
						onChange={val => setSetId(val.replace(/\s/g, ''))}
						placeholder="Enter set #"
						focusKey="setId"
						width={12}
						isActive={isActive}
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
						isActive={isActive}
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
						ref={partIdInputRef}
						value={partId}
						onChange={val => setPartId(val.replace(/\s/g, ''))}
						placeholder="Enter part #"
						focusKey="partId"
						width={12}
						isActive={isActive}
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
						isActive={isActive}
					/>
				</Box>
			</Box>

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
				(isFocused.partId || isFocused.quantity) &&
				!isColorSelectionActive && (
					<Box marginTop={1}>
						<Text dimColor>
							Both set and part entered - will add part directly to set {setId}
						</Text>
					</Box>
				)}

			<CameraCapture
				onPartRecognized={handlePartRecognized}
				onColorSelectionChange={setIsColorSelectionActive}
				onGuessSelectionChange={setIsGuessSelectionActive}
				isEnabled={
					!isLoading && !isColorSelectionActive && !isGuessSelectionActive
				}
				isActive={isActive}
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
