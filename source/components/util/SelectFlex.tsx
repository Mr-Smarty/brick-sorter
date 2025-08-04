import {Select} from '@inkjs/ui';
import {Box, measureElement} from 'ink';
import React, {useRef, useLayoutEffect, useState} from 'react';

type SelectFlexProps = React.ComponentProps<typeof Select>;

export default function SelectFlex(props: SelectFlexProps): React.JSX.Element {
	const containerRef = useRef(null);
	const [visibleOptionCount, setVisibleOptionCount] = useState(1);

	const updateHeight = () => {
		if (containerRef.current) {
			process.nextTick(() => {
				const {height} = measureElement(containerRef.current!);
				const calculated = Math.max(1, height);
				const safeCount = Math.min(calculated, props.options.length);
				setVisibleOptionCount(safeCount);
			});
		}
	};

	useLayoutEffect(() => {
		updateHeight();
		process.stdout.on('resize', updateHeight);
		return () => {
			process.stdout.off('resize', updateHeight);
		};
	}, [props.options.length]);

	return (
		<Box
			ref={containerRef}
			flexDirection="column"
			flexGrow={1}
			minHeight={1}
			flexShrink={0}
		>
			<Select
				key={visibleOptionCount}
				{...props}
				visibleOptionCount={visibleOptionCount}
			/>
		</Box>
	);
}
