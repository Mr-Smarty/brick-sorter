import React, {
	useState,
	useEffect,
	useRef,
	forwardRef,
	useImperativeHandle,
} from 'react';
import {useInput, Box, Text, type Key, BoxProps} from 'ink';
import Scroller, {type ScrollerProps} from './Scroller.js';
import type {KeyInput} from './Scroller.js';

export interface ScrollerSelectItem<ValueType> {
	component: React.ReactElement;
	value: ValueType;
}

export interface ScrollerSelectProps<ValueType>
	extends Omit<ScrollerProps, 'children'> {
	items: ScrollerSelectItem<ValueType>[];
	focusStyle?: 'pointer' | 'background';
	onChange?: (value: ValueType) => void;
	keys?: ScrollerProps['keys'] &
		Partial<{
			select: keyof Key | KeyInput;
		}>;
	pointerChar?: string;
	colors?: Partial<{
		focused: BoxProps['backgroundColor'];
		selected: BoxProps['backgroundColor'];
	}>;
}

export default forwardRef(function ScrollerSelect<ValueType>(
	{
		isActive,
		items,
		onChange,
		characters,
		keys,
		hideScrollBar = false,
		focusStyle = 'pointer',
		pointerChar = '>',
		colors = {focused: 'cyan', selected: 'green'},
	}: ScrollerSelectProps<ValueType>,
	ref: React.Ref<{
		setScroll?: (pos: number) => void;
		clearSelection?: () => void;
	}>,
): React.JSX.Element {
	const [focusedIndex, setFocusedIndex] = useState(0);
	const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
	const scrollRef = useRef<{
		setScroll: (pos: number) => void;
		clearSelection: () => void;
	}>(null);

	const handleResize = () =>
		isActive && scrollRef.current
			? scrollRef.current.setScroll(focusedIndex)
			: null;

	useImperativeHandle(ref, () => ({
		setScroll: (pos: number) => {
			if (scrollRef.current) {
				scrollRef.current.setScroll(pos);
				setFocusedIndex(pos);
			}
		},
		clearSelection: () => setSelectedIndex(null),
	}));

	// Ensure focused item is visible
	useEffect(() => {
		if (scrollRef.current && isActive) {
			scrollRef.current.setScroll(focusedIndex);
		}
	}, [focusedIndex, isActive]);

	useInput((input, key) => {
		if (!isActive) return;

		const up = keys?.up ?? 'upArrow';
		const down = keys?.down ?? 'downArrow';
		const select = keys?.select ?? 'return';

		const oneKey = Object.values(key).filter(v => v).length === 1;
		if (
			(typeof up === 'string' && key[up] && oneKey) ||
			(typeof up === 'function' && up(input, key))
		)
			setFocusedIndex(i => Math.max(0, i - 1));
		if (
			(typeof down === 'string' && key[down] && oneKey) ||
			(typeof down === 'function' && down(input, key))
		)
			setFocusedIndex(i => Math.min(items.length - 1, i + 1));
		if (
			(typeof select === 'string' && key[select]) ||
			(typeof select === 'function' && select(input, key))
		) {
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
					const isFocused = idx === focusedIndex;
					const isSelected = idx === selectedIndex;
					return React.cloneElement(component, {
						...(typeof component.props === 'object' && component.props !== null
							? component.props
							: {}),
						key: String(value),
						backgroundColor: isSelected
							? colors.selected ?? 'green'
							: isFocused
							? colors.focused ?? 'cyan'
							: undefined,
					} as React.ComponentProps<typeof Box>);
				} else {
					return (
						<Box key={String(value)} flexDirection="row">
							<Text
								color={
									idx === selectedIndex
										? colors.selected ?? 'green'
										: colors.focused ?? 'cyan'
								}
							>
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
});
