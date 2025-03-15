import axios from 'axios';

interface RebrickablePartResponse {
	count: number;
	next: string | null;
	previous: string | null;
	results: RebrickablePart[];
}

interface RebrickablePart {
	id: number;
	inv_part_id: number;
	part: {
		part_num: string;
		name: string;
		part_cat_id: number;
		part_url: string;
		part_img_url: string;
		external_ids: Record<string, string[]>;
		print_of: number | null;
	};
	color: {
		id: number;
		name: string;
		rgb: string;
		is_trans: boolean;
		external_ids: Record<string, {ext_ids: number[]; ext_descrs: string[][]}>;
	};
	set_num: string;
	quantity: number;
	is_spare: boolean;
	element_id: string;
	num_sets: number;
}

/**
 * Fetches all parts for a given LEGO set number from the Rebrickable API
 * @param setNumber The LEGO set number (e.g. "75192-1")
 * @param apiKey Your Rebrickable API key
 * @returns Promise resolving to an array of parts
 */
export async function getSetParts(
	setNumber: string,
	apiKey: string,
): Promise<RebrickablePart[]> {
	if (!apiKey) {
		throw new Error('Rebrickable API key is required');
	}

	const baseUrl = 'https://rebrickable.com/api/v3/lego';
	const allParts: RebrickablePart[] = [];
	let nextUrl: string | null = `${baseUrl}/sets/${setNumber}/parts/?page=1`;

	while (nextUrl) {
		try {
			const response: {data: RebrickablePartResponse} =
				await axios.get<RebrickablePartResponse>(nextUrl, {
					headers: {
						Authorization: `key ${apiKey}`,
						Accept: 'application/json',
					},
				});

			allParts.push(...response.data.results);
			nextUrl = response.data.next;
		} catch (error) {
			if (axios.isAxiosError(error)) {
				if (error.response?.status === 404) {
					throw new Error(`Set ${setNumber} not found`);
				}
				throw new Error(
					`API error: ${error.response?.status} ${error.response?.statusText}`,
				);
			}
			throw error;
		}
	}

	return allParts;
}

interface SetDetails {
	set_num: string;
	name: string;
	year: number;
	theme_id: number;
	num_parts: number;
	set_img_url: string;
	set_url: string;
	last_modified_dt: string;
}

/**
 * Fetches details for a specific LEGO set from the Rebrickable API
 * @param setNumber The LEGO set number (e.g. "75192-1")
 * @param apiKey Your Rebrickable API key
 * @returns Promise resolving to the set name
 */
export async function getSetDetails(
	setNumber: string,
	apiKey: string,
): Promise<SetDetails> {
	if (!apiKey) {
		throw new Error('Rebrickable API key is required');
	}

	const baseUrl = 'https://rebrickable.com/api/v3/lego';

	try {
		const response = await axios.get<SetDetails>(
			`${baseUrl}/sets/${setNumber}/`,
			{
				headers: {
					Authorization: `key ${apiKey}`,
					Accept: 'application/json',
				},
			},
		);

		return response.data;
	} catch (error) {
		if (axios.isAxiosError(error)) {
			if (error.response?.status === 404) {
				throw new Error(`Set ${setNumber} not found`);
			}
			throw new Error(
				`API error: ${error.response?.status} ${error.response?.statusText}`,
			);
		}
		throw error;
	}
}
