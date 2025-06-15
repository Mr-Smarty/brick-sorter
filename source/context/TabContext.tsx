import React, {createContext, useContext} from 'react';

const TabContext = createContext<boolean | undefined>(undefined);

export const useTabActive = (): boolean => {
	const context = useContext(TabContext);
	if (context === undefined) {
		throw new Error('Tab-aware component must be used within <TabGroup>.');
	}
	return context;
};

export const TabContextProvider = ({
	isActive,
	children,
}: {
	isActive: boolean;
	children: React.ReactNode;
}) => <TabContext.Provider value={isActive}>{children}</TabContext.Provider>;
