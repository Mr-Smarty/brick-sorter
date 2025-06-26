import React, {useState, useRef, useEffect} from 'react';
import {Text, Box, useFocus, useFocusManager, useInput} from 'ink';
import {FocusableTextInput} from './util/FocusableTextInput.js';
import {useDatabase} from '../context/DatabaseContext.js';
import addSet from '../util/addSet.js';
import addPart from '../util/addPart.js';
import fixPriorities from '../util/fixPriorities.js';
import CameraCapture from './CameraCapture.js';
import Spinner from 'ink-spinner';
import {getColorInfo} from '../util/rebrickableApi.js';

interface IdEntryProps {
	onAllocationUpdate: (
		allocations: Array<{setId: string; setName: string; allocated: number}>,
		part: {partNumber: string; colorId: number} | {elementId: string},
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
	const [partNumber, setPartNumber] = useState('');
	const [colorId, setColorId] = useState('');
	const [elementId, setElementId] = useState('');
	const [quantity, setQuantity] = useState('1');
	const [status, setStatus] = useState('');
	const focusableFields = [
		'setId',
		'partNumber',
		'colorId',
		'elementId',
		'priority',
		'quantity',
	] as const;
	type focusableFields = (typeof focusableFields)[number];
	const [statusField, setStatusField] = useState<focusableFields | ''>('');
	const [isLoading, setIsLoading] = useState(false);
	const [isColorSelectionActive, setIsColorSelectionActive] = useState(false);
	const [isGuessSelectionActive, setIsGuessSelectionActive] = useState(false);

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

	const partNumberInputRef = useRef<{focus: () => void}>(null);

	const handlePartRecognized = (partNumber: string, colorId: number) => {
		setPartNumber(partNumber);
		setColorId(`${colorId}`);
		partNumberInputRef.current?.focus();
		focus('partNumber');
	};

	useEffect(() => {
		if (isActive) {
			enableFocus();
			if (lastFocused) focus(lastFocused);
		} else disableFocus();
	}, [isActive]);

	useInput(async (_input, key) => {
		if (!isActive) return;
		if (isLoading || isColorSelectionActive || isGuessSelectionActive) return;

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
					await addSet(db, setId, Number(priority));

					setSetId('');
					setPriority(Number(priority) + 1 + '');
					setStatus('Set added successfully');
					fixPriorities(db);
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
			} else if (
				isFocused.partNumber ||
				isFocused.colorId ||
				isFocused.elementId ||
				isFocused.quantity
			) {
				setIsLoading(true);
				setStatus('Processing...');
				setStatusField('partNumber');

				try {
					let addPartParams;
					let partEntered = partNumber && colorId;
					let elementEntered = Boolean(elementId);
					if (elementEntered && isFocused.elementId)
						addPartParams = {elementId};
					else if (partEntered)
						addPartParams = {partNumber, colorId: Number(colorId)};
					else if (elementEntered) addPartParams = {elementId};
					else
						throw new Error(
							'Please enter either a part number and color ID or an element ID.',
						);

					const allocationResult = await addPart(
						db,
						addPartParams,
						Number(quantity == '' ? 1 : quantity),
						setId || undefined,
					);
					onAllocationUpdate(
						allocationResult,
						partNumber ? {partNumber, colorId: Number(colorId)} : {elementId},
					);
					setPartNumber('');
					setColorId('');
					setElementId('');
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
						type="number"
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

			<Box flexDirection="column">
				<Box>
					<Box marginRight={2}>
						<Text>Part Number: </Text>
						<FocusableTextInput
							ref={partNumberInputRef}
							value={partNumber}
							onChange={val => setPartNumber(val.replace(/\s/g, ''))}
							placeholder="Enter part #"
							focusKey="partNumber"
							width={12}
							isActive={isActive}
						/>
					</Box>

					<Box marginRight={2}>
						<Text>Color ID: </Text>
						<FocusableTextInput
							value={colorId}
							onChange={setColorId}
							placeholder="Enter color ID"
							focusKey="colorId"
							width={colorId?.length ? colorId.length + 2 : 14}
							type="number"
							maxInputLength={4}
							isActive={isActive}
						/>
						{colorId && (
							<Text
								color={`#${getColorInfo(Number(colorId))?.rgb || 'FFFFFF'}`}
							>
								{getColorInfo(Number(colorId))?.name || 'Unknown Color'}
							</Text>
						)}
					</Box>

					<Box>
						<Text>Quantity: </Text>
						<FocusableTextInput
							value={quantity}
							onChange={setQuantity}
							placeholder="1"
							focusKey="quantity"
							width={5}
							type="number"
							isActive={isActive}
						/>
					</Box>
				</Box>
				<Box>
					<Text>Element ID: </Text>
					<FocusableTextInput
						value={elementId}
						onChange={setElementId}
						placeholder="Enter element ID"
						focusKey="elementId"
						width={12}
						type="number"
						isActive={isActive}
					/>
				</Box>
			</Box>

			<Box height={1}>
				{(statusField === 'partNumber' ||
					statusField === 'colorId' ||
					statusField === 'elementId' ||
					statusField === 'quantity') &&
					status && (
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
									<Text
										color={status.includes('successfully') ? 'green' : 'red'}
									>
										{status}
									</Text>
								)
							)}
						</>
					)}
			</Box>

			{setId &&
				((partNumber && colorId) || elementId) &&
				(isFocused.partNumber ||
					isFocused.colorId ||
					isFocused.elementId ||
					isFocused.quantity) &&
				!isColorSelectionActive && (
					<Box marginTop={1}>
						<Text color="gray">
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
				<Text color="gray">
					{isColorSelectionActive
						? 'Color selection active - other inputs disabled'
						: 'Use arrow keys to navigate • Spacebar to capture part • Enter to submit'}
				</Text>
			</Box>
		</Box>
	);
}
