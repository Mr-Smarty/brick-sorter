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

	const [containerSize, setContainerSize] = useState({height: 0, width: 0});
	const [contentSize, setContentSize] = useState({height: 0, width: 0});
	const [top, setTop] = useState(0);
	const [left, setLeft] = useState(0);

	const measureLayout = () => {
		if (containerRef.current) {
			const container = measureElement(containerRef.current);
			setContainerSize({height: container.height, width: container.width});
		}
		if (contentRef.current) {
			const content = measureElement(contentRef.current);
			setContentSize({height: content.height, width: content.width});
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

	const maxTop = Math.max(0, contentSize.height - containerSize.height + 1);
	const maxLeft = Math.max(0, contentSize.width - containerSize.width);

	useInput((_input, key) => {
		if (!isActive) return;

		if (key.downArrow) setTop(prev => Math.min(prev + 1, maxTop));
		if (key.upArrow) setTop(prev => Math.max(prev - 1, 0));
		if (key.rightArrow) setLeft(prev => Math.min(prev + 1, maxLeft));
		if (key.leftArrow) setLeft(prev => Math.max(prev - 1, 0));
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
						<Box
							marginTop={-top}
							marginLeft={-left}
							flexDirection="column"
							flexShrink={0}
						>
							{/* Actual measured content */}
							<Box
								// @ts-ignore
								ref={contentRef}
								flexDirection="column"
								flexShrink={0}
								width="auto"
								borderTop={false}
								borderLeft={false}
								borderStyle="round"
								borderColor="green"
							>
								{children}
							</Box>
						</Box>
					</Box>
				</Box>

				{/* Vertical scrollbar */}
				<Box flexShrink={0}>
					<ScrollBar
						containerDim={containerSize.height}
						contentDim={contentSize.height}
						scrollPos={top}
						direction="vertical"
					/>
				</Box>
			</Box>

			{/* Horizontal scrollbar */}
			<Box flexShrink={0}>
				<ScrollBar
					containerDim={containerSize.width}
					contentDim={contentSize.width}
					scrollPos={left}
					direction="horizontal"
				/>
			</Box>

			{/* Debug */}
			<Text>
				left:{' '}
				<Text bold color="cyan">
					{left}
				</Text>{' '}
				/ {contentSize.width - containerSize.width}
			</Text>
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
