import {DatabaseSync} from 'node:sqlite';

export function setup(db: DatabaseSync) {
	db.exec(
		`CREATE TABLE IF NOT EXISTS lego_sets (
            id STRING PRIMARY KEY,
            name TEXT NOT NULL,
            priority INTEGER NOT NULL,
            completion REAL NOT NULL DEFAULT 0
        );
        
        CREATE TABLE IF NOT EXISTS parts (
            id STRING PRIMARY KEY,
            name TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            part_num STRING,
            color_id INTEGER
        );

        CREATE TABLE IF NOT EXISTS lego_set_parts (
            lego_set_id STRING NOT NULL,
            part_id STRING NOT NULL,
            quantity_needed INTEGER NOT NULL,
            quantity_allocated INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (lego_set_id) REFERENCES lego_sets(id),
            FOREIGN KEY (part_id) REFERENCES parts(id),
            PRIMARY KEY (lego_set_id, part_id)
        );`,
	);
}

export default setup;
