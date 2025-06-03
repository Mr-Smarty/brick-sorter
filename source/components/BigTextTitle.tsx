import React from 'react';
import {Box} from 'ink';
import Gradient, {GradientName} from 'ink-gradient';
import BigText, {BigTextProps} from 'ink-big-text';

interface BigTextFlexProps extends BigTextProps {
	gradient?: GradientName;
}

export default function BigTextFlex({...props}: BigTextFlexProps) {
	const letters = props.text.split('');
	const letterSpacing = props.letterSpacing
		? Math.floor(props.letterSpacing / 2)
		: 0;
	const justifyContent = (() => {
		switch (props.align) {
			case 'left':
				return 'flex-start';
			case 'right':
				return 'flex-end';
			case 'center':
				return 'center';
			default:
				return 'flex-start';
		}
	})();

	return (
		<Box flexDirection="row" justifyContent={justifyContent} flexWrap="wrap">
			{letters.map((letter, index) => (
				<Box key={`${letter}-${index}`} paddingX={letterSpacing}>
					<Gradient name={props.gradient}>
						<BigText
							text={letter === ' ' ? ' ' : letter}
							font={props.font}
							colors={props.colors}
							backgroundColor={props.backgroundColor}
							space={props.space}
							lineHeight={props.lineHeight}
						/>
					</Gradient>
				</Box>
			))}
		</Box>
	);
}
