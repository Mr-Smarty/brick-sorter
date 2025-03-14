export interface Part {
	id: number;
	name: string;
	quantity: number;
}

export interface Set {
	id: number;
	parts: Part[];
}
