import {config} from 'dotenv';
import {fetchRebrickableAPI, RebrickableAPIError} from '@rebrickableapi/fetch';
import type {InventoryPart} from '@rebrickableapi/types/data/inventory-part';
import type {Set} from '@rebrickableapi/types/data/set';
import type {PartColor, PartColorElements} from '../types/typings.js';
import {DetailedPart} from '@rebrickableapi/types/data/part';

config({path: new URL('../../.env', import.meta.url)});
const REBRICKABLE_API_KEY = process.env['REBRICKABLE_API_KEY'];

/**
 * Fetches all parts for a given LEGO set number from the Rebrickable API
 * @param setNumber The LEGO set number (e.g. "75192-1")
 * @param apiKey Your Rebrickable API key
 * @returns Promise resolving to an array of parts
 */
export async function getSetParts(setNumber: string): Promise<InventoryPart[]> {
	if (!REBRICKABLE_API_KEY) {
		throw new Error('Rebrickable API key is required');
	}

	const allParts: InventoryPart[] = [];
	let nextUrl = `/api/v3/lego/sets/${setNumber}/parts/?page=1` as const;

	while (nextUrl) {
		try {
			const response = await fetchRebrickableAPI(nextUrl, {
				key: REBRICKABLE_API_KEY,
			});
			allParts.push(...response.results);
			nextUrl = response.next as typeof nextUrl;
		} catch (error) {
			throw handleError(error, [
				{status: 404, text: `Set ${setNumber} not found`},
			]);
		}
	}

	return allParts;
}

/**
 * Fetches details for a specific LEGO set from the Rebrickable API
 * @param setNumber The LEGO set number (e.g. "75192-1")
 * @param apiKey Your Rebrickable API key
 * @returns Promise resolving to the set name
 */
export async function getSetDetails(setNumber: string): Promise<Set> {
	if (!REBRICKABLE_API_KEY) {
		throw new Error('REBRICKABLE_API_KEY environment variable is not set');
	}

	const endpoint = `/api/v3/lego/sets/${setNumber}/` as const;

	try {
		const response = await fetchRebrickableAPI(endpoint, {
			key: REBRICKABLE_API_KEY,
		});

		return response;
	} catch (error) {
		throw handleError(error, [
			{status: 404, text: `Set ${setNumber} not found`},
		]);
	}
}

/**
 * Gets all available colors/elements for a given part design ID
 * @param partNum The design ID from Brickognize
 * @returns Promise resolving to array of available elements with colors
 */
export async function getPartColors(partNum: string): Promise<PartColor[]> {
	if (!REBRICKABLE_API_KEY) {
		throw new Error('REBRICKABLE_API_KEY environment variable is not set');
	}

	const endpoint =
		`/api/v3/lego/parts/${partNum}/colors/?page_size=1000` as const;

	try {
		const response = await fetchRebrickableAPI(endpoint, {
			key: REBRICKABLE_API_KEY,
		});

		return response.results as PartColor[];
	} catch (error) {
		throw handleError(error);
	}
}

/**
 * Finds the missing element for a given part and color ID
 * @param partOrPartNum Either an InventoryPart object or a part number string
 * @param color_id The color ID to search for (required if partOrPartNum is a string)
 * @returns Promise resolving to an array of possible element IDs
 */
export async function findMissingElement(
	part: InventoryPart,
): Promise<PartColorElements[]>;
export async function findMissingElement(
	part_num: string,
	color_id: number,
): Promise<PartColorElements[]>;
export async function findMissingElement(
	partOrPartNum: InventoryPart | string,
	color_id?: number,
): Promise<PartColorElements[]> {
	if (!REBRICKABLE_API_KEY) {
		throw new Error('REBRICKABLE_API_KEY environment variable is not set');
	}

	let part_num: string;
	let colorId: number;

	if (typeof partOrPartNum === 'string') {
		part_num = partOrPartNum;
		colorId = color_id!; // color_id must be provided if partOrPartNum is a string
	} else {
		part_num = partOrPartNum.part.part_num;
		colorId = partOrPartNum.color.id;
	}

	const endpoint = `/api/v3/lego/parts/${part_num}/` as const;
	let response: DetailedPart;

	try {
		response = (await fetchRebrickableAPI(endpoint, {
			key: REBRICKABLE_API_KEY,
		})) as DetailedPart;
	} catch (error) {
		throw handleError(error);
	}

	if (!response.molds || !response.molds.length) {
		return [];
	}

	const possibleElements = await Promise.allSettled(
		response.molds?.map(async mold => {
			const elementEndpoint =
				`/api/v3/lego/parts/${mold}/colors/${colorId}/` as const;

			try {
				const elementResponse = (await fetchRebrickableAPI(elementEndpoint, {
					key: REBRICKABLE_API_KEY,
				})) as unknown as PartColorElements;
				return elementResponse;
			} catch (error) {
				return null;
			}
		}),
	);

	const validElements = possibleElements
		.filter(
			(res): res is PromiseFulfilledResult<PartColorElements> =>
				res.status === 'fulfilled' && res.value !== null,
		)
		.map(res => res.value);

	return validElements;
}

function handleError(
	error: unknown,
	customResStatus?: {status: number; text: string}[],
): Error | unknown {
	if (error instanceof RebrickableAPIError) {
		for (const err of customResStatus || []) {
			if (error.response?.status === err.status) {
				return new Error(err.text);
			}
		}
		return new Error(
			`Rebrickable API error: ${error.response?.status} ${error.response?.statusText}`,
		);
	}
	return error;
}
