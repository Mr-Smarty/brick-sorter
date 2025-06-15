import React, {useEffect} from 'react';
import {useFocus, useFocusManager, useInput} from 'ink';
import {TabContextProvider, useTabActive} from '../context/TabContext.js';

type TabGroupProps = {
	isActive: boolean;
	children:
		| React.ReactElement<TabAwareComponent<any>>
		| React.ReactElement<TabAwareComponent<any>>[];
};

export const TabGroup = ({isActive, children}: TabGroupProps) => {
	const flatChildren = React.Children.toArray(children);

	for (const child of flatChildren) {
		if (
			React.isValidElement(child) &&
			typeof child.type === 'function' &&
			!(child.type as any).__isTabAware
		) {
			throw new Error(
				'TabGroup only accepts children created with makeTabAware()',
			);
		}
	}

	return (
		<TabContextProvider isActive={isActive}>{children}</TabContextProvider>
	);
};

export function useTabAwareFocus(
	id: string,
	isActive: boolean,
	wasLastFocused: boolean,
	onFocusChange: (id: string) => void,
) {
	const {isFocused} = useFocus({id, isActive});
	const {focus} = useFocusManager();

	// Track when this field becomes focused
	useEffect(() => {
		if (isFocused) {
			onFocusChange(id);
		}
	}, [isFocused]);

	// Restore focus on tab reactivation
	useEffect(() => {
		if (isActive && wasLastFocused) {
			focus(id);
		}
	}, [isActive, wasLastFocused]);

	return {isFocused};
}

//#region makeTabAware HOC
export function makeTabAware<P extends {isActive: boolean}>(
	Component: React.ComponentType<P>,
	handleInput: InputHandler,
): TabAwareComponent<Omit<P, 'isActive'>> {
	const Wrapped: React.FC<Omit<P, 'isActive'>> = props => {
		const isActive = useTabActive();

		useInput((input, key) => {
			if (isActive) {
				handleInput(input, key);
			}
		});

		return <Component {...(props as P)} isActive={isActive} />;
	};
	(Wrapped as TabAwareComponent<Omit<P, 'isActive'>>).__isTabAware = true;
	return Wrapped as TabAwareComponent<Omit<P, 'isActive'>>;
}

export type TabAwareComponent<P> = React.FC<P> & {
	__isTabAware: true;
};

type InputHandler = (input: string, key: {[key: string]: boolean}) => void;
//#endregion
