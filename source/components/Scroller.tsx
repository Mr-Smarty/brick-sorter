// Derived from: https://github.com/gnidan/ink-scroller/

import React, {useRef, useState, useEffect} from 'react';
import {Box, Text, useInput, measureElement} from 'ink';

export interface Props {
	isActive: boolean;
	children: React.ReactNode;
}
export default function Scroller({
	isActive,
	children,
}: Props): React.JSX.Element {
	const containerRef = useRef();
	const contentRef = useRef();

	const [containerHeight, setContainerHeight] = useState(0);
	const [contentHeight, setContentHeight] = useState(0);
	const [top, setTop] = useState(0);

	const measureLayout = () => {
		if (containerRef.current) {
			const container = measureElement(containerRef.current);
			setContainerHeight(container.height);
		}
		if (contentRef.current) {
			const content = measureElement(contentRef.current);
			setContentHeight(content.height);
		}
	};

	useEffect(() => {
		const timer = setTimeout(measureLayout, 0);
		return () => clearTimeout(timer);
	}, [children]);

	useEffect(() => {
		process.stdout.on('resize', measureLayout);
		return () => {
			process.stdout.off('resize', measureLayout);
		};
	}, []);

	const maxTop = Math.max(0, contentHeight - containerHeight + 1);

	useInput((_input, key) => {
		if (!isActive) return;

		if (key.downArrow) setTop(prev => Math.min(prev + 1, maxTop));
		if (key.upArrow) setTop(prev => Math.max(prev - 1, 0));
	});

	return (
		<Box
			flexDirection="column"
			borderStyle="round"
			borderColor="cyan"
			flexGrow={1}
			width="100%"
		>
			<Box flexDirection="row" flexGrow={1}>
				{/* Scrollable container */}
				<Box
					// @ts-ignore
					ref={containerRef}
					overflow="hidden"
					flexDirection="column"
					flexGrow={1}
				>
					<Box overflow="hidden" flexGrow={1} flexDirection="column">
						<Box marginTop={-top} flexDirection="column" flexShrink={0}>
							{/* Actual measured content */}
							<Box
								// @ts-ignore
								ref={contentRef}
								flexDirection="column"
								flexShrink={0}
								width="auto"
							>
								{children}
							</Box>
						</Box>
					</Box>
				</Box>

				{/* Vertical scrollbar */}
				<Box flexShrink={0}>
					<ScrollBar
						containerDim={containerHeight}
						contentDim={contentHeight}
						scrollPos={top}
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
	const scrollRatio = contentDim > 0 ? containerDim / contentDim : 1;
	const thumbDim = Math.max(1, Math.floor(scrollRatio * containerDim));
	const thumbPos = Math.min(
		containerDim - thumbDim,
		Math.floor(scrollPos * scrollRatio),
	);

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
