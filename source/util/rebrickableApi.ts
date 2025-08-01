import {config} from 'dotenv';
import {fetchRebrickableAPI, RebrickableAPIError} from '@rebrickableapi/fetch';
import type {InventoryPart} from '@rebrickableapi/types/data/inventory-part';
import type {Element} from '@rebrickableapi/types/data/element';
import type {Set} from '@rebrickableapi/types/data/set';
import type {PartColor} from '../types/typings.js';

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

export type SetNumber = `${number}` | `${number}-${number}`;
export function isValidSetNumber(setNumber: string): setNumber is SetNumber {
	return /^\d+(-\d+)?$/.test(setNumber);
}
/**
 * Fetches details for a specific LEGO set from the Rebrickable API
 * @param setNumber The LEGO set number (e.g. "75192-1")
 * @param apiKey Your Rebrickable API key
 * @returns Promise resolving to the set name
 */
export async function getSetDetails<T extends SetNumber>(
	setNumber: T,
): Promise<T extends `${number}` ? Set[] : Set> {
	if (!REBRICKABLE_API_KEY) {
		throw new Error('REBRICKABLE_API_KEY environment variable is not set');
	}

	try {
		if (/^\d+-\d+$/.test(setNumber)) {
			const endpoint = `/api/v3/lego/sets/${setNumber as string}/` as const;
			const response = await fetchRebrickableAPI(endpoint, {
				key: REBRICKABLE_API_KEY,
			});
			return response as T extends `${number}` ? never : Set;
		} else {
			const endpoint = `/api/v3/lego/sets/?search=${
				setNumber as string
			}` as `/api/v3/lego/sets/`;
			const response = await fetchRebrickableAPI(endpoint, {
				key: REBRICKABLE_API_KEY,
			});
			const results = response.results.filter(
				set =>
					set.set_num === setNumber || set.set_num.startsWith(`${setNumber}-`),
			);
			if (results.length === 0) {
				throw new RebrickableAPIError('', {
					status: 404,
				} as Response);
			}
			return results as T extends `${number}` ? Set[] : never;
		}
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

export async function getElementDetails(elementId: string): Promise<Element> {
	if (!REBRICKABLE_API_KEY) {
		throw new Error('REBRICKABLE_API_KEY environment variable is not set');
	}

	const endpoint = `/api/v3/lego/elements/${elementId}/` as const;

	try {
		const response = await fetchRebrickableAPI(endpoint, {
			key: REBRICKABLE_API_KEY,
		});
		return response;
	} catch (error) {
		throw handleError(error, [
			{status: 404, text: `Element ${elementId} not found`},
		]);
	}
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

export function getColorInfo(colorId: number): RebrickableColor | undefined {
	return rebrickableColors.find(color => color.id === colorId);
}
type external_id = {
	ext_ids: number[];
	ext_descrs: string[][];
};
export interface RebrickableColor {
	id: number;
	name: string;
	rgb: string;
	is_trans: boolean;
	external_ids: {
		BrickLink?: external_id;
		BrickOwl?: external_id;
		LEGO?: external_id;
		Peeron?: {
			ext_ids: (number | null)[];
			ext_descrs: string[][];
		};
		LDraw?: external_id;
	};
}
export const rebrickableColors: RebrickableColor[] = [
	{
		id: -1,
		name: '[Unknown]',
		rgb: '0033B2',
		is_trans: false,
		external_ids: {
			BrickOwl: {
				ext_ids: [
					0, 28, 29, 30, 31, 32, 33, 34, 60, 135, 136, 137, 138, 139, 140, 141,
					142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 156,
					157, 160, 162, 163, 169,
				],
				ext_descrs: [
					['Not Applicable'],
					['Modulex Medium Stone Gray'],
					['Modulex Charcoal Gray'],
					['Modulex Orange'],
					['Modulex Ochre Yellow'],
					['Modulex Olive Green'],
					['Modulex Pastel Green'],
					['Modulex Tile Blue'],
					['Fabuland Orange'],
					['Modulex Aqua Green'],
					['Modulex Black'],
					['Modulex Brown'],
					['Modulex Buff'],
					['Modulex Clear'],
					['Modulex Lemon'],
					['Modulex Light Gray'],
					['Modulex Light Orange'],
					['Modulex Light Yellow'],
					['Modulex Medium Blue'],
					['Modulex Pastel Blue'],
					['Modulex Pink'],
					['Modulex Pink Red'],
					['Modulex Red'],
					['Modulex Teal Blue'],
					['Modulex Terracotta'],
					['Modulex Tile Brown'],
					['Modulex Tile Gray'],
					['Modulex Violet'],
					['Modulex White'],
					['Warm Yellowish Orange'],
					['Medium Yellowish Orange'],
					['Dark Nougat'],
					['Transparent Fire Yellow'],
					['Transparent Light Royal Blue'],
					['Curry'],
				],
			},
			LEGO: {
				ext_ids: [125, 158],
				ext_descrs: [['Light Orange'], ['Tr. Flu. Red']],
			},
			Peeron: {
				ext_ids: [
					null,
					null,
					null,
					null,
					null,
					null,
					null,
					null,
					null,
					null,
					null,
					null,
					null,
					null,
					null,
				],
				ext_descrs: [
					['blackgoldglitter'],
					['curry'],
					['dknougat'],
					['ffred'],
					['ffyellow'],
					['fabulime'],
					['fabuorange'],
					['metalliccopper'],
					['metallicwhite'],
					['neonblue'],
					['pearlgreen'],
					['pearlescentpink'],
					['redpink'],
					['trltgreen'],
					['trsalmon'],
				],
			},
			LDraw: {
				ext_ids: [
					16, 24, 65, 66, 67, 273, 324, 375, 406, 449, 490, 493, 494, 495, 496,
					504, 511,
				],
				ext_descrs: [
					['Main_Colour'],
					['Edge_Colour'],
					['Rubber_Yellow'],
					['Rubber_Trans_Yellow'],
					['Rubber_Trans_Clear'],
					['Rubber_Blue'],
					['Rubber_Red'],
					['Rubber_Light_Gray'],
					['Rubber_Dark_Blue'],
					['Rubber_Purple'],
					['Rubber_Lime'],
					['Magnet'],
					['Electric_Contact_Alloy'],
					['Electric_Contact_Copper'],
					['Rubber_Light_Bluish_Gray'],
					['Rubber_Flat_Silver'],
					['Rubber_White'],
				],
			},
		},
	},
	{
		id: 0,
		name: 'Black',
		rgb: '05131D',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [11],
				ext_descrs: [['Black']],
			},
			BrickOwl: {
				ext_ids: [38],
				ext_descrs: [['Black']],
			},
			LEGO: {
				ext_ids: [26, 342],
				ext_descrs: [['Black', 'BLACK'], ['CONDUCT. BLACK']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['black']],
			},
			LDraw: {
				ext_ids: [0, 256],
				ext_descrs: [['Black'], ['Rubber_Black']],
			},
		},
	},
	{
		id: 1,
		name: 'Blue',
		rgb: '0055BF',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [7],
				ext_descrs: [['Blue']],
			},
			BrickOwl: {
				ext_ids: [39],
				ext_descrs: [['Blue']],
			},
			LEGO: {
				ext_ids: [23],
				ext_descrs: [['Bright Blue', 'BR.BLUE']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['blue']],
			},
			LDraw: {
				ext_ids: [1],
				ext_descrs: [['Blue']],
			},
		},
	},
	{
		id: 2,
		name: 'Green',
		rgb: '237841',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [6],
				ext_descrs: [['Green']],
			},
			BrickOwl: {
				ext_ids: [61],
				ext_descrs: [['Green']],
			},
			LEGO: {
				ext_ids: [28],
				ext_descrs: [['Dark green', 'DK.GREEN']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['green']],
			},
			LDraw: {
				ext_ids: [2],
				ext_descrs: [['Green']],
			},
		},
	},
	{
		id: 3,
		name: 'Dark Turquoise',
		rgb: '008F9B',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [39],
				ext_descrs: [['Dark Turquoise']],
			},
			BrickOwl: {
				ext_ids: [58],
				ext_descrs: [['Dark Turquoise']],
			},
			LEGO: {
				ext_ids: [107],
				ext_descrs: [['Bright bluish green', 'BR.BLUEGREEN']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['teal']],
			},
			LDraw: {
				ext_ids: [3],
				ext_descrs: [['Dark_Turquoise']],
			},
		},
	},
	{
		id: 4,
		name: 'Red',
		rgb: 'C91A09',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [5],
				ext_descrs: [['Red']],
			},
			BrickOwl: {
				ext_ids: [81],
				ext_descrs: [['Red']],
			},
			LEGO: {
				ext_ids: [21],
				ext_descrs: [['Bright red', 'BR.RED']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['red']],
			},
			LDraw: {
				ext_ids: [4],
				ext_descrs: [['Red']],
			},
		},
	},
	{
		id: 5,
		name: 'Dark Pink',
		rgb: 'C870A0',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [47],
				ext_descrs: [['Dark Pink']],
			},
			BrickOwl: {
				ext_ids: [17],
				ext_descrs: [['Dark Pink']],
			},
			LEGO: {
				ext_ids: [221],
				ext_descrs: [['Bright Purple', 'BR. PURPLE']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['dkpink']],
			},
			LDraw: {
				ext_ids: [5],
				ext_descrs: [['Dark_Pink']],
			},
		},
	},
	{
		id: 6,
		name: 'Brown',
		rgb: '583927',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [8],
				ext_descrs: [['Brown']],
			},
			BrickOwl: {
				ext_ids: [46],
				ext_descrs: [['Brown']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['oldbrown']],
			},
			LDraw: {
				ext_ids: [6],
				ext_descrs: [['Brown']],
			},
			LEGO: {
				ext_ids: [25],
				ext_descrs: [['Earth Orange', 'EARTH-ORA']],
			},
		},
	},
	{
		id: 7,
		name: 'Light Gray',
		rgb: '9BA19D',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [9],
				ext_descrs: [['Light Gray']],
			},
			BrickOwl: {
				ext_ids: [66],
				ext_descrs: [['Light Gray']],
			},
			LEGO: {
				ext_ids: [2],
				ext_descrs: [['Grey']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['oldgray']],
			},
			LDraw: {
				ext_ids: [7],
				ext_descrs: [['Light_Gray']],
			},
		},
	},
	{
		id: 8,
		name: 'Dark Gray',
		rgb: '6D6E5C',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [10],
				ext_descrs: [['Dark Gray']],
			},
			BrickOwl: {
				ext_ids: [53],
				ext_descrs: [['Dark Gray']],
			},
			LEGO: {
				ext_ids: [27],
				ext_descrs: [['Dark grey', 'DK.GREY']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['olddkgray']],
			},
			LDraw: {
				ext_ids: [8],
				ext_descrs: [['Dark_Gray']],
			},
		},
	},
	{
		id: 9,
		name: 'Light Blue',
		rgb: 'B4D2E3',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [62],
				ext_descrs: [['Light Blue']],
			},
			BrickOwl: {
				ext_ids: [63],
				ext_descrs: [['Light Blue']],
			},
			LEGO: {
				ext_ids: [45],
				ext_descrs: [['Light blue']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['ltblue']],
			},
			LDraw: {
				ext_ids: [9],
				ext_descrs: [['Light_Blue']],
			},
		},
	},
	{
		id: 10,
		name: 'Bright Green',
		rgb: '4B9F4A',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [36],
				ext_descrs: [['Bright Green']],
			},
			BrickOwl: {
				ext_ids: [41],
				ext_descrs: [['Bright Green']],
			},
			LEGO: {
				ext_ids: [37],
				ext_descrs: [['Bright Green', 'BR.GREEN']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['btgreen']],
			},
			LDraw: {
				ext_ids: [10],
				ext_descrs: [['Bright_Green']],
			},
		},
	},
	{
		id: 11,
		name: 'Light Turquoise',
		rgb: '55A5AF',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [40],
				ext_descrs: [['Light Turquoise']],
			},
			BrickOwl: {
				ext_ids: [12],
				ext_descrs: [['Light Turquoise']],
			},
			LEGO: {
				ext_ids: [116],
				ext_descrs: [['Med. bluish green', 'MD.BL-GREEN']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['ltteal']],
			},
			LDraw: {
				ext_ids: [11],
				ext_descrs: [['Light_Turquoise']],
			},
		},
	},
	{
		id: 12,
		name: 'Salmon',
		rgb: 'F2705E',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [25],
				ext_descrs: [['Salmon']],
			},
			BrickOwl: {
				ext_ids: [84],
				ext_descrs: [['Salmon']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['salmon']],
			},
			LDraw: {
				ext_ids: [12],
				ext_descrs: [['Salmon']],
			},
			LEGO: {
				ext_ids: [101],
				ext_descrs: [['Medium Red']],
			},
		},
	},
	{
		id: 13,
		name: 'Pink',
		rgb: 'FC97AC',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [23],
				ext_descrs: [['Pink']],
			},
			BrickOwl: {
				ext_ids: [3],
				ext_descrs: [['Pink']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['pink']],
			},
			LDraw: {
				ext_ids: [13],
				ext_descrs: [['Pink']],
			},
			LEGO: {
				ext_ids: [9],
				ext_descrs: [['L.REDVIOL']],
			},
		},
	},
	{
		id: 14,
		name: 'Yellow',
		rgb: 'F2CD37',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [3],
				ext_descrs: [['Yellow']],
			},
			BrickOwl: {
				ext_ids: [93],
				ext_descrs: [['Yellow']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['yellow']],
			},
			LDraw: {
				ext_ids: [14],
				ext_descrs: [['Yellow']],
			},
			LEGO: {
				ext_ids: [24],
				ext_descrs: [['Bright yellow', 'BR.YEL', 'BRIGHT YELLOW, VERSION 2']],
			},
		},
	},
	{
		id: 15,
		name: 'White',
		rgb: 'FFFFFF',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [1],
				ext_descrs: [['White']],
			},
			BrickOwl: {
				ext_ids: [92],
				ext_descrs: [['White']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['white']],
			},
			LDraw: {
				ext_ids: [15],
				ext_descrs: [['White']],
			},
			LEGO: {
				ext_ids: [1],
				ext_descrs: [['White', 'WHITE V.3']],
			},
		},
	},
	{
		id: 17,
		name: 'Light Green',
		rgb: 'C2DAB8',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [38],
				ext_descrs: [['Light Green']],
			},
			BrickOwl: {
				ext_ids: [11],
				ext_descrs: [['Light Green']],
			},
			LEGO: {
				ext_ids: [6],
				ext_descrs: [['Light green', 'L.GREEN']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['ltgreen']],
			},
			LDraw: {
				ext_ids: [17],
				ext_descrs: [['Light_Green']],
			},
		},
	},
	{
		id: 18,
		name: 'Light Yellow',
		rgb: 'FBE696',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [33],
				ext_descrs: [['Light Yellow']],
			},
			BrickOwl: {
				ext_ids: [9],
				ext_descrs: [['Light Yellow']],
			},
			LEGO: {
				ext_ids: [3],
				ext_descrs: [['Light yellow']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['ltyellow']],
			},
			LDraw: {
				ext_ids: [18],
				ext_descrs: [['Light_Yellow']],
			},
		},
	},
	{
		id: 19,
		name: 'Tan',
		rgb: 'E4CD9E',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [2],
				ext_descrs: [['Tan']],
			},
			BrickOwl: {
				ext_ids: [89],
				ext_descrs: [['Tan']],
			},
			LEGO: {
				ext_ids: [5],
				ext_descrs: [['Brick yellow', 'BRICK-YEL']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['tan']],
			},
			LDraw: {
				ext_ids: [19],
				ext_descrs: [['Tan']],
			},
		},
	},
	{
		id: 20,
		name: 'Light Violet',
		rgb: 'C9CAE2',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [44],
				ext_descrs: [['Light Violet']],
			},
			BrickOwl: {
				ext_ids: [16],
				ext_descrs: [['Light Violet']],
			},
			LEGO: {
				ext_ids: [39],
				ext_descrs: [['Light bluish violet', 'L.BLUEVIOL']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['ltviolet']],
			},
			LDraw: {
				ext_ids: [20],
				ext_descrs: [['Light_Violet']],
			},
		},
	},
	{
		id: 21,
		name: 'Glow In Dark Opaque',
		rgb: 'D4D5C9',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [46],
				ext_descrs: [['Glow In Dark Opaque']],
			},
			BrickOwl: {
				ext_ids: [127],
				ext_descrs: [['Glow in the Dark Opaque']],
			},
			LEGO: {
				ext_ids: [50],
				ext_descrs: [['Phosp. White', 'PHOS.WHITE']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['glowinthedark']],
			},
			LDraw: {
				ext_ids: [21],
				ext_descrs: [['Glow_In_Dark_Opaque']],
			},
		},
	},
	{
		id: 22,
		name: 'Purple',
		rgb: '81007B',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [24],
				ext_descrs: [['Purple']],
			},
			BrickOwl: {
				ext_ids: [4],
				ext_descrs: [['Purple']],
			},
			LEGO: {
				ext_ids: [104],
				ext_descrs: [['Bright violet', 'BR. VIOLET']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['purple']],
			},
			LDraw: {
				ext_ids: [22],
				ext_descrs: [['Purple']],
			},
		},
	},
	{
		id: 23,
		name: 'Dark Blue-Violet',
		rgb: '2032B0',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [109],
				ext_descrs: [['Dark Blue-Violet']],
			},
			BrickOwl: {
				ext_ids: [49],
				ext_descrs: [['Dark Royal Blue']],
			},
			LEGO: {
				ext_ids: [196],
				ext_descrs: [['Dark Royal blue', 'DK. R.BLUE']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['dkroyalblue']],
			},
			LDraw: {
				ext_ids: [23],
				ext_descrs: [['Dark_Blue_Violet']],
			},
		},
	},
	{
		id: 25,
		name: 'Orange',
		rgb: 'FE8A18',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [4],
				ext_descrs: [['Orange']],
			},
			BrickOwl: {
				ext_ids: [80],
				ext_descrs: [['Orange']],
			},
			LEGO: {
				ext_ids: [106],
				ext_descrs: [['Bright orange', 'BR.ORANGE']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['orange']],
			},
			LDraw: {
				ext_ids: [25],
				ext_descrs: [['Orange']],
			},
		},
	},
	{
		id: 26,
		name: 'Magenta',
		rgb: '923978',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [71],
				ext_descrs: [['Magenta']],
			},
			BrickOwl: {
				ext_ids: [72],
				ext_descrs: [['Magenta']],
			},
			LEGO: {
				ext_ids: [124],
				ext_descrs: [['Bright reddish violet', 'BR.RED-VIOL.']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['magenta']],
			},
			LDraw: {
				ext_ids: [26],
				ext_descrs: [['Magenta']],
			},
		},
	},
	{
		id: 27,
		name: 'Lime',
		rgb: 'BBE90B',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [34],
				ext_descrs: [['Lime']],
			},
			BrickOwl: {
				ext_ids: [70],
				ext_descrs: [['Lime']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['lime']],
			},
			LDraw: {
				ext_ids: [27],
				ext_descrs: [['Lime']],
			},
			LEGO: {
				ext_ids: [119],
				ext_descrs: [
					['Br. yellowish green', 'BR.YEL-GREEN', 'BRIGHT YELLOWISH GREEN'],
				],
			},
		},
	},
	{
		id: 28,
		name: 'Dark Tan',
		rgb: '958A73',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [69],
				ext_descrs: [['Dark Tan']],
			},
			BrickOwl: {
				ext_ids: [57],
				ext_descrs: [['Dark Tan']],
			},
			LEGO: {
				ext_ids: [138],
				ext_descrs: [['Sand yellow']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['dktan']],
			},
			LDraw: {
				ext_ids: [28],
				ext_descrs: [['Dark_Tan']],
			},
		},
	},
	{
		id: 29,
		name: 'Bright Pink',
		rgb: 'E4ADC8',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [104],
				ext_descrs: [['Bright Pink']],
			},
			BrickOwl: {
				ext_ids: [45],
				ext_descrs: [['Bright Pink']],
			},
			LEGO: {
				ext_ids: [222],
				ext_descrs: [['Light Purple', 'LGH. PURPLE']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['btpink']],
			},
			LDraw: {
				ext_ids: [29],
				ext_descrs: [['Bright_Pink']],
			},
		},
	},
	{
		id: 30,
		name: 'Medium Lavender',
		rgb: 'AC78BA',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [157],
				ext_descrs: [['Medium Lavender']],
			},
			BrickOwl: {
				ext_ids: [76],
				ext_descrs: [['Medium Lavender']],
			},
			LEGO: {
				ext_ids: [324],
				ext_descrs: [['Medium Lavender', 'MEDIUM LAVENDEL']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['mdlavender']],
			},
			LDraw: {
				ext_ids: [30],
				ext_descrs: [['Medium_Lavender']],
			},
		},
	},
	{
		id: 31,
		name: 'Lavender',
		rgb: 'E1D5ED',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [154],
				ext_descrs: [['Lavender']],
			},
			BrickOwl: {
				ext_ids: [36],
				ext_descrs: [['Lavender']],
			},
			LEGO: {
				ext_ids: [325],
				ext_descrs: [['Lavender']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['lavender']],
			},
			LDraw: {
				ext_ids: [31],
				ext_descrs: [['Lavender']],
			},
		},
	},
	{
		id: 32,
		name: 'Trans-Black IR Lens',
		rgb: '635F52',
		is_trans: true,
		external_ids: {
			LEGO: {
				ext_ids: [109, 355],
				ext_descrs: [['Black IR'], ['Tr.Black IR']],
			},
			LDraw: {
				ext_ids: [32],
				ext_descrs: [['Trans_Black_IR_Lens']],
			},
		},
	},
	{
		id: 33,
		name: 'Trans-Dark Blue',
		rgb: '0020A0',
		is_trans: true,
		external_ids: {
			BrickLink: {
				ext_ids: [14],
				ext_descrs: [['Trans-Dark Blue']],
			},
			BrickOwl: {
				ext_ids: [98],
				ext_descrs: [['Transparent Dark Blue']],
			},
			LEGO: {
				ext_ids: [43],
				ext_descrs: [['Tr. Blue', 'TR.BLUE']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['trblue']],
			},
			LDraw: {
				ext_ids: [33],
				ext_descrs: [['Trans_Dark_Blue']],
			},
		},
	},
	{
		id: 34,
		name: 'Trans-Green',
		rgb: '84B68D',
		is_trans: true,
		external_ids: {
			BrickLink: {
				ext_ids: [20],
				ext_descrs: [['Trans-Green']],
			},
			BrickOwl: {
				ext_ids: [100],
				ext_descrs: [['Transparent Green']],
			},
			LEGO: {
				ext_ids: [48],
				ext_descrs: [['Tr. Green', 'TR.GREEN']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['trgreen']],
			},
			LDraw: {
				ext_ids: [34],
				ext_descrs: [['Trans_Green']],
			},
		},
	},
	{
		id: 35,
		name: 'Trans-Bright Green',
		rgb: 'D9E4A7',
		is_trans: true,
		external_ids: {
			BrickLink: {
				ext_ids: [108],
				ext_descrs: [['Trans-Bright Green']],
			},
			BrickOwl: {
				ext_ids: [96],
				ext_descrs: [['Transparent Bright Green']],
			},
			LEGO: {
				ext_ids: [311],
				ext_descrs: [['Transparent Bright Green', 'TR. BR. GREEN']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['trbtgreen']],
			},
			LDraw: {
				ext_ids: [35],
				ext_descrs: [['Trans_Bright_Green']],
			},
		},
	},
	{
		id: 36,
		name: 'Trans-Red',
		rgb: 'C91A09',
		is_trans: true,
		external_ids: {
			BrickLink: {
				ext_ids: [17],
				ext_descrs: [['Trans-Red']],
			},
			BrickOwl: {
				ext_ids: [108],
				ext_descrs: [['Transparent Red']],
			},
			LEGO: {
				ext_ids: [41],
				ext_descrs: [['Tr. Red', 'TR.RED']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['trred']],
			},
			LDraw: {
				ext_ids: [36],
				ext_descrs: [['Trans_Red']],
			},
		},
	},
	{
		id: 40,
		name: 'Trans-Brown',
		rgb: '635F52',
		is_trans: true,
		external_ids: {
			BrickLink: {
				ext_ids: [13],
				ext_descrs: [['Trans-Black']],
			},
			BrickOwl: {
				ext_ids: [95],
				ext_descrs: [['Transparent Black']],
			},
			LEGO: {
				ext_ids: [111],
				ext_descrs: [['Tr. Brown', 'TR.BROWN']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['smoke']],
			},
			LDraw: {
				ext_ids: [40],
				ext_descrs: [['Trans_Black']],
			},
		},
	},
	{
		id: 41,
		name: 'Trans-Light Blue',
		rgb: 'AEEFEC',
		is_trans: true,
		external_ids: {
			BrickLink: {
				ext_ids: [15],
				ext_descrs: [['Trans-Light Blue']],
			},
			BrickOwl: {
				ext_ids: [101],
				ext_descrs: [['Transparent Light Blue']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['trltblue']],
			},
			LDraw: {
				ext_ids: [43],
				ext_descrs: [['Trans_Medium_Blue']],
			},
			LEGO: {
				ext_ids: [42],
				ext_descrs: [['Tr. Lg blue', 'TR.L.BLUE', 'TR. LIGHT BLUE']],
			},
		},
	},
	{
		id: 42,
		name: 'Trans-Neon Green',
		rgb: 'F8F184',
		is_trans: true,
		external_ids: {
			BrickLink: {
				ext_ids: [16],
				ext_descrs: [['Trans-Neon Green']],
			},
			BrickOwl: {
				ext_ids: [103],
				ext_descrs: [['Transparent Neon Green']],
			},
			LEGO: {
				ext_ids: [49],
				ext_descrs: [['Tr. Flu. Green', 'TR.FL.GREEN']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['trneongreen']],
			},
			LDraw: {
				ext_ids: [42],
				ext_descrs: [['Trans_Neon_Green']],
			},
		},
	},
	{
		id: 43,
		name: 'Trans-Very Lt Blue',
		rgb: 'C1DFF0',
		is_trans: true,
		external_ids: {
			BrickLink: {
				ext_ids: [113],
				ext_descrs: [['Trans-Aqua']],
			},
			BrickOwl: {
				ext_ids: [25],
				ext_descrs: [['Transparent Very Light Blue']],
			},
			LEGO: {
				ext_ids: [229],
				ext_descrs: [['Transparent Light Bluish Green', 'TR. LGH. BL. GR']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['triceblue']],
			},
			LDraw: {
				ext_ids: [39],
				ext_descrs: [['Trans_Very_Light_Blue']],
			},
		},
	},
	{
		id: 45,
		name: 'Trans-Dark Pink',
		rgb: 'DF6695',
		is_trans: true,
		external_ids: {
			BrickLink: {
				ext_ids: [50],
				ext_descrs: [['Trans-Dark Pink']],
			},
			BrickOwl: {
				ext_ids: [99],
				ext_descrs: [['Transparent Dark Pink']],
			},
			LEGO: {
				ext_ids: [113],
				ext_descrs: [['Tr. Medi. reddish violet', 'TR.ML.R.VIOL']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['trpink']],
			},
			LDraw: {
				ext_ids: [37],
				ext_descrs: [['Trans_Dark_Pink']],
			},
		},
	},
	{
		id: 46,
		name: 'Trans-Yellow',
		rgb: 'F5CD2F',
		is_trans: true,
		external_ids: {
			BrickLink: {
				ext_ids: [19],
				ext_descrs: [['Trans-Yellow']],
			},
			BrickOwl: {
				ext_ids: [109],
				ext_descrs: [['Transparent Yellow']],
			},
			LEGO: {
				ext_ids: [44],
				ext_descrs: [['Tr. Yellow', 'TR.YEL']],
			},
			Peeron: {
				ext_ids: [null, null],
				ext_descrs: [['tryellow'], ['trltyellow']],
			},
			LDraw: {
				ext_ids: [46],
				ext_descrs: [['Trans_Yellow']],
			},
		},
	},
	{
		id: 47,
		name: 'Trans-Clear',
		rgb: 'FCFCFC',
		is_trans: true,
		external_ids: {
			BrickLink: {
				ext_ids: [12],
				ext_descrs: [['Trans-Clear']],
			},
			BrickOwl: {
				ext_ids: [97],
				ext_descrs: [['Transparent']],
			},
			LEGO: {
				ext_ids: [40],
				ext_descrs: [['Transparent', 'TR.']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['clear']],
			},
			LDraw: {
				ext_ids: [47],
				ext_descrs: [['Trans_Clear']],
			},
		},
	},
	{
		id: 52,
		name: 'Trans-Purple',
		rgb: 'A5A5CB',
		is_trans: true,
		external_ids: {
			BrickLink: {
				ext_ids: [51],
				ext_descrs: [['Trans-Purple']],
			},
			BrickOwl: {
				ext_ids: [107],
				ext_descrs: [['Transparent Purple']],
			},
			LEGO: {
				ext_ids: [126],
				ext_descrs: [['Tr. Bright bluish violet', 'TR.KL.BL.VIO']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['trpurple']],
			},
			LDraw: {
				ext_ids: [52],
				ext_descrs: [['Trans_Purple']],
			},
		},
	},
	{
		id: 54,
		name: 'Trans-Neon Yellow',
		rgb: 'DAB000',
		is_trans: true,
		external_ids: {
			BrickLink: {
				ext_ids: [121],
				ext_descrs: [['Trans-Neon Yellow']],
			},
			BrickOwl: {
				ext_ids: [104],
				ext_descrs: [['Transparent Neon Yellow']],
			},
			LEGO: {
				ext_ids: [157],
				ext_descrs: [['Transparent Fluorescent Yellow']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['trpeach']],
			},
			LDraw: {
				ext_ids: [54],
				ext_descrs: [['Trans_Neon_Yellow']],
			},
		},
	},
	{
		id: 57,
		name: 'Trans-Neon Orange',
		rgb: 'FF800D',
		is_trans: true,
		external_ids: {
			BrickLink: {
				ext_ids: [18],
				ext_descrs: [['Trans-Neon Orange']],
			},
			BrickOwl: {
				ext_ids: [161],
				ext_descrs: [['Transparent Neon Reddish Orange']],
			},
			LEGO: {
				ext_ids: [47],
				ext_descrs: [['Tr. Flu. Reddish orange', 'TR.FL.REDORA']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['trneonorange']],
			},
			LDraw: {
				ext_ids: [38],
				ext_descrs: [['Trans_Neon_Orange']],
			},
		},
	},
	{
		id: 60,
		name: 'Chrome Antique Brass',
		rgb: '645A4C',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [57],
				ext_descrs: [['Chrome Antique Brass']],
			},
			BrickOwl: {
				ext_ids: [110],
				ext_descrs: [['Chrome Brass']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['chromebrass']],
			},
			LDraw: {
				ext_ids: [60],
				ext_descrs: [['Chrome_Antique_Brass']],
			},
		},
	},
	{
		id: 61,
		name: 'Chrome Blue',
		rgb: '6C96BF',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [52],
				ext_descrs: [['Chrome Blue']],
			},
			BrickOwl: {
				ext_ids: [112],
				ext_descrs: [['Chrome Blue']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['chromeblue']],
			},
			LDraw: {
				ext_ids: [61],
				ext_descrs: [['Chrome_Blue']],
			},
		},
	},
	{
		id: 62,
		name: 'Chrome Green',
		rgb: '3CB371',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [64],
				ext_descrs: [['Chrome Green']],
			},
			BrickOwl: {
				ext_ids: [113],
				ext_descrs: [['Chrome Green']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['chromegreen']],
			},
			LDraw: {
				ext_ids: [62],
				ext_descrs: [['Chrome_Green']],
			},
		},
	},
	{
		id: 63,
		name: 'Chrome Pink',
		rgb: 'AA4D8E',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [82],
				ext_descrs: [['Chrome Pink']],
			},
			BrickOwl: {
				ext_ids: [114],
				ext_descrs: [['Chrome Pink']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['chromepink']],
			},
			LDraw: {
				ext_ids: [63],
				ext_descrs: [['Chrome_Pink']],
			},
		},
	},
	{
		id: 64,
		name: 'Chrome Black',
		rgb: '1B2A34',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [122],
				ext_descrs: [['Chrome Black']],
			},
			BrickOwl: {
				ext_ids: [111],
				ext_descrs: [['Chrome Black']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['chromeblack']],
			},
			LDraw: {
				ext_ids: [64],
				ext_descrs: [['Chrome_Black']],
			},
		},
	},
	{
		id: 68,
		name: 'Very Light Orange',
		rgb: 'F3CF9B',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [96],
				ext_descrs: [['Very Light Orange']],
			},
			BrickOwl: {
				ext_ids: [91],
				ext_descrs: [['Very Light Orange']],
			},
			LEGO: {
				ext_ids: [36],
				ext_descrs: [['Light Yellowish Orange']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['paleorange']],
			},
			LDraw: {
				ext_ids: [68],
				ext_descrs: [['Very_Light_Orange']],
			},
		},
	},
	{
		id: 69,
		name: 'Light Purple',
		rgb: 'CD6298',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [93],
				ext_descrs: [['Light Purple']],
			},
			BrickOwl: {
				ext_ids: [69],
				ext_descrs: [['Light Purple']],
			},
			LEGO: {
				ext_ids: [198],
				ext_descrs: [['Bright Reddish Lilac', 'BR. RED. LILAC']],
			},
			Peeron: {
				ext_ids: [null, null],
				ext_descrs: [['ltpurple'], ['btpurple']],
			},
			LDraw: {
				ext_ids: [69],
				ext_descrs: [['Light_Purple']],
			},
		},
	},
	{
		id: 70,
		name: 'Reddish Brown',
		rgb: '582A12',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [88],
				ext_descrs: [['Reddish Brown']],
			},
			BrickOwl: {
				ext_ids: [82],
				ext_descrs: [['Reddish Brown']],
			},
			LEGO: {
				ext_ids: [192],
				ext_descrs: [['Reddish Brown', 'RED. BROWN']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['redbrown']],
			},
			LDraw: {
				ext_ids: [70],
				ext_descrs: [['Reddish_Brown']],
			},
		},
	},
	{
		id: 71,
		name: 'Light Bluish Gray',
		rgb: 'A0A5A9',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [86],
				ext_descrs: [['Light Bluish Gray']],
			},
			BrickOwl: {
				ext_ids: [64],
				ext_descrs: [['Medium Stone Gray']],
			},
			LEGO: {
				ext_ids: [194],
				ext_descrs: [['Medium stone grey', 'MED. ST-GREY']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['mdstone']],
			},
			LDraw: {
				ext_ids: [71],
				ext_descrs: [['Light_Bluish_Gray']],
			},
		},
	},
	{
		id: 72,
		name: 'Dark Bluish Gray',
		rgb: '6C6E68',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [85],
				ext_descrs: [['Dark Bluish Gray']],
			},
			BrickOwl: {
				ext_ids: [50],
				ext_descrs: [['Dark Stone Gray']],
			},
			LEGO: {
				ext_ids: [199],
				ext_descrs: [['Dark stone grey', 'DK. ST. GREY']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['dkstone']],
			},
			LDraw: {
				ext_ids: [72],
				ext_descrs: [['Dark_Bluish_Gray']],
			},
		},
	},
	{
		id: 73,
		name: 'Medium Blue',
		rgb: '5A93DB',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [42],
				ext_descrs: [['Medium Blue']],
			},
			BrickOwl: {
				ext_ids: [14],
				ext_descrs: [['Medium Blue']],
			},
			LEGO: {
				ext_ids: [102],
				ext_descrs: [['Medium blue', 'MD.BLUE']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['mdblue']],
			},
			LDraw: {
				ext_ids: [73],
				ext_descrs: [['Medium_Blue']],
			},
		},
	},
	{
		id: 74,
		name: 'Medium Green',
		rgb: '73DCA1',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [37],
				ext_descrs: [['Medium Green']],
			},
			BrickOwl: {
				ext_ids: [10],
				ext_descrs: [['Medium Green']],
			},
			LEGO: {
				ext_ids: [29],
				ext_descrs: [['Medium green', 'MD.GREEN']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['mdgreen']],
			},
			LDraw: {
				ext_ids: [74],
				ext_descrs: [['Medium_Green']],
			},
		},
	},
	{
		id: 75,
		name: 'Speckle Black-Copper',
		rgb: '05131D',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [116],
				ext_descrs: [['Speckle Black-Copper']],
			},
			BrickOwl: {
				ext_ids: [133],
				ext_descrs: [['Speckle Black Copper']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['blackcopperglitter']],
			},
			LDraw: {
				ext_ids: [75],
				ext_descrs: [['Speckle_Black_Copper']],
			},
			LEGO: {
				ext_ids: [306],
				ext_descrs: [['COP. DIF.']],
			},
		},
	},
	{
		id: 76,
		name: 'Speckle DBGray-Silver',
		rgb: '6C6E68',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [117],
				ext_descrs: [['Speckle DBGray-Silver']],
			},
			BrickOwl: {
				ext_ids: [134],
				ext_descrs: [['Speckle Gray']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['dkstoneglitter']],
			},
			LDraw: {
				ext_ids: [76],
				ext_descrs: [['Speckle_Dark_Bluish_Gray_Silver']],
			},
			LEGO: {
				ext_ids: [304],
				ext_descrs: [['CO. SILVER DIF']],
			},
		},
	},
	{
		id: 77,
		name: 'Light Pink',
		rgb: 'FECCCF',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [56],
				ext_descrs: [['Light Pink']],
			},
			BrickOwl: {
				ext_ids: [68],
				ext_descrs: [['Light Pink']],
			},
			LEGO: {
				ext_ids: [223, 17],
				ext_descrs: [['Light Pink'], ['Rose']],
			},
			Peeron: {
				ext_ids: [null, null],
				ext_descrs: [['parapink'], ['ltpink']],
			},
			LDraw: {
				ext_ids: [77],
				ext_descrs: [['Light_Pink']],
			},
		},
	},
	{
		id: 78,
		name: 'Light Nougat',
		rgb: 'F6D7B3',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [90],
				ext_descrs: [['Light Nougat']],
			},
			BrickOwl: {
				ext_ids: [65],
				ext_descrs: [['Light Flesh']],
			},
			LEGO: {
				ext_ids: [283],
				ext_descrs: [['Light Nougat', 'L.NOUGAT']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['ltflesh']],
			},
			LDraw: {
				ext_ids: [78],
				ext_descrs: [['Light_Flesh']],
			},
		},
	},
	{
		id: 79,
		name: 'Milky White',
		rgb: 'FFFFFF',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [60],
				ext_descrs: [['Milky White']],
			},
			BrickOwl: {
				ext_ids: [130],
				ext_descrs: [['Translucent White']],
			},
			LEGO: {
				ext_ids: [20],
				ext_descrs: [['Nature']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['trluwhite']],
			},
			LDraw: {
				ext_ids: [79],
				ext_descrs: [['Milky_White']],
			},
		},
	},
	{
		id: 80,
		name: 'Metallic Silver',
		rgb: 'A5A9B4',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [67],
				ext_descrs: [['Metallic Silver']],
			},
			BrickOwl: {
				ext_ids: [126],
				ext_descrs: [['Metallic Silver']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['metallicsilver']],
			},
			LDraw: {
				ext_ids: [80],
				ext_descrs: [['Metallic_Silver']],
			},
			LEGO: {
				ext_ids: [336, 298],
				ext_descrs: [['SILVER INK'], ['C.SILVER, DR. L']],
			},
		},
	},
	{
		id: 81,
		name: 'Metallic Green',
		rgb: '899B5F',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [70],
				ext_descrs: [['Metallic Green']],
			},
			BrickOwl: {
				ext_ids: [125],
				ext_descrs: [['Metallic Green']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['metallicgreen']],
			},
			LDraw: {
				ext_ids: [81],
				ext_descrs: [['Metallic_Green']],
			},
		},
	},
	{
		id: 82,
		name: 'Metallic Gold',
		rgb: 'DBAC34',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [65],
				ext_descrs: [['Metallic Gold']],
			},
			BrickOwl: {
				ext_ids: [124],
				ext_descrs: [['Metallic Gold']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['metallicgold']],
			},
			LDraw: {
				ext_ids: [82],
				ext_descrs: [['Metallic_Gold']],
			},
			LEGO: {
				ext_ids: [335, 299],
				ext_descrs: [['GOLD INK'], ['W.GOLD, DR.LA.']],
			},
		},
	},
	{
		id: 84,
		name: 'Medium Nougat',
		rgb: 'AA7D55',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [150],
				ext_descrs: [['Medium Nougat']],
			},
			BrickOwl: {
				ext_ids: [74],
				ext_descrs: [['Medium Dark Flesh']],
			},
			LEGO: {
				ext_ids: [312],
				ext_descrs: [['Medium Nougat', 'M. NOUGAT']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['mddkflesh']],
			},
			LDraw: {
				ext_ids: [84],
				ext_descrs: [['Medium_Nougat']],
			},
		},
	},
	{
		id: 85,
		name: 'Dark Purple',
		rgb: '3F3691',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [89],
				ext_descrs: [['Dark Purple']],
			},
			BrickOwl: {
				ext_ids: [55],
				ext_descrs: [['Dark Purple']],
			},
			LEGO: {
				ext_ids: [268],
				ext_descrs: [['Medium Lilac', 'M. LILAC']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['mdlilac']],
			},
			LDraw: {
				ext_ids: [85],
				ext_descrs: [['Medium_Lilac']],
			},
		},
	},
	{
		id: 86,
		name: 'Light Brown',
		rgb: '7C503A',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [91],
				ext_descrs: [['Light Brown']],
			},
			BrickOwl: {
				ext_ids: [52],
				ext_descrs: [['Dark Flesh']],
			},
			LEGO: {
				ext_ids: [217],
				ext_descrs: [['BROWN']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['dkflesh']],
			},
			LDraw: {
				ext_ids: [86],
				ext_descrs: [['Light_Brown']],
			},
		},
	},
	{
		id: 89,
		name: 'Royal Blue',
		rgb: '4C61DB',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [97],
				ext_descrs: [['Blue-Violet']],
			},
			LEGO: {
				ext_ids: [195],
				ext_descrs: [['R. BLUE']],
			},
			LDraw: {
				ext_ids: [89],
				ext_descrs: [['Blue_Violet']],
			},
			BrickOwl: {
				ext_ids: [40],
				ext_descrs: [['Royal Blue']],
			},
		},
	},
	{
		id: 92,
		name: 'Nougat',
		rgb: 'D09168',
		is_trans: false,
		external_ids: {
			BrickOwl: {
				ext_ids: [6],
				ext_descrs: [['Flesh']],
			},
			LEGO: {
				ext_ids: [18],
				ext_descrs: [['Nougat']],
			},
			BrickLink: {
				ext_ids: [28],
				ext_descrs: [['Nougat']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['flesh']],
			},
			LDraw: {
				ext_ids: [92],
				ext_descrs: [['Nougat']],
			},
		},
	},
	{
		id: 100,
		name: 'Light Salmon',
		rgb: 'FEBABD',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [26],
				ext_descrs: [['Light Salmon']],
			},
			BrickOwl: {
				ext_ids: [5],
				ext_descrs: [['Light Salmon']],
			},
			LEGO: {
				ext_ids: [100],
				ext_descrs: [['Light red']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['ltsalmon']],
			},
			LDraw: {
				ext_ids: [100],
				ext_descrs: [['Light_Salmon']],
			},
		},
	},
	{
		id: 110,
		name: 'Violet',
		rgb: '4354A3',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [43],
				ext_descrs: [['Violet']],
			},
			BrickOwl: {
				ext_ids: [15],
				ext_descrs: [['Violet']],
			},
			LEGO: {
				ext_ids: [110],
				ext_descrs: [['Bright Bluish Violet', 'BR.BLUEVIOL']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['violet']],
			},
			LDraw: {
				ext_ids: [110],
				ext_descrs: [['Violet']],
			},
		},
	},
	{
		id: 112,
		name: 'Medium Bluish Violet',
		rgb: '6874CA',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [73],
				ext_descrs: [['Medium Violet']],
			},
			LEGO: {
				ext_ids: [112, 213],
				ext_descrs: [
					['Medium Bluish Violet', 'ML.BLUEVIOL'],
					['Medium Royal Blue'],
				],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['royalblue']],
			},
			LDraw: {
				ext_ids: [112],
				ext_descrs: [['Medium_Violet']],
			},
			BrickOwl: {
				ext_ids: [78],
				ext_descrs: [['Medium Violet']],
			},
		},
	},
	{
		id: 114,
		name: 'Glitter Trans-Dark Pink',
		rgb: 'DF6695',
		is_trans: true,
		external_ids: {
			BrickLink: {
				ext_ids: [100],
				ext_descrs: [['Glitter Trans-Dark Pink']],
			},
			BrickOwl: {
				ext_ids: [132],
				ext_descrs: [['Transparent Pink Glitter']],
			},
			LEGO: {
				ext_ids: [114],
				ext_descrs: [
					['Tr. Medium Reddish-Violet w. Glitter 2%', 'TR.M.R.V.GLI'],
				],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['trpinkglitter']],
			},
			LDraw: {
				ext_ids: [114],
				ext_descrs: [['Glitter_Trans_Dark_Pink']],
			},
		},
	},
	{
		id: 115,
		name: 'Medium Lime',
		rgb: 'C7D23C',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [76],
				ext_descrs: [['Medium Lime']],
			},
			BrickOwl: {
				ext_ids: [77],
				ext_descrs: [['Medium Lime']],
			},
			LEGO: {
				ext_ids: [115],
				ext_descrs: [['Med. yellowish green', 'MD.YEL-GREEN']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['mdlime']],
			},
			LDraw: {
				ext_ids: [115],
				ext_descrs: [['Medium_Lime']],
			},
		},
	},
	{
		id: 117,
		name: 'Glitter Trans-Clear',
		rgb: 'FFFFFF',
		is_trans: true,
		external_ids: {
			BrickLink: {
				ext_ids: [101],
				ext_descrs: [['Glitter Trans-Clear']],
			},
			BrickOwl: {
				ext_ids: [131],
				ext_descrs: [['Transparent Glitter']],
			},
			LEGO: {
				ext_ids: [117, 122],
				ext_descrs: [
					['Transparent Glitter', 'TR.W.GLITTER'],
					['Nature with Glitter'],
				],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['clearglitter']],
			},
			LDraw: {
				ext_ids: [117],
				ext_descrs: [['Glitter_Trans_Clear']],
			},
		},
	},
	{
		id: 118,
		name: 'Aqua',
		rgb: 'B3D7D1',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [41],
				ext_descrs: [['Aqua']],
			},
			BrickOwl: {
				ext_ids: [13],
				ext_descrs: [['Aqua']],
			},
			LEGO: {
				ext_ids: [118],
				ext_descrs: [['Light bluish green', 'L.BLUE-GREEN']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['aqua']],
			},
			LDraw: {
				ext_ids: [118],
				ext_descrs: [['Aqua']],
			},
		},
	},
	{
		id: 120,
		name: 'Light Lime',
		rgb: 'D9E4A7',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [35],
				ext_descrs: [['Light Lime']],
			},
			BrickOwl: {
				ext_ids: [67],
				ext_descrs: [['Light Lime']],
			},
			LEGO: {
				ext_ids: [120],
				ext_descrs: [['Lig. yellowish green', 'L.YEL-GREEN']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['ltlime']],
			},
			LDraw: {
				ext_ids: [120],
				ext_descrs: [['Light_Lime']],
			},
		},
	},
	{
		id: 125,
		name: 'Light Orange',
		rgb: 'F9BA61',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [32],
				ext_descrs: [['Light Orange']],
			},
			BrickOwl: {
				ext_ids: [8],
				ext_descrs: [['Light Orange']],
			},
			LEGO: {
				ext_ids: [121],
				ext_descrs: [['Medium Yellowish Orange']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['ltorange']],
			},
			LDraw: {
				ext_ids: [125],
				ext_descrs: [['Light_Orange']],
			},
		},
	},
	{
		id: 129,
		name: 'Glitter Trans-Purple',
		rgb: 'A5A5CB',
		is_trans: true,
		external_ids: {
			BrickLink: {
				ext_ids: [102],
				ext_descrs: [['Glitter Trans-Purple']],
			},
			BrickOwl: {
				ext_ids: [22],
				ext_descrs: [['Transparent Purple Glitter']],
			},
			LEGO: {
				ext_ids: [129],
				ext_descrs: [
					['Tr. Bright Bluish Violet w. Glitter 2%', 'TR.BR.BL.V.G'],
				],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['trpurpleglitter']],
			},
			LDraw: {
				ext_ids: [129],
				ext_descrs: [['Glitter_Trans_Purple']],
			},
		},
	},
	{
		id: 132,
		name: 'Speckle Black-Silver',
		rgb: '05131D',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [111],
				ext_descrs: [['Speckle Black-Silver']],
			},
			BrickOwl: {
				ext_ids: [24],
				ext_descrs: [['Speckle Black']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['blackglitter']],
			},
			LDraw: {
				ext_ids: [132],
				ext_descrs: [['Speckle_Black_Silver']],
			},
			LEGO: {
				ext_ids: [304],
				ext_descrs: [['CO. SILVER DIF']],
			},
		},
	},
	{
		id: 133,
		name: 'Speckle Black-Gold',
		rgb: '05131D',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [151],
				ext_descrs: [['Speckle Black-Gold']],
			},
			BrickOwl: {
				ext_ids: [35],
				ext_descrs: [['Speckle Black Gold']],
			},
			LDraw: {
				ext_ids: [133],
				ext_descrs: [['Speckle_Black_Gold']],
			},
			LEGO: {
				ext_ids: [305],
				ext_descrs: [['Warm Gold, Diffuse']],
			},
		},
	},
	{
		id: 134,
		name: 'Copper',
		rgb: 'AE7A59',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [84],
				ext_descrs: [['Copper']],
			},
			BrickOwl: {
				ext_ids: [116],
				ext_descrs: [['Copper']],
			},
			LEGO: {
				ext_ids: [139],
				ext_descrs: [['Copper']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['pearlcopper']],
			},
			LDraw: {
				ext_ids: [134],
				ext_descrs: [['Copper']],
			},
		},
	},
	{
		id: 135,
		name: 'Pearl Light Gray',
		rgb: '9CA3A8',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [66],
				ext_descrs: [['Pearl Light Gray']],
			},
			BrickOwl: {
				ext_ids: [122],
				ext_descrs: [['Pearl Light Gray']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['pearlltgray']],
			},
			LEGO: {
				ext_ids: [296, 131],
				ext_descrs: [['Cool silver'], ['Silver']],
			},
			LDraw: {
				ext_ids: [135],
				ext_descrs: [['Pearl_Light_Gray']],
			},
		},
	},
	{
		id: 137,
		name: 'Pearl Sand Blue',
		rgb: '7988A1',
		is_trans: false,
		external_ids: {
			BrickOwl: {
				ext_ids: [118],
				ext_descrs: [['Metallic Blue']],
			},
			LEGO: {
				ext_ids: [145],
				ext_descrs: [['Sand blue metallic', 'MET.SAND.BLU']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['pearlblue']],
			},
			LDraw: {
				ext_ids: [137],
				ext_descrs: [['Metal_Blue']],
			},
			BrickLink: {
				ext_ids: [78],
				ext_descrs: [['Pearl Sand Blue']],
			},
		},
	},
	{
		id: 142,
		name: 'Pearl Light Gold',
		rgb: 'DCBC81',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [61],
				ext_descrs: [['Pearl Light Gold']],
			},
			BrickOwl: {
				ext_ids: [121],
				ext_descrs: [['Pearl Light Gold']],
			},
			LEGO: {
				ext_ids: [127],
				ext_descrs: [['Gold']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['pearlltgold']],
			},
			LDraw: {
				ext_ids: [142],
				ext_descrs: [['Pearl_Light_Gold']],
			},
		},
	},
	{
		id: 143,
		name: 'Trans-Medium Blue',
		rgb: 'CFE2F7',
		is_trans: true,
		external_ids: {
			BrickLink: {
				ext_ids: [74],
				ext_descrs: [['Trans-Medium Blue']],
			},
			BrickOwl: {
				ext_ids: [102],
				ext_descrs: [['Transparent Medium Blue']],
			},
			LEGO: {
				ext_ids: [143],
				ext_descrs: [['Tr. Flu. Blue', 'TR.FL. BLUE']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['trmdblue']],
			},
			LDraw: {
				ext_ids: [41],
				ext_descrs: [['Trans_Medium_Blue']],
			},
		},
	},
	{
		id: 148,
		name: 'Pearl Dark Gray',
		rgb: '575857',
		is_trans: false,
		external_ids: {
			BrickOwl: {
				ext_ids: [119],
				ext_descrs: [['Pearl Dark Gray']],
			},
			BrickLink: {
				ext_ids: [77],
				ext_descrs: [['Pearl Dark Gray']],
			},
			LEGO: {
				ext_ids: [148],
				ext_descrs: [['Mettalic Dark Grey', 'MET.DK.GREY']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['pearldkgray']],
			},
			LDraw: {
				ext_ids: [148],
				ext_descrs: [['Pearl_Dark_Gray']],
			},
		},
	},
	{
		id: 150,
		name: 'Pearl Very Light Gray',
		rgb: 'ABADAC',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [119],
				ext_descrs: [['Pearl Very Light Gray']],
			},
			BrickOwl: {
				ext_ids: [27],
				ext_descrs: [['Pearl Very Light Gray']],
			},
			LEGO: {
				ext_ids: [150],
				ext_descrs: [['Metallic Light Gray']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['pearlvlgray']],
			},
			LDraw: {
				ext_ids: [150],
				ext_descrs: [['Pearl_Very_Light_Grey']],
			},
		},
	},
	{
		id: 151,
		name: 'Very Light Bluish Gray',
		rgb: 'E6E3E0',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [99],
				ext_descrs: [['Very Light Bluish Gray']],
			},
			BrickOwl: {
				ext_ids: [90],
				ext_descrs: [['Light Stone Gray']],
			},
			LEGO: {
				ext_ids: [208],
				ext_descrs: [['Light stone grey', 'LGH. ST. GREY']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['ltstone']],
			},
			LDraw: {
				ext_ids: [151],
				ext_descrs: [['Very_Light_Bluish_Gray']],
			},
		},
	},
	{
		id: 158,
		name: 'Yellowish Green',
		rgb: 'DFEEA5',
		is_trans: false,
		external_ids: {
			LDraw: {
				ext_ids: [326],
				ext_descrs: [['Yellowish_Green']],
			},
			BrickLink: {
				ext_ids: [158],
				ext_descrs: [['Yellowish Green']],
			},
			BrickOwl: {
				ext_ids: [94],
				ext_descrs: [['Yellowish Green']],
			},
			LEGO: {
				ext_ids: [326],
				ext_descrs: [['Spring Yellow Green', 'SPR. YELL. GREE']],
			},
		},
	},
	{
		id: 178,
		name: 'Flat Dark Gold',
		rgb: 'B48455',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [81],
				ext_descrs: [['Flat Dark Gold']],
			},
			BrickOwl: {
				ext_ids: [21],
				ext_descrs: [['Flat Dark Gold']],
			},
			LEGO: {
				ext_ids: [147],
				ext_descrs: [['Gold Metallic', 'MET.SAND.YEL']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['pearldkgold']],
			},
			LDraw: {
				ext_ids: [178],
				ext_descrs: [['Pearl_Yellow']],
			},
		},
	},
	{
		id: 179,
		name: 'Flat Silver',
		rgb: '898788',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [95],
				ext_descrs: [['Flat Silver']],
			},
			BrickOwl: {
				ext_ids: [117],
				ext_descrs: [['Flat Silver']],
			},
			LEGO: {
				ext_ids: [315],
				ext_descrs: [['Silver Metallic', 'SILVER MET.']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['pearlsilver']],
			},
			LDraw: {
				ext_ids: [179],
				ext_descrs: [['Pearl_Silver']],
			},
		},
	},
	{
		id: 182,
		name: 'Trans-Orange',
		rgb: 'F08F1C',
		is_trans: true,
		external_ids: {
			BrickLink: {
				ext_ids: [98],
				ext_descrs: [['Trans-Orange']],
			},
			BrickOwl: {
				ext_ids: [105],
				ext_descrs: [['Transparent Orange']],
			},
			LEGO: {
				ext_ids: [182],
				ext_descrs: [['Tr. Bright Orange', 'TR. BR. ORANGE']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['trdkorange']],
			},
			LDraw: {
				ext_ids: [57],
				ext_descrs: [['Trans_Orange']],
			},
		},
	},
	{
		id: 183,
		name: 'Pearl White',
		rgb: 'F2F3F2',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [83],
				ext_descrs: [['Pearl White']],
			},
			BrickOwl: {
				ext_ids: [123],
				ext_descrs: [['Pearlescent']],
			},
			LEGO: {
				ext_ids: [183],
				ext_descrs: [['Metallic White', 'MET. WHITE']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['pearlescent']],
			},
			LDraw: {
				ext_ids: [183],
				ext_descrs: [['Pearl_White']],
			},
		},
	},
	{
		id: 191,
		name: 'Bright Light Orange',
		rgb: 'F8BB3D',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [110],
				ext_descrs: [['Bright Light Orange']],
			},
			BrickOwl: {
				ext_ids: [43],
				ext_descrs: [['Bright Light Orange']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['btltorange']],
			},
			LDraw: {
				ext_ids: [191],
				ext_descrs: [['Bright_Light_Orange']],
			},
			LEGO: {
				ext_ids: [191],
				ext_descrs: [
					[
						'Flame yellowish orange',
						'FL. YELL-ORA',
						'COMPD. FLAME YELLOWISH ORANGE',
					],
				],
			},
		},
	},
	{
		id: 212,
		name: 'Bright Light Blue',
		rgb: '9FC3E9',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [105],
				ext_descrs: [['Bright Light Blue']],
			},
			BrickOwl: {
				ext_ids: [42],
				ext_descrs: [['Bright Light Blue']],
			},
			LEGO: {
				ext_ids: [212],
				ext_descrs: [['Light Royal blue', 'LGH. ROY. BLUE']],
			},
			Peeron: {
				ext_ids: [null, null],
				ext_descrs: [['ltroyalblue'], ['btltblue']],
			},
			LDraw: {
				ext_ids: [212],
				ext_descrs: [['Bright_Light_Blue']],
			},
		},
	},
	{
		id: 216,
		name: 'Rust',
		rgb: 'B31004',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [27],
				ext_descrs: [['Rust']],
			},
			BrickOwl: {
				ext_ids: [83],
				ext_descrs: [['Rust']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['rust']],
			},
			LDraw: {
				ext_ids: [216],
				ext_descrs: [['Rust']],
			},
		},
	},
	{
		id: 226,
		name: 'Bright Light Yellow',
		rgb: 'FFF03A',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [103],
				ext_descrs: [['Bright Light Yellow']],
			},
			BrickOwl: {
				ext_ids: [44],
				ext_descrs: [['Bright Light Yellow']],
			},
			LEGO: {
				ext_ids: [226],
				ext_descrs: [['Cool Yellow', 'COOL YEL.', 'COMPD. COOL YELLOW V.3']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['coolyellow']],
			},
			LDraw: {
				ext_ids: [226],
				ext_descrs: [['Bright_Light_Yellow']],
			},
		},
	},
	{
		id: 230,
		name: 'Trans-Pink',
		rgb: 'E4ADC8',
		is_trans: true,
		external_ids: {
			BrickLink: {
				ext_ids: [107],
				ext_descrs: [['Trans-Pink']],
			},
			BrickOwl: {
				ext_ids: [106],
				ext_descrs: [['Transparent Pink']],
			},
			LEGO: {
				ext_ids: [230],
				ext_descrs: [['TR. BR. PURPLE']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['trltpink']],
			},
			LDraw: {
				ext_ids: [45],
				ext_descrs: [['Trans_Pink']],
			},
		},
	},
	{
		id: 232,
		name: 'Sky Blue',
		rgb: '7DBFDD',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [87],
				ext_descrs: [['Sky Blue']],
			},
			BrickOwl: {
				ext_ids: [88],
				ext_descrs: [['Sky Blue']],
			},
			LEGO: {
				ext_ids: [232],
				ext_descrs: [['Dove blue', 'DO. BLUE']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['doveblue']],
			},
			LDraw: {
				ext_ids: [232],
				ext_descrs: [['Sky_Blue']],
			},
		},
	},
	{
		id: 236,
		name: 'Trans-Light Purple',
		rgb: '96709F',
		is_trans: true,
		external_ids: {
			BrickLink: {
				ext_ids: [114],
				ext_descrs: [['Trans-Light Purple']],
			},
			BrickOwl: {
				ext_ids: [26],
				ext_descrs: [['Transparent Light Purple']],
			},
			LEGO: {
				ext_ids: [284],
				ext_descrs: [['TR. RED-LILAC', 'TR. RE-LILAC']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['trlilac']],
			},
			LDraw: {
				ext_ids: [44, 284],
				ext_descrs: [['Trans_Light_Purple'], ['Trans_Light_Purple']],
			},
		},
	},
	{
		id: 272,
		name: 'Dark Blue',
		rgb: '0A3463',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [63],
				ext_descrs: [['Dark Blue']],
			},
			BrickOwl: {
				ext_ids: [48],
				ext_descrs: [['Dark Blue']],
			},
			LEGO: {
				ext_ids: [140],
				ext_descrs: [['Earth blue']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['navyblue']],
			},
			LDraw: {
				ext_ids: [272],
				ext_descrs: [['Dark_Blue']],
			},
		},
	},
	{
		id: 288,
		name: 'Dark Green',
		rgb: '184632',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [80],
				ext_descrs: [['Dark Green']],
			},
			BrickOwl: {
				ext_ids: [20],
				ext_descrs: [['Dark Green']],
			},
			LEGO: {
				ext_ids: [141],
				ext_descrs: [['Earth Green', 'EARTH GREEN']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['dkgreen']],
			},
			LDraw: {
				ext_ids: [288],
				ext_descrs: [['Dark_Green']],
			},
		},
	},
	{
		id: 294,
		name: 'Glow In Dark Trans',
		rgb: 'BDC6AD',
		is_trans: true,
		external_ids: {
			BrickLink: {
				ext_ids: [118],
				ext_descrs: [['Glow In Dark Trans']],
			},
			BrickOwl: {
				ext_ids: [128],
				ext_descrs: [['Glow in the Dark Transparent']],
			},
			LEGO: {
				ext_ids: [294],
				ext_descrs: [['Phosphorescent Green', 'PH.GREEN']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['trglowinthedark']],
			},
			LDraw: {
				ext_ids: [294],
				ext_descrs: [['Glow_In_Dark_Trans']],
			},
		},
	},
	{
		id: 297,
		name: 'Pearl Gold',
		rgb: 'AA7F2E',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [115],
				ext_descrs: [['Pearl Gold']],
			},
			BrickOwl: {
				ext_ids: [120],
				ext_descrs: [['Pearl Gold']],
			},
			LEGO: {
				ext_ids: [297],
				ext_descrs: [['Warm Gold', 'W.GOLD']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['pearlgold']],
			},
			LDraw: {
				ext_ids: [297],
				ext_descrs: [['Pearl_Gold']],
			},
		},
	},
	{
		id: 308,
		name: 'Dark Brown',
		rgb: '352100',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [120],
				ext_descrs: [['Dark Brown']],
			},
			BrickOwl: {
				ext_ids: [51],
				ext_descrs: [['Dark Brown']],
			},
			LEGO: {
				ext_ids: [308],
				ext_descrs: [['Dark Brown', 'DK. BROWN']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['dkbrown']],
			},
			LDraw: {
				ext_ids: [308],
				ext_descrs: [['Dark_Brown']],
			},
		},
	},
	{
		id: 313,
		name: 'Maersk Blue',
		rgb: '3592C3',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [72],
				ext_descrs: [['Maersk Blue']],
			},
			BrickOwl: {
				ext_ids: [71],
				ext_descrs: [['Maersk Blue']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['maerskblue']],
			},
			LDraw: {
				ext_ids: [313],
				ext_descrs: [['Maersk_Blue']],
			},
		},
	},
	{
		id: 320,
		name: 'Dark Red',
		rgb: '720E0F',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [59],
				ext_descrs: [['Dark Red']],
			},
			BrickOwl: {
				ext_ids: [56],
				ext_descrs: [['Dark Red']],
			},
			LEGO: {
				ext_ids: [154],
				ext_descrs: [['Dark red', 'NEW DARK RED']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['dkred']],
			},
			LDraw: {
				ext_ids: [320],
				ext_descrs: [['Dark_Red']],
			},
		},
	},
	{
		id: 321,
		name: 'Dark Azure',
		rgb: '078BC9',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [153],
				ext_descrs: [['Dark Azure']],
			},
			BrickOwl: {
				ext_ids: [47],
				ext_descrs: [['Dark Azure']],
			},
			LEGO: {
				ext_ids: [321],
				ext_descrs: [['Dark Azur']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['dkazure']],
			},
			LDraw: {
				ext_ids: [321],
				ext_descrs: [['Dark_Azure']],
			},
		},
	},
	{
		id: 322,
		name: 'Medium Azure',
		rgb: '36AEBF',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [156],
				ext_descrs: [['Medium Azure']],
			},
			BrickOwl: {
				ext_ids: [73],
				ext_descrs: [['Medium Azure']],
			},
			LEGO: {
				ext_ids: [322],
				ext_descrs: [['Medium Azure', 'MEDIUM AZUR']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['mdazure']],
			},
			LDraw: {
				ext_ids: [322],
				ext_descrs: [['Medium_Azure']],
			},
		},
	},
	{
		id: 323,
		name: 'Light Aqua',
		rgb: 'ADC3C0',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [152],
				ext_descrs: [['Light Aqua']],
			},
			BrickOwl: {
				ext_ids: [62],
				ext_descrs: [['Light Aqua']],
			},
			LEGO: {
				ext_ids: [323],
				ext_descrs: [['Aqua']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['ltaqua']],
			},
			LDraw: {
				ext_ids: [323],
				ext_descrs: [['Light_Aqua']],
			},
		},
	},
	{
		id: 326,
		name: 'Olive Green',
		rgb: '9B9A5A',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [155],
				ext_descrs: [['Olive Green']],
			},
			BrickOwl: {
				ext_ids: [79],
				ext_descrs: [['Olive Green']],
			},
			LEGO: {
				ext_ids: [330],
				ext_descrs: [['Olive Green', 'OLIVE GREEN']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['olivegreen']],
			},
			LDraw: {
				ext_ids: [330],
				ext_descrs: [['Olive_Green']],
			},
		},
	},
	{
		id: 334,
		name: 'Chrome Gold',
		rgb: 'BBA53D',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [21],
				ext_descrs: [['Chrome Gold']],
			},
			BrickOwl: {
				ext_ids: [2],
				ext_descrs: [['Chrome Gold']],
			},
			LEGO: {
				ext_ids: [310],
				ext_descrs: [['Metalized Gold']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['chromegold']],
			},
			LDraw: {
				ext_ids: [334],
				ext_descrs: [['Chrome_Gold']],
			},
		},
	},
	{
		id: 335,
		name: 'Sand Red',
		rgb: 'D67572',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [58],
				ext_descrs: [['Sand Red']],
			},
			BrickOwl: {
				ext_ids: [87],
				ext_descrs: [['Sand Red']],
			},
			LEGO: {
				ext_ids: [153],
				ext_descrs: [['Sand red']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['sandred']],
			},
			LDraw: {
				ext_ids: [335],
				ext_descrs: [['Sand_Red']],
			},
		},
	},
	{
		id: 351,
		name: 'Medium Dark Pink',
		rgb: 'F785B1',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [94],
				ext_descrs: [['Medium Dark Pink']],
			},
			BrickOwl: {
				ext_ids: [75],
				ext_descrs: [['Medium Dark Pink']],
			},
			LEGO: {
				ext_ids: [22],
				ext_descrs: [['Medium Reddish Violet', 'MD.REDVIOL']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['duplorose']],
			},
			LDraw: {
				ext_ids: [351],
				ext_descrs: [['Medium_Dark_Pink']],
			},
		},
	},
	{
		id: 366,
		name: 'Earth Orange',
		rgb: 'FA9C1C',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [29],
				ext_descrs: [['Earth Orange']],
			},
			BrickOwl: {
				ext_ids: [59],
				ext_descrs: [['Earth Orange']],
			},
			LEGO: {
				ext_ids: [12],
				ext_descrs: [['L.ORABROWN']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['earthorange']],
			},
			LDraw: {
				ext_ids: [366],
				ext_descrs: [['Earth_Orange']],
			},
		},
	},
	{
		id: 373,
		name: 'Sand Purple',
		rgb: '845E84',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [54],
				ext_descrs: [['Sand Purple']],
			},
			BrickOwl: {
				ext_ids: [86],
				ext_descrs: [['Sand Purple']],
			},
			LEGO: {
				ext_ids: [136],
				ext_descrs: [['Sand violet']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['sandpurple']],
			},
			LDraw: {
				ext_ids: [373],
				ext_descrs: [['Sand_Purple']],
			},
		},
	},
	{
		id: 378,
		name: 'Sand Green',
		rgb: 'A0BCAC',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [48],
				ext_descrs: [['Sand Green']],
			},
			BrickOwl: {
				ext_ids: [18],
				ext_descrs: [['Sand Green']],
			},
			LEGO: {
				ext_ids: [151],
				ext_descrs: [['Sand green']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['sandgreen']],
			},
			LDraw: {
				ext_ids: [378],
				ext_descrs: [['Sand_Green']],
			},
		},
	},
	{
		id: 379,
		name: 'Sand Blue',
		rgb: '6074A1',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [55],
				ext_descrs: [['Sand Blue']],
			},
			BrickOwl: {
				ext_ids: [85],
				ext_descrs: [['Sand Blue']],
			},
			LEGO: {
				ext_ids: [135],
				ext_descrs: [['Sand blue']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['sandblue']],
			},
			LDraw: {
				ext_ids: [379],
				ext_descrs: [['Sand_Blue']],
			},
		},
	},
	{
		id: 383,
		name: 'Chrome Silver',
		rgb: 'E0E0E0',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [22],
				ext_descrs: [['Chrome Silver']],
			},
			BrickOwl: {
				ext_ids: [115],
				ext_descrs: [['Chrome Silver']],
			},
			LEGO: {
				ext_ids: [309],
				ext_descrs: [['Metalized Silver']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['chromesilver']],
			},
			LDraw: {
				ext_ids: [383],
				ext_descrs: [['Chrome_Silver']],
			},
		},
	},
	{
		id: 450,
		name: 'Fabuland Brown',
		rgb: 'B67B50',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [106],
				ext_descrs: [['Fabuland Brown']],
			},
			BrickOwl: {
				ext_ids: [23],
				ext_descrs: [['Fabuland Brown']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['fabubrown']],
			},
			LDraw: {
				ext_ids: [450],
				ext_descrs: [['Fabuland_Brown']],
			},
			LEGO: {
				ext_ids: [4],
				ext_descrs: [['Brick Red']],
			},
		},
	},
	{
		id: 462,
		name: 'Medium Orange',
		rgb: 'FFA70B',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [31],
				ext_descrs: [['Medium Orange']],
			},
			BrickOwl: {
				ext_ids: [7],
				ext_descrs: [['Medium Orange']],
			},
			LEGO: {
				ext_ids: [105],
				ext_descrs: [['Br. yellowish orange', 'BR.YELORA']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['mdorange']],
			},
			LDraw: {
				ext_ids: [462],
				ext_descrs: [['Medium_Orange']],
			},
		},
	},
	{
		id: 484,
		name: 'Dark Orange',
		rgb: 'A95500',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [68],
				ext_descrs: [['Dark Orange']],
			},
			BrickOwl: {
				ext_ids: [54],
				ext_descrs: [['Dark Orange']],
			},
			LEGO: {
				ext_ids: [38],
				ext_descrs: [['Dark Orange', 'DK.ORA']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['dkorange']],
			},
			LDraw: {
				ext_ids: [484],
				ext_descrs: [['Dark_Orange']],
			},
		},
	},
	{
		id: 503,
		name: 'Very Light Gray',
		rgb: 'E6E3DA',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [49],
				ext_descrs: [['Very Light Gray']],
			},
			BrickOwl: {
				ext_ids: [19],
				ext_descrs: [['Very Light Gray']],
			},
			LEGO: {
				ext_ids: [103],
				ext_descrs: [['Light grey']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['scalagray']],
			},
			LDraw: {
				ext_ids: [503],
				ext_descrs: [['Very_Light_Gray']],
			},
		},
	},
	{
		id: 1000,
		name: 'Glow in Dark White',
		rgb: 'D9D9D9',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [159],
				ext_descrs: [['Glow in Dark White']],
			},
			BrickOwl: {
				ext_ids: [129],
				ext_descrs: [['Glow in the Dark White']],
			},
			LEGO: {
				ext_ids: [329],
				ext_descrs: [['WHITE GLOW']],
			},
			LDraw: {
				ext_ids: [329],
				ext_descrs: [['Glow_In_Dark_White']],
			},
		},
	},
	{
		id: 1001,
		name: 'Medium Violet',
		rgb: '9391E4',
		is_trans: false,
		external_ids: {
			LEGO: {
				ext_ids: [219],
				ext_descrs: [['Lilac']],
			},
			Peeron: {
				ext_ids: [null],
				ext_descrs: [['mdviolet']],
			},
			LDraw: {
				ext_ids: [219, 112],
				ext_descrs: [['Lilac'], ['Medium_Violet']],
			},
			BrickLink: {
				ext_ids: [245],
				ext_descrs: [['Lilac']],
			},
			BrickOwl: {
				ext_ids: [221],
				ext_descrs: [['Lilac']],
			},
		},
	},
	{
		id: 1002,
		name: 'Glitter Trans-Neon Green',
		rgb: 'C0F500',
		is_trans: true,
		external_ids: {
			BrickLink: {
				ext_ids: [163],
				ext_descrs: [['Glitter Trans-Neon Green']],
			},
			BrickOwl: {
				ext_ids: [167],
				ext_descrs: [['Transparent Neon Green Glitter']],
			},
			LEGO: {
				ext_ids: [339],
				ext_descrs: [['TR.FL.GRE W/GLI']],
			},
			LDraw: {
				ext_ids: [339],
				ext_descrs: [['Glitter_Trans_Neon_Green']],
			},
		},
	},
	{
		id: 1003,
		name: 'Glitter Trans-Light Blue',
		rgb: '68BCC5',
		is_trans: true,
		external_ids: {
			BrickLink: {
				ext_ids: [162],
				ext_descrs: [['Glitter Trans-Light Blue']],
			},
			BrickOwl: {
				ext_ids: [165],
				ext_descrs: [['Transparent Light Blue Glitter']],
			},
			LDraw: {
				ext_ids: [302],
				ext_descrs: [['Glitter_Trans_Light_Blue']],
			},
			LEGO: {
				ext_ids: [302],
				ext_descrs: [['PCTR LI.BLUE W/', 'TR LI.BLUE W/']],
			},
		},
	},
	{
		id: 1004,
		name: 'Trans-Flame Yellowish Orange',
		rgb: 'FCB76D',
		is_trans: true,
		external_ids: {
			BrickLink: {
				ext_ids: [164],
				ext_descrs: [['Trans Light Orange']],
			},
			LEGO: {
				ext_ids: [231],
				ext_descrs: [['TR. FL. YEL ORA']],
			},
			LDraw: {
				ext_ids: [231],
				ext_descrs: [['Trans_Bright_Light_Orange']],
			},
			BrickOwl: {
				ext_ids: [171],
				ext_descrs: [['Transparent Light Orange']],
			},
		},
	},
	{
		id: 1005,
		name: 'Trans-Fire Yellow',
		rgb: 'FBE890',
		is_trans: true,
		external_ids: {
			LDraw: {
				ext_ids: [234],
				ext_descrs: [['Trans_Fire_Yellow']],
			},
			LEGO: {
				ext_ids: [234],
				ext_descrs: [['TR. FIRE YELL']],
			},
			BrickOwl: {
				ext_ids: [162],
				ext_descrs: [['Transparent Fire Yellow']],
			},
		},
	},
	{
		id: 1006,
		name: 'Trans-Light Royal Blue',
		rgb: 'B4D4F7',
		is_trans: true,
		external_ids: {
			LEGO: {
				ext_ids: [293],
				ext_descrs: [['TR. L.ROYAL BLUE', 'TR.L.ROYAL BLUE']],
			},
			LDraw: {
				ext_ids: [293],
				ext_descrs: [['Trans_Light_Blue_Violet']],
			},
			BrickOwl: {
				ext_ids: [163],
				ext_descrs: [['Transparent Light Royal Blue']],
			},
		},
	},
	{
		id: 1007,
		name: 'Reddish Lilac',
		rgb: '8E5597',
		is_trans: false,
		external_ids: {
			LEGO: {
				ext_ids: [218],
				ext_descrs: [['RED. LILAC']],
			},
			BrickLink: {
				ext_ids: [227],
				ext_descrs: [['Clikits Lavender']],
			},
			BrickOwl: {
				ext_ids: [223],
				ext_descrs: [['Very Light Purple']],
			},
			LDraw: {
				ext_ids: [218],
				ext_descrs: [['Reddish_Lilac']],
			},
		},
	},
	{
		id: 1008,
		name: 'Vintage Blue',
		rgb: '039CBD',
		is_trans: false,
		external_ids: {},
	},
	{
		id: 1009,
		name: 'Vintage Green',
		rgb: '1E601E',
		is_trans: false,
		external_ids: {},
	},
	{
		id: 1010,
		name: 'Vintage Red',
		rgb: 'CA1F08',
		is_trans: false,
		external_ids: {},
	},
	{
		id: 1011,
		name: 'Vintage Yellow',
		rgb: 'F3C305',
		is_trans: false,
		external_ids: {},
	},
	{
		id: 1012,
		name: 'Fabuland Orange',
		rgb: 'EF9121',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [160],
				ext_descrs: [['Fabuland Orange']],
			},
			LDraw: {
				ext_ids: [509],
				ext_descrs: [['Fabuland_Orange']],
			},
			LEGO: {
				ext_ids: [19],
				ext_descrs: [['Light Brown']],
			},
			BrickOwl: {
				ext_ids: [60],
				ext_descrs: [['Fabuland Orange']],
			},
		},
	},
	{
		id: 1013,
		name: 'Modulex White',
		rgb: 'F4F4F4',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [123],
				ext_descrs: [['Mx White']],
			},
			BrickOwl: {
				ext_ids: [154],
				ext_descrs: [['Modulex White']],
			},
		},
	},
	{
		id: 1014,
		name: 'Modulex Light Bluish Gray',
		rgb: 'AfB5C7',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [124],
				ext_descrs: [['Mx Light Bluish Gray']],
			},
			BrickOwl: {
				ext_ids: [28],
				ext_descrs: [['Modulex Medium Stone Gray']],
			},
		},
	},
	{
		id: 1015,
		name: 'Modulex Light Gray',
		rgb: '9C9C9C',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [125],
				ext_descrs: [['Mx Light Gray']],
			},
			BrickOwl: {
				ext_ids: [141],
				ext_descrs: [['Modulex Light Gray']],
			},
		},
	},
	{
		id: 1016,
		name: 'Modulex Charcoal Gray',
		rgb: '595D60',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [126],
				ext_descrs: [['Mx Charcoal Gray']],
			},
			BrickOwl: {
				ext_ids: [29],
				ext_descrs: [['Modulex Charcoal Gray']],
			},
		},
	},
	{
		id: 1017,
		name: 'Modulex Tile Gray',
		rgb: '6B5A5A',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [127],
				ext_descrs: [['Mx Tile Gray']],
			},
			BrickOwl: {
				ext_ids: [152],
				ext_descrs: [['Modulex Tile Gray']],
			},
		},
	},
	{
		id: 1018,
		name: 'Modulex Black',
		rgb: '4D4C52',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [128],
				ext_descrs: [['Mx Black']],
			},
			BrickOwl: {
				ext_ids: [136],
				ext_descrs: [['Modulex Black']],
			},
		},
	},
	{
		id: 1019,
		name: 'Modulex Tile Brown',
		rgb: '330000',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [131],
				ext_descrs: [['Mx Tile Brown']],
			},
			BrickOwl: {
				ext_ids: [151],
				ext_descrs: [['Modulex Tile Brown']],
			},
		},
	},
	{
		id: 1020,
		name: 'Modulex Terracotta',
		rgb: '5C5030',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [134],
				ext_descrs: [['Mx Terracotta']],
			},
			BrickOwl: {
				ext_ids: [150],
				ext_descrs: [['Modulex Terracotta']],
			},
		},
	},
	{
		id: 1021,
		name: 'Modulex Brown',
		rgb: '907450',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [132],
				ext_descrs: [['Mx Brown']],
			},
			BrickOwl: {
				ext_ids: [137],
				ext_descrs: [['Modulex Brown']],
			},
		},
	},
	{
		id: 1022,
		name: 'Modulex Buff',
		rgb: 'DEC69C',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [133],
				ext_descrs: [['Mx Buff']],
			},
			BrickOwl: {
				ext_ids: [138],
				ext_descrs: [['Modulex Buff']],
			},
		},
	},
	{
		id: 1023,
		name: 'Modulex Red',
		rgb: 'B52C20',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [129],
				ext_descrs: [['Mx Red']],
			},
			BrickOwl: {
				ext_ids: [148],
				ext_descrs: [['Modulex Red']],
			},
		},
	},
	{
		id: 1024,
		name: 'Modulex Pink Red',
		rgb: 'F45C40',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [130],
				ext_descrs: [['Mx Pink Red']],
			},
			BrickOwl: {
				ext_ids: [147],
				ext_descrs: [['Modulex Pink Red']],
			},
		},
	},
	{
		id: 1025,
		name: 'Modulex Orange',
		rgb: 'F47B30',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [135],
				ext_descrs: [['Mx Orange']],
			},
			BrickOwl: {
				ext_ids: [30],
				ext_descrs: [['Modulex Orange']],
			},
		},
	},
	{
		id: 1026,
		name: 'Modulex Light Orange',
		rgb: 'F7AD63',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [136],
				ext_descrs: [['Mx Light Orange']],
			},
			BrickOwl: {
				ext_ids: [142],
				ext_descrs: [['Modulex Light Orange']],
			},
		},
	},
	{
		id: 1027,
		name: 'Modulex Light Yellow',
		rgb: 'FFE371',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [137],
				ext_descrs: [['Mx Light Yellow']],
			},
			BrickOwl: {
				ext_ids: [143],
				ext_descrs: [['Modulex Light Yellow']],
			},
		},
	},
	{
		id: 1028,
		name: 'Modulex Ochre Yellow',
		rgb: 'FED557',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [138],
				ext_descrs: [['Mx Ochre Yellow']],
			},
			BrickOwl: {
				ext_ids: [31],
				ext_descrs: [['Modulex Ochre Yellow']],
			},
		},
	},
	{
		id: 1029,
		name: 'Modulex Lemon',
		rgb: 'BDC618',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [139],
				ext_descrs: [['Mx Lemon']],
			},
			BrickOwl: {
				ext_ids: [140],
				ext_descrs: [['Modulex Lemon']],
			},
		},
	},
	{
		id: 1030,
		name: 'Modulex Pastel Green',
		rgb: '7DB538',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [141],
				ext_descrs: [['Mx Pastel Green']],
			},
			BrickOwl: {
				ext_ids: [33],
				ext_descrs: [['Modulex Pastel Green']],
			},
		},
	},
	{
		id: 1031,
		name: 'Modulex Olive Green',
		rgb: '7C9051',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [140],
				ext_descrs: [['Mx Olive Green']],
			},
			BrickOwl: {
				ext_ids: [32],
				ext_descrs: [['Modulex Olive Green']],
			},
		},
	},
	{
		id: 1032,
		name: 'Modulex Aqua Green',
		rgb: '27867E',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [142],
				ext_descrs: [['Mx Aqua Green']],
			},
			BrickOwl: {
				ext_ids: [135],
				ext_descrs: [['Modulex Aqua Green']],
			},
		},
	},
	{
		id: 1033,
		name: 'Modulex Teal Blue',
		rgb: '467083',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [146],
				ext_descrs: [['Mx Teal Blue']],
			},
			BrickOwl: {
				ext_ids: [149],
				ext_descrs: [['Modulex Teal Blue']],
			},
		},
	},
	{
		id: 1034,
		name: 'Modulex Tile Blue',
		rgb: '0057A6',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [143],
				ext_descrs: [['Mx Tile Blue']],
			},
			BrickOwl: {
				ext_ids: [34],
				ext_descrs: [['Modulex Tile Blue']],
			},
		},
	},
	{
		id: 1035,
		name: 'Modulex Medium Blue',
		rgb: '61AFFF',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [144],
				ext_descrs: [['Mx Medium Blue']],
			},
			BrickOwl: {
				ext_ids: [144],
				ext_descrs: [['Modulex Medium Blue']],
			},
		},
	},
	{
		id: 1036,
		name: 'Modulex Pastel Blue',
		rgb: '68AECE',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [145],
				ext_descrs: [['Mx Pastel Blue']],
			},
			BrickOwl: {
				ext_ids: [145],
				ext_descrs: [['Modulex Pastel Blue']],
			},
		},
	},
	{
		id: 1037,
		name: 'Modulex Violet',
		rgb: 'BD7D85',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [147],
				ext_descrs: [['Mx Violet']],
			},
			BrickOwl: {
				ext_ids: [153],
				ext_descrs: [['Modulex Violet']],
			},
		},
	},
	{
		id: 1038,
		name: 'Modulex Pink',
		rgb: 'F785B1',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [148],
				ext_descrs: [['Mx Pink']],
			},
			BrickOwl: {
				ext_ids: [146],
				ext_descrs: [['Modulex Pink']],
			},
		},
	},
	{
		id: 1039,
		name: 'Modulex Clear',
		rgb: 'FFFFFF',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [149],
				ext_descrs: [['Mx Clear']],
			},
			BrickOwl: {
				ext_ids: [139],
				ext_descrs: [['Modulex Clear']],
			},
		},
	},
	{
		id: 1040,
		name: 'Modulex Foil Dark Gray',
		rgb: '595D60',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [210],
				ext_descrs: [['Mx Foil Dark Gray']],
			},
		},
	},
	{
		id: 1041,
		name: 'Modulex Foil Light Gray',
		rgb: '9C9C9C',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [211],
				ext_descrs: [['Mx Foil Light Gray']],
			},
		},
	},
	{
		id: 1042,
		name: 'Modulex Foil Dark Green',
		rgb: '006400',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [212],
				ext_descrs: [['Mx Foil Dark Green']],
			},
		},
	},
	{
		id: 1043,
		name: 'Modulex Foil Light Green',
		rgb: '7DB538',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [213],
				ext_descrs: [['Mx Foil Light Green']],
			},
		},
	},
	{
		id: 1044,
		name: 'Modulex Foil Dark Blue',
		rgb: '0057A6',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [214],
				ext_descrs: [['Mx Foil Dark Blue']],
			},
		},
	},
	{
		id: 1045,
		name: 'Modulex Foil Light Blue',
		rgb: '68AECE',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [215],
				ext_descrs: [['Mx Foil Light Blue']],
			},
		},
	},
	{
		id: 1046,
		name: 'Modulex Foil Violet',
		rgb: '4B0082',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [216],
				ext_descrs: [['Mx Foil Violet']],
			},
		},
	},
	{
		id: 1047,
		name: 'Modulex Foil Red',
		rgb: '8B0000',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [217],
				ext_descrs: [['Mx Foil Red']],
			},
		},
	},
	{
		id: 1048,
		name: 'Modulex Foil Yellow',
		rgb: 'FED557',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [218],
				ext_descrs: [['Mx Foil Yellow']],
			},
		},
	},
	{
		id: 1049,
		name: 'Modulex Foil Orange',
		rgb: 'F7AD63',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [219],
				ext_descrs: [['Mx Foil Orange']],
			},
		},
	},
	{
		id: 1050,
		name: 'Coral',
		rgb: 'FF698F',
		is_trans: false,
		external_ids: {
			BrickOwl: {
				ext_ids: [173],
				ext_descrs: [['Coral']],
			},
			BrickLink: {
				ext_ids: [220],
				ext_descrs: [['Coral']],
			},
			LDraw: {
				ext_ids: [353],
				ext_descrs: [['Coral']],
			},
			LEGO: {
				ext_ids: [353],
				ext_descrs: [['Coral', 'Vibrant Coral']],
			},
		},
	},
	{
		id: 1051,
		name: 'Pastel Blue',
		rgb: '5AC4DA',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [72],
				ext_descrs: [['Maersk Blue']],
			},
			LEGO: {
				ext_ids: [11],
				ext_descrs: [['Pastel Blue', 'PASTBLU']],
			},
			BrickOwl: {
				ext_ids: [71],
				ext_descrs: [['Maersk Blue']],
			},
		},
	},
	{
		id: 1052,
		name: 'Glitter Trans-Orange',
		rgb: 'F08F1C',
		is_trans: true,
		external_ids: {
			LDraw: {
				ext_ids: [341],
				ext_descrs: [['Glitter_Trans_Orange']],
			},
			BrickLink: {
				ext_ids: [222],
				ext_descrs: [['Glitter Trans-Orange']],
			},
			LEGO: {
				ext_ids: [341],
				ext_descrs: [['TR.BR:ORA W/GLI']],
			},
			BrickOwl: {
				ext_ids: [179],
				ext_descrs: [['Transparent Orange with Glitter']],
			},
		},
	},
	{
		id: 1053,
		name: 'Opal Trans-Light Blue',
		rgb: '68BCC5',
		is_trans: true,
		external_ids: {
			BrickLink: {
				ext_ids: [223],
				ext_descrs: [['Satin Trans-Light Blue']],
			},
			LDraw: {
				ext_ids: [362],
				ext_descrs: [['Opal_Trans_Light_Blue']],
			},
			BrickOwl: {
				ext_ids: [175],
				ext_descrs: [['Transparent Blue Opal']],
			},
			LEGO: {
				ext_ids: [362],
				ext_descrs: [['Transparent Blue Opal', 'TR.BLUE OPAL']],
			},
		},
	},
	{
		id: 1054,
		name: 'Opal Trans-Dark Pink',
		rgb: 'CE1D9B',
		is_trans: true,
		external_ids: {
			BrickLink: {
				ext_ids: [224],
				ext_descrs: [['Satin Trans-Dark Pink']],
			},
			LDraw: {
				ext_ids: [364],
				ext_descrs: [['Opal_Trans_Dark_Pink']],
			},
			BrickOwl: {
				ext_ids: [199],
				ext_descrs: [['Transparent Dark Pink Opal']],
			},
			LEGO: {
				ext_ids: [364],
				ext_descrs: [
					[
						'Transparent Medium Reddish Violet with Opalescence',
						'Tr.M.Violet Opa',
					],
				],
			},
		},
	},
	{
		id: 1055,
		name: 'Opal Trans-Clear',
		rgb: 'FCFCFC',
		is_trans: true,
		external_ids: {
			BrickLink: {
				ext_ids: [228],
				ext_descrs: [['Satin White']],
			},
			LEGO: {
				ext_ids: [360],
				ext_descrs: [['Transparent with Opalescence', 'Tr. Opalescence']],
			},
			LDraw: {
				ext_ids: [360],
				ext_descrs: [['Opal_Trans_Clear']],
			},
			BrickOwl: {
				ext_ids: [193],
				ext_descrs: [['Transparent Opal']],
			},
		},
	},
	{
		id: 1056,
		name: 'Opal Trans-Brown',
		rgb: '583927',
		is_trans: true,
		external_ids: {
			BrickLink: {
				ext_ids: [229],
				ext_descrs: [['Satin Trans-Black']],
			},
			BrickOwl: {
				ext_ids: [201],
				ext_descrs: [['Transparent Black Opal']],
			},
			LEGO: {
				ext_ids: [363],
				ext_descrs: [['Transparent Brown With Opalescence']],
			},
			LDraw: {
				ext_ids: [363],
				ext_descrs: [['Opal_Trans_Black']],
			},
		},
	},
	{
		id: 1057,
		name: 'Trans-Light Bright Green',
		rgb: 'C9E788',
		is_trans: true,
		external_ids: {
			BrickLink: {
				ext_ids: [226],
				ext_descrs: [['Trans-Light Bright Green']],
			},
			LEGO: {
				ext_ids: [227],
				ext_descrs: [['Transparent Bright Yellowish Green', 'TR. BR. YEL GR']],
			},
			BrickOwl: {
				ext_ids: [205],
				ext_descrs: [['Transparent Light Bright Green']],
			},
			LDraw: {
				ext_ids: [227],
				ext_descrs: [['Trans_Bright_Light_Green']],
			},
		},
	},
	{
		id: 1058,
		name: 'Trans-Light Green',
		rgb: '94E5AB',
		is_trans: true,
		external_ids: {
			BrickLink: {
				ext_ids: [221],
				ext_descrs: [['Trans-Light Green']],
			},
			LEGO: {
				ext_ids: [285],
				ext_descrs: [['Transparent Light Green']],
			},
			LDraw: {
				ext_ids: [285],
				ext_descrs: [['TranS_Light_Green']],
			},
			BrickOwl: {
				ext_ids: [191],
				ext_descrs: [['Transparent Light Green']],
			},
		},
	},
	{
		id: 1059,
		name: 'Opal Trans-Purple',
		rgb: '8320B7',
		is_trans: true,
		external_ids: {
			BrickOwl: {
				ext_ids: [203],
				ext_descrs: [['Transparent Purple Opal']],
			},
			BrickLink: {
				ext_ids: [230],
				ext_descrs: [['Satin Trans-Purple']],
			},
			LEGO: {
				ext_ids: [365],
				ext_descrs: [['Tr.Violet Opal']],
			},
			LDraw: {
				ext_ids: [365],
				ext_descrs: [['Opal_Trans_Purple']],
			},
		},
	},
	{
		id: 1060,
		name: 'Opal Trans-Bright Green',
		rgb: '84B68D',
		is_trans: true,
		external_ids: {
			BrickLink: {
				ext_ids: [233],
				ext_descrs: [['Satin Trans-Bright Green']],
			},
			BrickOwl: {
				ext_ids: [207],
				ext_descrs: [['Transparent Green Opal']],
			},
			LEGO: {
				ext_ids: [367],
				ext_descrs: [['Transparent Green With Opalescence']],
			},
		},
	},
	{
		id: 1061,
		name: 'Opal Trans-Dark Blue',
		rgb: '0020A0',
		is_trans: true,
		external_ids: {
			BrickLink: {
				ext_ids: [232],
				ext_descrs: [['Satin Trans-Dark Blue']],
			},
			BrickOwl: {
				ext_ids: [209],
				ext_descrs: [['Transparent Dark Blue Opal']],
			},
			LEGO: {
				ext_ids: [366],
				ext_descrs: [['Transparent Blue With Opalescence']],
			},
		},
	},
	{
		id: 1062,
		name: 'Vibrant Yellow',
		rgb: 'EBD800',
		is_trans: false,
		external_ids: {
			LDraw: {
				ext_ids: [368],
				ext_descrs: [['Vibrant_Yellow']],
			},
			LEGO: {
				ext_ids: [368],
				ext_descrs: [['Vibrant Yellow']],
			},
			BrickLink: {
				ext_ids: [236],
				ext_descrs: [['Neon Yellow']],
			},
			BrickOwl: {
				ext_ids: [211],
				ext_descrs: [['Vibrant Yellow']],
			},
		},
	},
	{
		id: 1063,
		name: 'Pearl Copper',
		rgb: 'B46A00',
		is_trans: false,
		external_ids: {
			LEGO: {
				ext_ids: [346],
				ext_descrs: [['Copper Metallic']],
			},
			BrickLink: {
				ext_ids: [249],
				ext_descrs: [['Reddish Copper']],
			},
			BrickOwl: {
				ext_ids: [227],
				ext_descrs: [['Reddish Copper']],
			},
		},
	},
	{
		id: 1064,
		name: 'Fabuland Red',
		rgb: 'FF8014',
		is_trans: false,
		external_ids: {
			LDraw: {
				ext_ids: [508],
				ext_descrs: [['Fabuland_Red']],
			},
			LEGO: {
				ext_ids: [13],
				ext_descrs: [['Red Orange']],
			},
		},
	},
	{
		id: 1065,
		name: 'Reddish Gold',
		rgb: 'AC8247',
		is_trans: false,
		external_ids: {
			LEGO: {
				ext_ids: [189],
				ext_descrs: [['Reddish Gold', 'Gold Metallic']],
			},
			BrickLink: {
				ext_ids: [235],
				ext_descrs: [['Reddish Gold']],
			},
			LDraw: {
				ext_ids: [189],
				ext_descrs: [['Reddish_Gold']],
			},
			BrickOwl: {
				ext_ids: [215],
				ext_descrs: [['Reddish Gold']],
			},
		},
	},
	{
		id: 1066,
		name: 'Curry',
		rgb: 'DD982E',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [161],
				ext_descrs: [['Dark Yellow']],
			},
			LEGO: {
				ext_ids: [180],
				ext_descrs: [['Curry']],
			},
			BrickOwl: {
				ext_ids: [169],
				ext_descrs: [['Curry']],
			},
		},
	},
	{
		id: 1067,
		name: 'Dark Nougat',
		rgb: 'AD6140',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [225],
				ext_descrs: [['Dark Nougat']],
			},
			LEGO: {
				ext_ids: [128],
				ext_descrs: [['Dark Nougat', 'DARK NOUGAT']],
			},
			LDraw: {
				ext_ids: [128],
				ext_descrs: [['Dark_Nougat']],
			},
			BrickOwl: {
				ext_ids: [160],
				ext_descrs: [['Dark Nougat']],
			},
		},
	},
	{
		id: 1068,
		name: 'Bright Reddish Orange',
		rgb: 'EE5434',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [231],
				ext_descrs: [['Dark Salmon']],
			},
			LEGO: {
				ext_ids: [123],
				ext_descrs: [['Bright Reddish Orange']],
			},
			BrickOwl: {
				ext_ids: [158],
				ext_descrs: [['Bright Reddish Orange']],
			},
		},
	},
	{
		id: 1069,
		name: 'Pearl Red',
		rgb: 'D60026',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [252],
				ext_descrs: [['Pearl Red']],
			},
			LEGO: {
				ext_ids: [184],
				ext_descrs: [['Metallic Bright Red', 'MET. BR. RED']],
			},
			LDraw: {
				ext_ids: [184],
				ext_descrs: [['Metallic_Bright_Red']],
			},
			BrickOwl: {
				ext_ids: [181],
				ext_descrs: [['Pearl Red']],
			},
		},
	},
	{
		id: 1070,
		name: 'Pearl Blue',
		rgb: '0059A3',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [254],
				ext_descrs: [['Pearl Blue']],
			},
			LEGO: {
				ext_ids: [185],
				ext_descrs: [['Metallic Bright Blue', 'MET. BR. BLUE']],
			},
			BrickOwl: {
				ext_ids: [189],
				ext_descrs: [['Pearl Blue']],
			},
			LDraw: {
				ext_ids: [185],
				ext_descrs: [['Metallic_Bright_Blue']],
			},
		},
	},
	{
		id: 1071,
		name: 'Pearl Green',
		rgb: '008E3C',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [253],
				ext_descrs: [['Pearl Green']],
			},
			LEGO: {
				ext_ids: [186],
				ext_descrs: [['Metallic Dark Green', 'MET. DK. GREEN']],
			},
			LDraw: {
				ext_ids: [186],
				ext_descrs: [['Metallic_Dark_Green']],
			},
			BrickOwl: {
				ext_ids: [183],
				ext_descrs: [['Pearl Green']],
			},
		},
	},
	{
		id: 1072,
		name: 'Pearl Brown',
		rgb: '57392C',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [255],
				ext_descrs: [['Pearl Brown']],
			},
			LEGO: {
				ext_ids: [187],
				ext_descrs: [['Metallic Earth Orange', 'MET. EAR.ORA']],
			},
			BrickOwl: {
				ext_ids: [219],
				ext_descrs: [['Pearl Brown']],
			},
		},
	},
	{
		id: 1073,
		name: 'Pearl Black',
		rgb: '0A1327',
		is_trans: false,
		external_ids: {
			LEGO: {
				ext_ids: [149],
				ext_descrs: [['Metallic Black', 'MET.BLACK']],
			},
			BrickOwl: {
				ext_ids: [185],
				ext_descrs: [['Pearl Black']],
			},
			BrickLink: {
				ext_ids: [244],
				ext_descrs: [['Pearl Black']],
			},
			LDraw: {
				ext_ids: [83],
				ext_descrs: [['Pearl_Black']],
			},
		},
	},
	{
		id: 1074,
		name: 'Duplo Blue',
		rgb: '009ECE',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [247],
				ext_descrs: [['Little Robots Blue']],
			},
			LEGO: {
				ext_ids: [188],
				ext_descrs: [['Tiny Blue']],
			},
		},
	},
	{
		id: 1075,
		name: 'Duplo Medium Blue',
		rgb: '3E95B6',
		is_trans: false,
		external_ids: {
			LEGO: {
				ext_ids: [269],
				ext_descrs: [['Tiny-Medium Blue']],
			},
		},
	},
	{
		id: 1076,
		name: 'Duplo Lime',
		rgb: 'FFF230',
		is_trans: false,
		external_ids: {
			LEGO: {
				ext_ids: [15],
				ext_descrs: [['Lemon']],
			},
			BrickOwl: {
				ext_ids: [67],
				ext_descrs: [['Light Lime']],
			},
		},
	},
	{
		id: 1077,
		name: 'Fabuland Lime',
		rgb: '78FC78',
		is_trans: false,
		external_ids: {
			LDraw: {
				ext_ids: [510],
				ext_descrs: [['Fabuland_Pastel_Green']],
			},
			LEGO: {
				ext_ids: [14],
				ext_descrs: [['Pastel Green']],
			},
			BrickLink: {
				ext_ids: [248],
				ext_descrs: [['Fabuland Lime']],
			},
		},
	},
	{
		id: 1078,
		name: 'Duplo Medium Green',
		rgb: '468A5F',
		is_trans: false,
		external_ids: {
			LEGO: {
				ext_ids: [210],
				ext_descrs: [['Faded Green']],
			},
		},
	},
	{
		id: 1079,
		name: 'Duplo Light Green',
		rgb: '60BA76',
		is_trans: false,
		external_ids: {
			LEGO: {
				ext_ids: [233],
				ext_descrs: [['Light Faded Green']],
			},
		},
	},
	{
		id: 1080,
		name: 'Light Tan',
		rgb: 'F3C988',
		is_trans: false,
		external_ids: {
			LEGO: {
				ext_ids: [224],
				ext_descrs: [['Light Brick Yellow']],
			},
		},
	},
	{
		id: 1081,
		name: 'Rust Orange',
		rgb: '872B17',
		is_trans: false,
		external_ids: {
			LEGO: {
				ext_ids: [216],
				ext_descrs: [['Rust']],
			},
			LDraw: {
				ext_ids: [216],
				ext_descrs: [['Rust']],
			},
			BrickOwl: {
				ext_ids: [83],
				ext_descrs: [['Rust']],
			},
		},
	},
	{
		id: 1082,
		name: 'Clikits Pink',
		rgb: 'FE78B0',
		is_trans: false,
		external_ids: {
			LDraw: {
				ext_ids: [295],
				ext_descrs: [['Flamingo_Pink']],
			},
			LEGO: {
				ext_ids: [295],
				ext_descrs: [['Flamingo Pink']],
			},
		},
	},
	{
		id: 1083,
		name: 'Two-tone Copper',
		rgb: '945148',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [273],
				ext_descrs: [['Bionicle Copper']],
			},
			LEGO: {
				ext_ids: [176],
				ext_descrs: [['Red Flip/Flop']],
			},
			BrickOwl: {
				ext_ids: [233],
				ext_descrs: [['Bionicle Copper']],
			},
		},
	},
	{
		id: 1084,
		name: 'Two-tone Gold',
		rgb: 'AB673A',
		is_trans: false,
		external_ids: {
			LEGO: {
				ext_ids: [178],
				ext_descrs: [['Yellow Flip/Flop']],
			},
			BrickLink: {
				ext_ids: [238],
				ext_descrs: [['Bionicle Gold']],
			},
			BrickOwl: {
				ext_ids: [231],
				ext_descrs: [['Bionicle Gold']],
			},
		},
	},
	{
		id: 1085,
		name: 'Two-tone Silver',
		rgb: '737271',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [239],
				ext_descrs: [['Bionicle Silver']],
			},
			LEGO: {
				ext_ids: [179],
				ext_descrs: [['Silver Flip/Flop']],
			},
			BrickOwl: {
				ext_ids: [229],
				ext_descrs: [['Bionicle Silver']],
			},
		},
	},
	{
		id: 1086,
		name: 'Pearl Lime',
		rgb: '6A7944',
		is_trans: false,
		external_ids: {
			LEGO: {
				ext_ids: [200],
				ext_descrs: [['Lemon Metallic']],
			},
			BrickOwl: {
				ext_ids: [125],
				ext_descrs: [['Metallic Green']],
			},
			LDraw: {
				ext_ids: [200],
				ext_descrs: [['Lemon_Metallic']],
			},
		},
	},
	{
		id: 1087,
		name: 'Duplo Pink',
		rgb: 'FF879C',
		is_trans: false,
		external_ids: {
			LEGO: {
				ext_ids: [16],
				ext_descrs: [['Pink']],
			},
		},
	},
	{
		id: 1088,
		name: 'Medium Brown',
		rgb: '755945',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [240],
				ext_descrs: [['Medium Brown']],
			},
			LEGO: {
				ext_ids: [370],
				ext_descrs: [['Medium Brown']],
			},
			LDraw: {
				ext_ids: [370],
				ext_descrs: [['Medium_Brown']],
			},
			BrickOwl: {
				ext_ids: [213],
				ext_descrs: [['Medium Brown']],
			},
		},
	},
	{
		id: 1089,
		name: 'Warm Tan',
		rgb: 'CCA373',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [241],
				ext_descrs: [['Medium Tan']],
			},
			BrickOwl: {
				ext_ids: [217],
				ext_descrs: [['Warm Tan']],
			},
			LEGO: {
				ext_ids: [371],
				ext_descrs: [['Warm Tan']],
			},
			LDraw: {
				ext_ids: [371],
				ext_descrs: [['Medium_Tan']],
			},
		},
	},
	{
		id: 1090,
		name: 'Duplo Turquoise',
		rgb: '3FB69E',
		is_trans: false,
		external_ids: {},
	},
	{
		id: 1091,
		name: 'Warm Yellowish Orange',
		rgb: 'FFCB78',
		is_trans: false,
		external_ids: {
			LEGO: {
				ext_ids: [225],
				ext_descrs: [['Warm Yellowish Orange']],
			},
			BrickOwl: {
				ext_ids: [8],
				ext_descrs: [['Light Orange']],
			},
			BrickLink: {
				ext_ids: [172],
				ext_descrs: [['Warm Yellowish Orange']],
			},
		},
	},
	{
		id: 1092,
		name: 'Metallic Copper',
		rgb: '764D3B',
		is_trans: false,
		external_ids: {
			LEGO: {
				ext_ids: [300, 334],
				ext_descrs: [['COPPER, DR.LA.'], ['COPPER INK']],
			},
			BrickLink: {
				ext_ids: [250],
				ext_descrs: [['Metallic Copper']],
			},
			BrickOwl: {
				ext_ids: [225],
				ext_descrs: [['Metallic Copper']],
			},
			LDraw: {
				ext_ids: [300],
				ext_descrs: [['Metallic_Copper']],
			},
		},
	},
	{
		id: 1093,
		name: 'Light Lilac',
		rgb: '9195CA',
		is_trans: false,
		external_ids: {
			LEGO: {
				ext_ids: [220],
				ext_descrs: [['Light Lilac']],
			},
			BrickLink: {
				ext_ids: [246],
				ext_descrs: [['Light Lilac']],
			},
			BrickOwl: {
				ext_ids: [16],
				ext_descrs: [['Light Violet']],
			},
		},
	},
	{
		id: 1094,
		name: 'Trans-Medium Purple',
		rgb: '8D73B3',
		is_trans: false,
		external_ids: {
			LEGO: {
				ext_ids: [236],
				ext_descrs: [['Transparent Bright Reddish Lilac']],
			},
			BrickLink: {
				ext_ids: [234],
				ext_descrs: [['Trans-Medium Purple']],
			},
			BrickOwl: {
				ext_ids: [107],
				ext_descrs: [['Transparent Purple']],
			},
		},
	},
	{
		id: 1095,
		name: 'Trans-Black',
		rgb: '635F52',
		is_trans: true,
		external_ids: {
			LDraw: {
				ext_ids: [10375],
				ext_descrs: [['Trans_Black']],
			},
			LEGO: {
				ext_ids: [375],
				ext_descrs: [['Tr. Black']],
			},
			BrickLink: {
				ext_ids: [251],
				ext_descrs: [['Trans-Black (2023)']],
			},
			BrickOwl: {
				ext_ids: [235],
				ext_descrs: [['Transparent Black (New)']],
			},
		},
	},
	{
		id: 1096,
		name: 'Glitter Trans-Bright Green',
		rgb: 'D9E4A7',
		is_trans: true,
		external_ids: {
			LEGO: {
				ext_ids: [351],
				ext_descrs: [['Transparent Bright Green w/ Glitter']],
			},
		},
	},
	{
		id: 1097,
		name: 'Glitter Trans-Medium Purple',
		rgb: '8D73B3',
		is_trans: true,
		external_ids: {
			LEGO: {
				ext_ids: [303],
				ext_descrs: [['Trans Br Reddish Lilac w/ Glitter']],
			},
		},
	},
	{
		id: 1098,
		name: 'Glitter Trans-Green',
		rgb: '84B68D',
		is_trans: true,
		external_ids: {
			LEGO: {
				ext_ids: [155, 175],
				ext_descrs: [
					['Transparent Green with Glitter'],
					['Transparent Green with Glitter'],
				],
			},
		},
	},
	{
		id: 1099,
		name: 'Glitter Trans-Pink',
		rgb: 'E4ADC8',
		is_trans: true,
		external_ids: {
			LEGO: {
				ext_ids: [301],
				ext_descrs: [['Trans Bright Purple w/ Glitter']],
			},
		},
	},
	{
		id: 1100,
		name: 'Clikits Yellow',
		rgb: 'FFCF0B',
		is_trans: false,
		external_ids: {
			LEGO: {
				ext_ids: [190],
				ext_descrs: [['Fire Yellow']],
			},
			BrickOwl: {
				ext_ids: [93],
				ext_descrs: [['Yellow']],
			},
		},
	},
	{
		id: 1101,
		name: 'Duplo Dark Purple',
		rgb: '5F27AA',
		is_trans: false,
		external_ids: {
			LEGO: {
				ext_ids: [197],
				ext_descrs: [['Bright Lilac']],
			},
		},
	},
	{
		id: 1102,
		name: 'Trans-Neon Red',
		rgb: 'FF0040',
		is_trans: true,
		external_ids: {
			LEGO: {
				ext_ids: [158],
				ext_descrs: [['Transparent Fluorescent Red']],
			},
			LDraw: {
				ext_ids: [158],
				ext_descrs: [['Trans_Neon_Red']],
			},
		},
	},
	{
		id: 1103,
		name: 'Pearl Titanium',
		rgb: '3E3C39',
		is_trans: false,
		external_ids: {
			LEGO: {
				ext_ids: [316],
				ext_descrs: [['Titanium Metallic', 'TITAN. METAL.']],
			},
			LDraw: {
				ext_ids: [87],
				ext_descrs: [['Metallic_Dark_Gray']],
			},
			BrickOwl: {
				ext_ids: [119],
				ext_descrs: [['Pearl Dark Gray']],
			},
			BrickLink: {
				ext_ids: [77],
				ext_descrs: [['Pearl Dark Gray']],
			},
		},
	},
	{
		id: 1104,
		name: 'HO Aqua',
		rgb: 'B3D7D1',
		is_trans: false,
		external_ids: {},
	},
	{
		id: 1105,
		name: 'HO Azure',
		rgb: '1591cb',
		is_trans: false,
		external_ids: {},
	},
	{
		id: 1106,
		name: 'HO Blue-gray',
		rgb: '354e5a',
		is_trans: false,
		external_ids: {},
	},
	{
		id: 1107,
		name: 'HO Cyan',
		rgb: '5b98b3',
		is_trans: false,
		external_ids: {},
	},
	{
		id: 1108,
		name: 'HO Dark Aqua',
		rgb: 'a7dccf',
		is_trans: false,
		external_ids: {},
	},
	{
		id: 1109,
		name: 'HO Dark Blue',
		rgb: '0A3463',
		is_trans: false,
		external_ids: {},
	},
	{
		id: 1110,
		name: 'HO Dark Gray',
		rgb: '6D6E5C',
		is_trans: false,
		external_ids: {},
	},
	{
		id: 1111,
		name: 'HO Dark Green',
		rgb: '184632',
		is_trans: false,
		external_ids: {},
	},
	{
		id: 1112,
		name: 'HO Dark Lime',
		rgb: 'b2b955',
		is_trans: false,
		external_ids: {},
	},
	{
		id: 1113,
		name: 'HO Dark Red',
		rgb: '631314',
		is_trans: false,
		external_ids: {},
	},
	{
		id: 1114,
		name: 'HO Dark Sand Green',
		rgb: '627a62',
		is_trans: false,
		external_ids: {},
	},
	{
		id: 1115,
		name: 'HO Dark Turquoise',
		rgb: '10929d',
		is_trans: false,
		external_ids: {},
	},
	{
		id: 1116,
		name: 'HO Earth Orange',
		rgb: 'bb771b',
		is_trans: false,
		external_ids: {},
	},
	{
		id: 1117,
		name: 'HO Gold',
		rgb: 'b4a774',
		is_trans: false,
		external_ids: {},
	},
	{
		id: 1118,
		name: 'HO Light Aqua',
		rgb: 'a3d1c0',
		is_trans: false,
		external_ids: {},
	},
	{
		id: 1119,
		name: 'HO Light Brown',
		rgb: '965336',
		is_trans: false,
		external_ids: {},
	},
	{
		id: 1120,
		name: 'HO Light Gold',
		rgb: 'cdc298',
		is_trans: false,
		external_ids: {},
	},
	{
		id: 1121,
		name: 'HO Light Tan',
		rgb: 'f9f1c7',
		is_trans: false,
		external_ids: {},
	},
	{
		id: 1122,
		name: 'HO Light Yellow',
		rgb: 'f5fab7',
		is_trans: false,
		external_ids: {},
	},
	{
		id: 1123,
		name: 'HO Medium Blue',
		rgb: '7396c8',
		is_trans: false,
		external_ids: {},
	},
	{
		id: 1124,
		name: 'HO Medium Red',
		rgb: 'c01111',
		is_trans: false,
		external_ids: {},
	},
	{
		id: 1125,
		name: 'HO Metallic Blue',
		rgb: '0d4763',
		is_trans: false,
		external_ids: {},
	},
	{
		id: 1126,
		name: 'HO Metallic Dark Gray',
		rgb: '5e5e5e',
		is_trans: false,
		external_ids: {},
	},
	{
		id: 1127,
		name: 'HO Metallic Green',
		rgb: '879867',
		is_trans: false,
		external_ids: {},
	},
	{
		id: 1128,
		name: 'HO Metallic Sand Blue',
		rgb: '5f7d8c',
		is_trans: false,
		external_ids: {},
	},
	{
		id: 1129,
		name: 'HO Olive Green',
		rgb: '9B9A5A',
		is_trans: false,
		external_ids: {},
	},
	{
		id: 1130,
		name: 'HO Rose',
		rgb: 'd06262',
		is_trans: false,
		external_ids: {},
	},
	{
		id: 1131,
		name: 'HO Sand Blue',
		rgb: '6e8aa6',
		is_trans: false,
		external_ids: {},
	},
	{
		id: 1132,
		name: 'HO Sand Green',
		rgb: 'A0BCAC',
		is_trans: false,
		external_ids: {},
	},
	{
		id: 1133,
		name: 'HO Tan',
		rgb: 'E4CD9E',
		is_trans: false,
		external_ids: {},
	},
	{
		id: 1134,
		name: 'HO Titanium',
		rgb: '616161',
		is_trans: false,
		external_ids: {},
	},
	{
		id: 1135,
		name: 'Metal',
		rgb: 'A5ADB4',
		is_trans: false,
		external_ids: {},
	},
	{
		id: 1136,
		name: 'Reddish Orange',
		rgb: 'CA4C0B',
		is_trans: false,
		external_ids: {
			LDraw: {
				ext_ids: [402],
				ext_descrs: [['Reddish_Orange']],
			},
			LEGO: {
				ext_ids: [402],
				ext_descrs: [['Red. Orange']],
			},
			BrickLink: {
				ext_ids: [167],
				ext_descrs: [['Reddish Orange']],
			},
			BrickOwl: {
				ext_ids: [241],
				ext_descrs: [['Reddish Orange']],
			},
		},
	},
	{
		id: 1137,
		name: 'Sienna Brown',
		rgb: '915C3C',
		is_trans: false,
		external_ids: {
			LDraw: {
				ext_ids: [422],
				ext_descrs: [['Sienna_Brown']],
			},
			BrickOwl: {
				ext_ids: [245],
				ext_descrs: [['Sienna Brown']],
			},
			BrickLink: {
				ext_ids: [169],
				ext_descrs: [['Sienna']],
			},
			LEGO: {
				ext_ids: [422],
				ext_descrs: [['Sienna Brown']],
			},
		},
	},
	{
		id: 1138,
		name: 'Umber Brown',
		rgb: '5E3F33',
		is_trans: false,
		external_ids: {
			LDraw: {
				ext_ids: [423],
				ext_descrs: [['Umber_Brown']],
			},
			BrickLink: {
				ext_ids: [168],
				ext_descrs: [['Umber']],
			},
			BrickOwl: {
				ext_ids: [243],
				ext_descrs: [['Umber Brown']],
			},
			LEGO: {
				ext_ids: [423],
				ext_descrs: [['Umber Brown']],
			},
		},
	},
	{
		id: 1139,
		name: 'Opal Trans-Yellow',
		rgb: 'F5CD2F',
		is_trans: true,
		external_ids: {
			BrickLink: {
				ext_ids: [170],
				ext_descrs: [['Satin Trans-Yellow']],
			},
			BrickOwl: {
				ext_ids: [247],
				ext_descrs: [['Transparent Yellow Opal']],
			},
			LEGO: {
				ext_ids: [376],
				ext_descrs: [['Tr. Yellow Opal']],
			},
		},
	},
	{
		id: 1140,
		name: 'Neon Orange',
		rgb: 'EC4612',
		is_trans: false,
		external_ids: {
			LEGO: {
				ext_ids: [133],
				ext_descrs: [['Neon Orange']],
			},
			BrickLink: {
				ext_ids: [165],
				ext_descrs: [['Neon Orange']],
			},
		},
	},
	{
		id: 1141,
		name: 'Neon Green',
		rgb: 'D2FC43',
		is_trans: false,
		external_ids: {
			LEGO: {
				ext_ids: [134],
				ext_descrs: [['Neon Green']],
			},
			BrickLink: {
				ext_ids: [166],
				ext_descrs: [['Neon Green']],
			},
		},
	},
	{
		id: 1142,
		name: 'Dark Olive Green',
		rgb: '5d5c36',
		is_trans: false,
		external_ids: {
			LEGO: {
				ext_ids: [144],
				ext_descrs: [['Dark Army Green']],
			},
			BrickLink: {
				ext_ids: [242],
				ext_descrs: [['Dark Olive Green']],
			},
		},
	},
	{
		id: 1143,
		name: 'Glitter Milky White',
		rgb: 'FFFFFF',
		is_trans: false,
		external_ids: {
			LEGO: {
				ext_ids: [122],
				ext_descrs: [['Nature with Glitter']],
			},
		},
	},
	{
		id: 1144,
		name: 'Chrome Red',
		rgb: 'CE3021',
		is_trans: false,
		external_ids: {},
	},
	{
		id: 1145,
		name: 'Ochre Yellow',
		rgb: 'DD9E47',
		is_trans: false,
		external_ids: {},
	},
	{
		id: 9999,
		name: '[No Color/Any Color]',
		rgb: '05131D',
		is_trans: false,
		external_ids: {
			BrickLink: {
				ext_ids: [0],
				ext_descrs: [['(Not Applicable)']],
			},
		},
	},
];
