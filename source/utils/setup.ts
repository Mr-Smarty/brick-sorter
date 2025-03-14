import {DatabaseSync} from 'node:sqlite';

export function setup(db: DatabaseSync) {
	db.exec(
		`CREATE TABLE IF NOT EXISTS lego_sets (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            priority INTEGER NOT NULL
        );
        
        CREATE TABLE IF NOT EXISTS parts (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            quantity INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS lego_set_parts (
            lego_set_id INTEGER NOT NULL,
            part_id INTEGER NOT NULL,
            quantity_needed INTEGER NOT NULL,
            FOREIGN KEY (lego_set_id) REFERENCES lego_sets(id),
            FOREIGN KEY (part_id) REFERENCES parts(id),
            PRIMARY KEY (lego_set_id, part_id)
        );`,
	);
}

export default setup;
