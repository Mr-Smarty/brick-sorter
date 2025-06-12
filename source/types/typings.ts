export interface Part {
	id: string;
	name: string;
	quantity: number;
}

export interface Set {
	id: string;
	name: string;
	priority: number;
}

export interface PartColor {
	color_id: number;
	color_name: string;
	num_sets: number;
	num_set_parts: number;
	part_img_url: string;
	elements: string[];
}

export interface PartColorElements {
	part_img_url: string;
	year_from: number;
	year_to: number;
	num_sets: number;
	num_set_parts: number;
	elements: string[];
}
