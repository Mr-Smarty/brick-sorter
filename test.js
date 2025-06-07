// import {recognizePart, getBestMatch} from './dist/utils/brickognizeApi.js';
// import fs from 'fs';

// // Test just the API with an existing image
// async function testAPIOnly(imagePath) {
// 	if (!fs.existsSync(imagePath)) {
// 		console.error('Image file not found:', imagePath);
// 		return;
// 	}

// 	try {
// 		console.log('Testing API with existing image:', imagePath);
// 		const results = await recognizePart(imagePath);

// 		console.log('Raw API Response:');
// 		console.log(JSON.stringify(results, null, 2));

// 		const bestMatch = getBestMatch(results); // Very low threshold for testing

// 		if (bestMatch) {
// 			console.log('\nBest Match:');
// 			console.log(`Part: ${bestMatch.partNumber}`);
// 			console.log(`Name: ${bestMatch.name}`);
// 			console.log(`Score: ${bestMatch.score}`);
// 		} else {
// 			console.log('No matches found');
// 		}
// 	} catch (error) {
// 		console.error('API test failed:', error);
// 	}
// }

// // Run test
// const imagePath = 'test.jpg';
// testAPIOnly(imagePath);

import fs from 'fs';
import {captureImage} from './dist/utils/camera.js';
captureImage().then(image => {
	console.log('Image captured successfully');
	// You can save the image or process it further
	// For example, to save it to a file:
	fs.writeFileSync('captured_image.png', image);
	console.log('Image saved as captured_image.png');
});
