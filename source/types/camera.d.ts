declare module 'camera' {
	import {Readable} from 'stream';

	interface CameraStream extends Readable {
		snapshot(callback: (error: Error | null, data?: Buffer) => void): void;
		record(duration: number, callback: (frames: Buffer[]) => void): void;
	}

	interface Camera {
		createStream(idx?: number): CameraStream;
	}

	const camera: Camera;
	export = camera;
}
