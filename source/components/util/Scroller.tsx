import React, {
	useReducer,
	useRef,
	useEffect,
	useState,
	useLayoutEffect,
	forwardRef,
	useImperativeHandle,
} from 'react';
import {Box, Text, useInput, measureElement, Key} from 'ink';

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
	characters?: string | [string, string];
	keys?: [keyof Key, keyof Key];
}
export default forwardRef(function Scroller(
	{isActive, children, keys = ['upArrow', 'downArrow'], characters}: Props,
	ref: React.Ref<{setScroll: (pos: number) => void}>,
): React.JSX.Element {
	const [state, dispatch] = useReducer(reducer, {
		height: 0,
		scrollTop: 0,
		innerHeight: 0,
	});
	const [_hasRendered, setHasRendered] = useState(false);

	const wrapperRef = useRef();
	const innerRef = useRef();

	// Expose resetScroll function via ref
	useImperativeHandle(ref, () => ({
		setScroll: (pos: number) => {
			if (pos < 0) pos = 0;
			else if (pos > state.innerHeight - state.height)
				pos = Math.max(0, state.innerHeight - state.height);

			dispatch({type: 'SET_SCROLL_TOP', scrollTop: pos});
		},
	}));

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

	useEffect(() => {
		const maxScroll = Math.max(0, state.innerHeight - state.height);
		if (state.scrollTop > maxScroll)
			dispatch({type: 'SET_SCROLL_TOP', scrollTop: maxScroll});
	}, [state.innerHeight, state.height]);

	useInput((_input, key) => {
		if (!isActive) return;

		if (key[keys[0]]) {
			dispatch({
				type: 'SCROLL_UP',
			});
		}

		if (key[keys[1]]) {
			dispatch({
				type: 'SCROLL_DOWN',
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
						characters={characters}
					/>
				</Box>
			</Box>
		</Box>
	);
});

interface ScrollBarProps {
	containerDim: number;
	contentDim: number;
	scrollPos: number;
	direction: 'vertical' | 'horizontal';
	characters?: string | [string, string];
}
export const ScrollBar = ({
	containerDim,
	contentDim,
	scrollPos,
	direction,
	characters = direction === 'vertical' ? '│' : '─',
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
					{typeof characters === 'string'
						? characters
						: i >= thumbPos && i < thumbPos + thumbDim
						? characters[0]
						: characters[1]}
				</Text>
			))}
		</Box>
	);
};
