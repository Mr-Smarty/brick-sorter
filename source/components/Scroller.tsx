import React, {
	useReducer,
	useRef,
	useEffect,
	useState,
	useLayoutEffect,
} from 'react';
import {Box, Text, useInput, measureElement} from 'ink';

const reducer = (state: any, action: any) => {
	switch (action.type) {
		case 'SET_HEIGHT':
			return {
				...state,
				height: action.height,
			};

		case 'SET_INNER_HEIGHT':
			return {
				...state,
				innerHeight: action.innerHeight,
			};

		case 'SCROLL_DOWN':
			const maxScroll = Math.max(0, state.innerHeight - state.height);
			return {
				...state,
				scrollTop: Math.min(state.scrollTop + 1, maxScroll),
			};

		case 'SCROLL_UP':
			return {
				...state,
				scrollTop: Math.max(state.scrollTop - 1, 0),
			};

		case 'SET_SCROLL_TOP':
			return {
				...state,
				scrollTop: action.scrollTop,
			};

		default:
			return state;
	}
};

export interface Props {
	isActive: boolean;
	children: React.ReactNode;
}
export default function Scroller({
	isActive,
	children,
}: Props): React.JSX.Element {
	const [state, dispatch] = useReducer(reducer, {
		height: 0,
		scrollTop: 0,
		innerHeight: 0,
	});
	const [hasRendered, setHasRendered] = useState(false);

	const wrapperRef = useRef();
	const innerRef = useRef();

	// Track when the tab becomes visible
	useLayoutEffect(() => {
		if (isActive) {
			setHasRendered(true);
		}
	}, [isActive]);

	// Initial layout measurement after content has rendered
	useLayoutEffect(() => {
		if (!isActive) return;

		process.nextTick(() => {
			setTimeout(() => {
				if (wrapperRef.current && innerRef.current) {
					const wrapperBox = measureElement(wrapperRef.current);
					const innerBox = measureElement(innerRef.current);

					dispatch({
						type: 'SET_HEIGHT',
						height: Math.max(0, wrapperBox.height - 2), // subtract for border
					});
					dispatch({
						type: 'SET_INNER_HEIGHT',
						innerHeight: innerBox.height,
					});
				}
			}, 0);
		});
	}, [isActive, children]);

	// Redundant safety measurement after first render completes
	useEffect(() => {
		if (!isActive || !hasRendered) return;

		const timer = setTimeout(() => {
			if (wrapperRef.current && innerRef.current) {
				const wrapperBox = measureElement(wrapperRef.current);
				const innerBox = measureElement(innerRef.current);

				dispatch({
					type: 'SET_HEIGHT',
					height: Math.max(0, wrapperBox.height - 2),
				});
				dispatch({
					type: 'SET_INNER_HEIGHT',
					innerHeight: innerBox.height,
				});
			}
		}, 10);

		return () => clearTimeout(timer);
	}, [hasRendered, isActive, children]);

	useEffect(() => {
		const maxScroll = Math.max(0, state.innerHeight - state.height);
		if (state.scrollTop > maxScroll)
			dispatch({type: 'SET_SCROLL_TOP', scrollTop: maxScroll});
	}, [state.innerHeight, state.height]);

	useInput((_input, key) => {
		if (!isActive) return;

		if (key.downArrow) {
			dispatch({
				type: 'SCROLL_DOWN',
			});
		}

		if (key.upArrow) {
			dispatch({
				type: 'SCROLL_UP',
			});
		}
	});

	return (
		<Box
			// @ts-ignore
			ref={wrapperRef}
			flexDirection="column"
			borderStyle="round"
			borderColor="cyan"
			flexGrow={1}
			width="100%"
			minHeight={1}
		>
			<Box flexDirection="row" flexGrow={1} width="100%">
				{/* Scrollable container */}
				<Box
					height={state.height}
					overflow="hidden"
					flexDirection="column"
					width="100%"
				>
					<Box
						// @ts-ignore
						ref={innerRef}
						flexDirection="column"
						flexShrink={0}
						marginTop={state.innerHeight > state.height ? -state.scrollTop : 0}
					>
						{children}
					</Box>
				</Box>

				{/* Vertical scrollbar */}
				<Box flexShrink={0}>
					<ScrollBar
						containerDim={state.height}
						contentDim={state.innerHeight}
						scrollPos={state.scrollTop}
						direction="vertical"
					/>
				</Box>
			</Box>
		</Box>
	);
}

interface ScrollBarProps {
	containerDim: number;
	contentDim: number;
	scrollPos: number;
	direction: 'vertical' | 'horizontal';
}
export const ScrollBar = ({
	containerDim,
	contentDim,
	scrollPos,
	direction,
}: ScrollBarProps) => {
	const scrollable = contentDim > containerDim;
	const scrollRatio = containerDim / contentDim;
	const thumbDim = scrollable
		? Math.max(1, Math.floor(scrollRatio * containerDim))
		: containerDim;

	const maxThumbPos = containerDim - thumbDim;

	let thumbPos = 0;
	if (scrollable) {
		const relativeScroll = scrollPos / (contentDim - containerDim);
		thumbPos = Math.floor(relativeScroll * maxThumbPos);

		if (scrollPos > 0 && thumbPos === 0 && maxThumbPos > 0) thumbPos = 1;
	}
	return (
		<Box
			flexDirection={direction === 'vertical' ? 'column' : 'row'}
			marginLeft={direction === 'vertical' ? 1 : 0}
			marginTop={direction === 'horizontal' ? 1 : 0}
		>
			{Array.from({length: containerDim}, (_, i) => (
				<Text
					key={i}
					color={i >= thumbPos && i < thumbPos + thumbDim ? 'cyan' : 'gray'}
				>
					{direction === 'vertical' ? '│' : '─'}
				</Text>
			))}
		</Box>
	);
};
