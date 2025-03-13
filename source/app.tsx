import React from 'react';
import {Text} from 'ink';
import Gradient from 'ink-gradient';
import BigText from 'ink-big-text';

type Props = {
	name: string | undefined;
};

export default function App({name = 'Stranger'}: Props) {
	return (
		<>
			<Gradient name="retro">
				<BigText text="BRICK SORTER CLI" align="center" font="block" />
			</Gradient>
			<Text>
				Hello, <Text color="green">{name}</Text>
			</Text>
		</>
	);
}
