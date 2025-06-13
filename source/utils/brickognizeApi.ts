import axios from 'axios';
import FormData from 'form-data';

export interface BrickognizeItem {
	id: string;
	name: string;
	img_url: string;
	external_sites: {name: string; url: string}[];
	category: string;
	type: string;
	score: number;
}

interface BrickognizeResponse {
	listing_id: string;
	bounding_box: {
		left: number;
		upper: number;
		right: number;
		lower: number;
		image_width: number;
		image_height: number;
		score: number;
	};
	items: BrickognizeItem[];
}

/**
 * Recognizes LEGO parts from an image buffer using the Brickognize API
 * @param imageBuffer Image data as a Buffer
 * @returns Promise resolving to recognition results
 */
export async function recognizePart(
	imageBuffer: Buffer,
): Promise<BrickognizeResponse> {
	const formData = new FormData();
	formData.append('query_image', imageBuffer, {
		filename: 'image.jpg',
		contentType: 'image/jpeg',
	});

	try {
		const response = await axios.post<BrickognizeResponse>(
			'https://api.brickognize.com/predict/',
			formData,
			{
				headers: {
					...formData.getHeaders(),
					'User-Agent': 'brick-sorter-cli',
				},
			},
		);

		return response.data;
	} catch (error) {
		if (axios.isAxiosError(error)) {
			throw new Error(
				`Brickognize API error: ${error.response?.status} ${error.response?.statusText}`,
			);
		}
		throw error;
	}
}

/**
 * Gets all predictions above a certain threshold
 * @param results Brickognize API response
 * @param minScore Minimum confidence score (0-1)
 * @returns Array of matches above threshold
 */
export function getAllMatches(
	results: BrickognizeResponse,
	minScore: number = 0,
): Array<BrickognizeItem> {
	if (!results.items || !results.items.length) {
		return [];
	}

	return results.items.filter(item => item.score >= minScore);
}
