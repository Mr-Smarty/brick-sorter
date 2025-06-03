#!/usr/bin/env node --no-warnings
import React from 'react';
import meow from 'meow';
import App from './app.js';
import {withFullScreen} from 'fullscreen-ink';

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

withFullScreen(<App dbPath={cli.flags.dbPath} />).start();
