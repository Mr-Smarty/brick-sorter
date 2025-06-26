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
            part_num STRING NOT NULL,
            color_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            bricklink_id STRING,
            element_id STRING,
            PRIMARY KEY (part_num, color_id)
        );

        CREATE TABLE IF NOT EXISTS lego_set_parts (
            lego_set_id STRING NOT NULL,
            part_num STRING NOT NULL,
            color_id INTEGER NOT NULL,
            quantity_needed INTEGER NOT NULL,
            quantity_allocated INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (lego_set_id) REFERENCES lego_sets(id),
            FOREIGN KEY (part_num, color_id) REFERENCES parts(part_num, color_id),
            PRIMARY KEY (lego_set_id, part_num, color_id)
        );`,
	);
}

export default setup;
