import NodeWebcam from 'node-webcam';

// var opts = {
// 	width: 1920,
// 	height: 1080,
// 	output: 'jpeg',
// 	callbackReturn: 'location',
// 	frames: 1,
// 	saveShots: true,
// };

// var Webcam = NodeWebcam.create(opts);

// Webcam.list(function (list) {
// 	//Use another device

// 	console.log('Available devices:', list);
// });

// NodeWebcam.capture('my_picture', {}, function (err, data) {
// 	if (!err) console.log('Image created!');
// });

import fs from 'fs';
import camera from 'camera';

const webcam = camera.createStream();

webcam.on('error', err => {
	console.log('error reading data', err);
});

webcam.on('data', buffer => {
	fs.writeFileSync('cam.png', buffer);
	webcam.destroy();
});
