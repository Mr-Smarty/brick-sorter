import React, {createContext, useContext} from 'react';
import {DatabaseSync} from 'node:sqlite';

export const DatabaseContext = createContext<DatabaseSync | null>(null);

export const DatabaseProvider = ({
	children,
	db,
}: {
	children: React.ReactNode;
	db: DatabaseSync;
}) => {
	return (
		<DatabaseContext.Provider value={db}>{children}</DatabaseContext.Provider>
	);
};

export const useDatabase = () => {
	const db = useContext(DatabaseContext);
	if (!db)
		throw new Error('useDatabase must be used within a DatabaseProvider');
	return db;
};
