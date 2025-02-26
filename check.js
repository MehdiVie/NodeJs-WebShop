const fs = require('fs');
const path = require('path');

const uploadPath = 'C:\\test';
const filename = 'test-file.txt';

// Ensure directory exists
try {
  fs.mkdirSync(uploadPath, { recursive: true });
  console.log('Directory exists or created successfully.');
} catch (err) {
  console.log('Error creating directory:', err);
}

// Write a test file
try {
  fs.writeFileSync(path.join(uploadPath, filename), 'Hello, world!');
  console.log('File written successfully!');
} catch (err) {
  console.log('Error writing file:', err);
}
