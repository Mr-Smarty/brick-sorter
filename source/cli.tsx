#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import App from './app.js';
import setup from './utils/setup.js';
import {DatabaseSync} from 'node:sqlite';

const cli = meow(
	`
	Usage
	  $ brick-sorter-cli

	Options
		--name  Your name

	Examples
	  $ brick-sorter-cli --name=Jane
	  Hello, Jane
`,
	{
		importMeta: import.meta,
		flags: {
			name: {
				type: 'string',
			},
		},
	},
);

const db = new DatabaseSync('bricks.db');
setup(db);

render(<App name={cli.flags.name} />);
