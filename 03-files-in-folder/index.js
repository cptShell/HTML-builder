const path = require('path');
const fs = require('fs');
const secretfolderPath = path.join(__dirname, 'secret-folder');

const getFilesFrom = (path) => {
  const callback = (resolve) => {
    const readdirOptions = { withFileTypes: true };
    const encodingCallback = (error, data) => {
      if (error) throw error;
      const result = data.reduce((res, file) => {
        return file.isDirectory() ? res : res.concat(file);
      }, []);
      resolve(result);
    };
    fs.readdir(path, readdirOptions, encodingCallback);
  };
  return new Promise(callback);
};
const getFileStats = (files) => {
  const fullfilledCallback = (result) => result.join('\n');
  const getStat = (file) => {
    const callback = (resolve) => {
      const filePath = path.join(secretfolderPath, file.name);
      const statCallback = (error, stats) => {
        if (error) throw error;
        const { name, ext } = path.parse(file.name);
        const kbSize = (stats.size / 1024).toFixed(3);
        resolve(`${name} - ${ext} - ${kbSize}KB`);
      };
      fs.stat(filePath, statCallback);
    };
    return new Promise(callback);
  };
  return Promise.all(files.map(getStat)).then(fullfilledCallback);
};

(async () => {
  const files = await getFilesFrom(secretfolderPath);
  const stats = await getFileStats(files);
  console.log(stats);
})();