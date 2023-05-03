const path = require('path');
const fs = require('fs');

const findDirectory = (data) => {
  const dir = data.find(elem => elem.isDirectory());
  return dir ? dir.name : undefined;
};
const findDirectories = (data) => {
  const dirs = data.reduce((res, elem) => {
    return elem.isDirectory() ? res.concat(elem.name) : res; 
  }, []);
  return dirs.length ? dirs : undefined;
};
const findFolderIn = (path, isMultiple) => {
  return new Promise((resolve) => {
    fs.readdir(path, { withFileTypes: true }, (err, data) => {
      if(err) throw err;
      const result = isMultiple ? findDirectories(data) : findDirectory(data);
      resolve(result);
    });
  });
};
const getFilesFrom = (path) => {
  return new Promise((resolve) => {
    fs.readdir(path, { withFileTypes: true }, (err, data) => {
      if(err) throw err;
      const result = data.reduce((res, file) => res.concat(file), []);
      resolve(result);
    });
  });
};
const copyFile = (from, to, file) => {
  const totalPathFrom = from + '/' + file;
  const totalPathTo = to + '/' + file;
  return new Promise((resolve) => {
    fs.copyFile(totalPathFrom, totalPathTo, (err) => {
      if (err) throw err;
      console.log('\t' + file + ': copied!');
      resolve();
    });
  });
};
const makeDirCopy = (dirPath) => {
  return new Promise((resolve) => {
    fs.mkdir(dirPath, { recursive: true }, (err) => {
      if (err) throw err;
      console.log(`create **${path.parse(dirPath).name}** directory`);
      resolve();
    });
  });
};
const copyFromTo = async (pathFrom, pathTo) => {
  const filesInFolder = await getFilesFrom(pathFrom);
  const dirTo = path.parse(pathTo).name;
  const dirFrom = path.parse(pathFrom).name;
  await makeDirCopy(pathTo);
  await Promise.all(filesInFolder.map((file) => {
    return !file.isDirectory() ? 
      copyFile(pathFrom, pathTo, file.name) : 
      makeDirCopy(path.join(pathTo, file.name));
  })).then(() => console.log(`All files and directories from **${dirFrom}** copied to **${dirTo}**`));
  const folders = await findFolderIn(pathFrom, true);
  if(folders) {
    await Promise.all(folders.map(folder => {
      return copyFromTo(path.join(pathFrom, folder), path.join(pathTo, folder)); 
    }));
  }
};

(async () => {
  try {
    const folder = await findFolderIn(__dirname, false);
    if(!folder) throw new Error('folder to copy not found');
    const folderFrom = path.join(__dirname, folder);
    const folderTo = folderFrom + '-copy';
    await fs.promises.rm(folderTo, { recursive: true, force: true });
    await copyFromTo(folderFrom, folderTo);
    console.log('______COPYING IS COMPLETE______');
  } catch(error) {
    console.error('something went wrong: ' + error.message);
  }
})();

