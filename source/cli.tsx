#!/usr/bin/env node --no-warnings
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import App from './app.js';

const cli = meow(
	`
	Usage
	  $ brick-sorter-cli

	Options
		--dbPath  Optional path to SQLite database file

	Examples
	  $ brick-sorter-cli --dbPath="C:/Users/JohnDoe/documents/bricks.db"
`,
	{
		importMeta: import.meta,
		flags: {
			dbPath: {
				type: 'string',
			},
		},
	},
);

render(<App dbPath={cli.flags.dbPath} />);
