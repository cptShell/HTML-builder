const fs = require('fs');
const path = require('path');

const textPath = path.join(__dirname, 'text.txt');
const txt = fs.createReadStream(textPath);
const handleChunk = (chunk) => console.log('read data:\n' + chunk);
txt.on('data', handleChunk);