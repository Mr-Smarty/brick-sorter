export interface Part {
	part_num: string;
	color_id: number;
	name: string;
	quantity: number;
	bricklink_id?: string;
	element_id?: string;
}

export interface Set {
	id: string;
	name: string;
	priority: number;
	completion: number;
}

export interface SetPart extends Part {
	set_id: string;
	quantity_needed: number;
	quantity_allocated: number;
	allocation_percent?: number;
}

export interface PartColor {
	color_id: number;
	color_name: string;
	num_sets: number;
	num_set_parts: number;
	part_img_url: string;
	elements: string[];
}
