const path = require('path');
const fs = require('fs');

const styleDir = __dirname + '/styles';
const distDir = __dirname + '/project-dist';

const mergeBufferedStyles = (bufferedStyles) => bufferedStyles.reduce((res, css) => res += (css + '\n'),'');
const getStyleNamesFrom = async (dir) => {
  return new Promise((resolve) => {
    fs.readdir(dir, {withFileTypes: true},(err, stat) => {
      if(err) throw err;
      const styleNames = stat.reduce((res, file) => {
        return file.isFile() && path.parse(file.name).ext === '.css' ? res.concat(file.name) : res;
      },[]);
      console.log('found styles: ' + styleNames.join(' , '));
      resolve(styleNames);
    });
  });
};
const createPromiseStreamStyle = (styleName, from) => {
  return new Promise((resolve) => {
    const readStream = fs.createReadStream(path.join(from, styleName), 'utf-8');
    let readedData = '';
    readStream.on('data', (chunk) => readedData += chunk);
    readStream.on('end', () => {
      console.log('\t' + styleName + ' copied in buffer');
      resolve(readedData);
    });
  });
};

const mergeStyles = async (from, to) => {
  const mergedStyleName = 'bundle.css';
  const totalPath = to + '/' + mergedStyleName;
  const styleNames = await getStyleNamesFrom(from);
  const bufferedStyles = await Promise.all(styleNames.map((styleName) => createPromiseStreamStyle(styleName, from)));
  const mergedStyles = mergeBufferedStyles(bufferedStyles);
  fs.writeFile(totalPath, mergedStyles, (err) => {
    if(err) throw err;
    console.log(`All styles from\n **${from}**\nmerged into "${mergedStyleName}" in\n **${to}**`);
  });
};

mergeStyles(styleDir, distDir);