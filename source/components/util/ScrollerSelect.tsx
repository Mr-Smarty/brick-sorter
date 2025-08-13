import React, {useState, useEffect, useRef} from 'react';
import {useInput, Box, Text, type BoxProps} from 'ink';
import Scroller, {type ScrollerProps} from './Scroller.js';

export interface ScrollerSelectItem<ValueType> {
	component: React.ReactElement;
	value: ValueType;
}
export interface ScrollerSelectPointerProps<ValueType>
	extends Omit<ScrollerProps, 'children'> {
	items: ScrollerSelectItem<ValueType>[];
	focusStyle?: 'pointer';
}
export interface ScrollerSelectBackgroundProps<ValueType>
	extends Omit<ScrollerProps, 'children'> {
	items: ScrollerSelectItem<ValueType>[];
	focusStyle: 'background';
	backgroundColor?: BoxProps['backgroundColor'];
}
export type ScrollerSelectProps<ValueType> = (
	| ScrollerSelectPointerProps<ValueType>
	| ScrollerSelectBackgroundProps<ValueType>
) & {
	onChange?: (value: ValueType) => void;
	pointerChar?: string;
};

export default function ScrollerSelect<ValueType>({
	isActive,
	items,
	onChange,
	characters,
	keys = ['upArrow', 'downArrow'],
	hideScrollBar = false,
	focusStyle = 'pointer',
	pointerChar = '>',
}: ScrollerSelectProps<ValueType>): React.JSX.Element {
	const [focusedIndex, setFocusedIndex] = useState(0);
	const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
	const scrollRef = useRef<{
		setScroll: (pos: number) => void;
	}>(null);

	const handleResize = () =>
		isActive && scrollRef.current
			? scrollRef.current.setScroll(focusedIndex)
			: null;

	// Ensure focused item is visible
	useEffect(() => {
		if (scrollRef.current && isActive) {
			scrollRef.current.setScroll(focusedIndex);
		}
	}, [focusedIndex, isActive]);

	useInput((_, key) => {
		if (!isActive) return;
		if (key.upArrow) setFocusedIndex(i => Math.max(0, i - 1));
		if (key.downArrow) setFocusedIndex(i => Math.min(items.length - 1, i + 1));
		if (key.return) {
			setSelectedIndex(focusedIndex);
			if (items[focusedIndex]) {
				onChange?.(items[focusedIndex].value);
			}
		}
	});

	return (
		<Scroller
			isActive={isActive}
			characters={characters}
			keys={keys}
			hideScrollBar={hideScrollBar}
			onResize={handleResize}
			ref={scrollRef}
		>
			{items.map(({component, value}, idx) => {
				if (focusStyle === 'background') {
					if (
						!React.isValidElement(component) ||
						(component.type as any).displayName !== 'Box'
					) {
						throw new Error(
							'All items must be <Box> elements when using focusStyle="background".',
						);
					}
					return React.cloneElement(component, {
						...(typeof component.props === 'object' && component.props !== null
							? component.props
							: {}),
						key: String(value),
						...(idx === focusedIndex ? {backgroundColor: 'cyan'} : {}),
						...(idx === selectedIndex ? {color: 'green'} : {}),
					});
				} else {
					return (
						<Box key={String(value)} flexDirection="row">
							<Text color={idx === selectedIndex ? 'green' : undefined}>
								{idx === focusedIndex ? pointerChar + ' ' : '  '}
							</Text>
							{React.isValidElement(component)
								? component
								: React.createElement(component as React.ElementType)}
						</Box>
					);
				}
			})}
		</Scroller>
	);
}
