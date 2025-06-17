// Derived from: https://github.com/gnidan/ink-scroller/

import React, {useRef, useState, useEffect} from 'react';
import {Box, Text, Spacer, useInput, measureElement} from 'ink';

export type UpCommand = {type: 'up'};
export type DownCommand = {type: 'down'};
export type LeftCommand = {type: 'left'};
export type RightCommand = {type: 'right'};

export type Command = UpCommand | DownCommand | LeftCommand | RightCommand;

export type Layout = {
	height: number;
	width: number;
};

export type Position = {
	top: number;
	left: number;
};

export interface HasOnLayout {
	onLayout(options: {height: number; width: number; layout: any}): void;
}

export interface Props {
	height: number;
	width: number;
	size: Layout;
	isActive: boolean;
	children: React.ReactNode;
}

export interface FooterProps extends HasOnLayout {
	bodyPosition: {
		top: number;
		left: number;
	};
	onCommand(options: {command: Command}): void;
	isActive: boolean;
}
const Footer = (props: FooterProps) => {
	const {
		bodyPosition: {top, left},
		onLayout,
		onCommand,
	} = props;

	const ref = useRef();

	useInput((input, key) => {
		if (input === 'j' || key.downArrow) {
			onCommand({
				command: {type: 'down'},
			});
		} else if (input === 'k' || key.upArrow) {
			onCommand({
				command: {type: 'up'},
			});
		} else if (input === 'h' || key.leftArrow) {
			onCommand({
				command: {type: 'left'},
			});
		} else if (input === 'l' || key.rightArrow) {
			onCommand({
				command: {type: 'right'},
			});
		}
	});

	useEffect(() => {
		// @ts-ignore
		onLayout(measureElement(ref.current));
	}, [onLayout]);

	return (
		<Box
			// @ts-ignore
			ref={ref}
			borderStyle="round"
			flexShrink={0}
		>
			<Spacer />
			<Text bold>
				top: <Text color="blue">{top}</Text>
			</Text>
			<Spacer />
			<Text bold>
				left: <Text color="blue">{left}</Text>
			</Text>
		</Box>
	);
};

export default function Scroller({
	height,
	width,
	size,
	isActive,
	children,
}: Props): React.JSX.Element {
	const ref = useRef();

	const [layout, setLayout] = useState<Layout>(size);

	useEffect(() => {
		if (ref.current) {
			// @ts-ignore
			setLayout(measureElement(ref.current));
		}
	}, [size, children]);

	const [footerDimensions, setFooterDimensions] = useState({
		height: 0,
		width: 0,
	});

	const [top, setTop] = useState(0);
	const [left, setLeft] = useState(0);

	const handleCommand = (options: {command: Command}) => {
		const {command} = options;
		switch (command.type) {
			case 'up': {
				setTop(Math.max(0, top - 1));
				break;
			}
			case 'down': {
				setTop(Math.min(layout.height, top + 1));
				break;
			}
			case 'left': {
				setLeft(Math.max(0, left - 1));
				break;
			}
			case 'right': {
				setLeft(Math.min(layout.width, left + 1));
				break;
			}
		}
	};

	return (
		<Box
			height={height}
			width={width}
			flexDirection="column"
			borderStyle="round"
		>
			<Box
				height={layout.height - footerDimensions.height - 2}
				width="100%"
				flexDirection="column"
				overflow="hidden"
			>
				<Box
					// @ts-ignore
					ref={ref}
					flexShrink={0}
					flexDirection="column"
					marginTop={-top}
					marginLeft={-left}
					width="100%"
				>
					{children}
				</Box>
			</Box>
			<Footer
				onLayout={setFooterDimensions}
				onCommand={handleCommand}
				bodyPosition={{top, left}}
				isActive={isActive}
			/>
		</Box>
	);
}
