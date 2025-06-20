import {config} from 'dotenv';
config({path: new URL('../../.env', import.meta.url)});
const CAMERA_TYPE = process.env['CAMERA_TYPE'];
const CAMERA_INDEX = parseInt(process.env['CAMERA_INDEX'] || '');

let NodeWebcam: typeof import('node-webcam');
let camera: typeof import('camera');

// Dynamically import camera modules based on availability
try {
	NodeWebcam = (await import('node-webcam')).default;
} catch {
	// Physical camera not available
}

try {
	camera = (await import('camera')).default;
} catch {
	// OpenCV camera not available
}

/**
 * Captures an image using the available camera module
 * @returns Promise with captured image as a Buffer
 * @throws Error if no camera module is available or if capture fails
 */
export async function captureImage(): Promise<Buffer> {
	if (CAMERA_TYPE === 'physical' && NodeWebcam) {
		return captureWithPhysical();
	} else if (CAMERA_TYPE === 'opencv' && camera) {
		return captureWithOpenCV();
	} else {
		throw new Error(
			`Camera type "${CAMERA_TYPE}" not available. Check your installation and .env file.`,
		);
	}
}

async function captureWithPhysical(): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		let device: string | false = false;

		if (CAMERA_INDEX !== undefined && !isNaN(CAMERA_INDEX)) {
			NodeWebcam.list(cams => {
				device = cams[CAMERA_INDEX] || false;
				captureWithDevice();
			});
		} else {
			captureWithDevice();
		}

		function captureWithDevice() {
			NodeWebcam.capture(
				null,
				{
					output: 'png',
					callbackReturn: 'buffer',
					device: device,
				},
				(error: Error | null, data: string | Buffer) => {
					if (error) {
						reject(new Error(`Failed to capture image: ${error.message}`));
					} else if (data) {
						resolve(Buffer.isBuffer(data) ? data : Buffer.from(data));
					}
				},
			);
		}
	});
}

async function captureWithOpenCV(): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		const webcam = camera.createStream(CAMERA_INDEX || undefined);

		webcam.on('error', (error: Error) => {
			reject(new Error(`Failed to capture image: ${error.message}`));
		});

		webcam.snapshot((error: Error | null, data?: Buffer) => {
			if (error) {
				reject(new Error(`Failed to capture image: ${error.message}`));
			} else if (data) {
				resolve(data);
			}
		});
	});
}
