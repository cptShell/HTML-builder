const path = require('path');
const fs = require('fs');

const findDirectory = (data) => {
  const dir = data.find(elem => elem.isDirectory());
  return dir ? dir.name : undefined;
};
const findDirectories = (data) => {
  const dirs = data.reduce((res, elem) => {
    return elem.isDirectory() ? res.concat(elem.name) : res; 
  },[]);
  return dirs.length ? dirs : undefined;
};
const findFolderIn = (path, isMultiple) => {
  return new Promise(resolve => {
    fs.readdir(path, {withFileTypes: true}, (err, data) => {
      if (err) throw err;
      const result = isMultiple ? findDirectories(data) : findDirectory(data);
      resolve(result);
    });
  });
};
const getFilesFrom = (path, isDirent = true) => {
  return new Promise(resolve => {
    fs.readdir(path, {withFileTypes: isDirent}, (err, data) => {
      if (err) throw err;
      const result = data.reduce((res, file) => res.concat(file), []);
      resolve(result);
    });
  });
};
const getDataFrom = async (filePath) => {
  return new Promise((resolve) => {
    fs.readFile(filePath, 'utf-8', (err, data) => {
      if (err) throw err;
      resolve(data);
    });
  });
};
const copyFile = (from, to, file) => {
  const totalPathFrom = from + '/' + file;
  const totalPathTo = to + '/' + file;
  return new Promise(resolve => {
    fs.copyFile(totalPathFrom, totalPathTo, (err) => {
      if (err) throw err;
      console.log('\t' + file + ': copied!');
      resolve();
    });
  });
};
const createDir = (dirPath) => {
  return new Promise(resolve => {
    fs.mkdir(dirPath, { recursive: true }, (err) => {
      if (err) throw err;
      console.log(`\tcreate **${path.parse(dirPath).name}** directory`);
      resolve();
    });
  });
};
const createFile = (path, data, message) => {
  return new Promise(resolve => {
    fs.writeFile(path, data, (err) => {
      if (err) throw err;
      if (message) console.log(message);
      resolve();
    });
  });
};
const copyFromTo = async (pathFrom, pathTo) => {
  const filesInFolder = await getFilesFrom(pathFrom);
  const dirTo = path.parse(pathTo).name;
  const dirFrom = path.parse(pathFrom).name;
  await createDir(pathTo);
  await Promise.all(filesInFolder.map(file => {
    return !file.isDirectory() ? 
      copyFile(pathFrom, pathTo, file.name) : 
      createDir(path.join(pathTo, file.name));
  })).then(() => console.log(`All files and directories from **${dirFrom}** copied to **${dirTo}**`));
  const folders = await findFolderIn(pathFrom, true);
  if(folders) {
    await Promise.all(folders.map(folder => {
      return copyFromTo(path.join(pathFrom, folder), path.join(pathTo, folder)); 
    }));
  }
};
const copyAssets = async (assetsDirName, distName) => {
  const folderFrom = path.join(__dirname, assetsDirName);
  const folderTo = path.join(__dirname, distName, assetsDirName);
  await copyFromTo(folderFrom, folderTo);
};
const mergeBufferedStyles = (bufferedStyles) => bufferedStyles.reduce((res, css) => res += (css + '\n'),'');
const getStyleNamesFrom = async (dir) => {
  return new Promise(resolve => {
    fs.readdir(dir, {withFileTypes: true}, (err, stat) => {
      if (err) throw err;
      const styleNames = stat.reduce((res, file) => {
        return file.isFile() && path.parse(file.name).ext === '.css' ? res.concat(file.name) : res;
      },[]);
      console.log('found styles: ' + styleNames.join(' , '));
      resolve(styleNames);
    });
  });
};
const createPromiseStream = (fileName, from) => {
  return new Promise(resolve => {
    const readStream = fs.createReadStream(path.join(from, fileName), 'utf-8');
    let readedData = '';
    readStream.on('data', (chunk) => readedData += chunk);
    readStream.on('end', () => {
      console.log('\t' + fileName + ' copied in buffer');
      resolve(readedData);
    });
  });
};
const getComponent = (component, from) => {
  return new Promise((resolve) => {
    const readStream = fs.createReadStream(path.join(from, component), 'utf-8');
    let readedData = '';
    readStream.on('data', (chunk) => readedData += chunk);
    readStream.on('end', () => {
      const name = path.parse(component).name;
      resolve({[name]: readedData});
    });
  });
};
const mergeStyles = async(from, to, name) => {
  const totalPath = path.join(to, name);
  const styleNames = await getStyleNamesFrom(from);
  const bufferedStyles = await Promise.all(styleNames.map((styleName) => createPromiseStream(styleName, from)));
  const mergedStyles = mergeBufferedStyles(bufferedStyles);
  const message = `All styles from **${path.parse(from).base}** merged into "${name}" in **${path.parse(to).base}**`;
  await createFile(totalPath, mergedStyles, message);
};
const createTemplate = async (componentsPath, distPath, tempName, outputName) => {
  const nameList = await getFilesFrom(componentsPath, false);
  console.log('Found components in ' + componentsPath + ':\n\t' + nameList.join('\n\t'));

  const promiseList = nameList.map((componentName) => getComponent(componentName, componentsPath));
  const components = await Promise.all(promiseList).then(result => Object.assign({}, ...result));
  const templateHTML = await getDataFrom(path.join(__dirname, tempName));
  const buildedHTML = Object.keys(components).reduce((template, key) => template.replace(`{{${key}}}`, components[key]), templateHTML);
  const message = `${outputName} created`;
  await createFile(path.join(distPath, outputName), buildedHTML, message);
};

const npmRunBuild = async () => {
  try {
    let start = Date.now();
    const distDirName = 'project-dist';
    const stylesDirName = 'styles';
    const componentsDirName = 'components';
    const outputStyleName = 'style.css';
    const inputTemplateName = 'template.html';
    const outputTemplateName = 'index.html';
    const distDirPath = path.join(__dirname, distDirName);
    const inputStylePath = path.join(__dirname, stylesDirName);
    const componentsPath = path.join(__dirname, componentsDirName);

    await createDir(distDirPath);
    await copyAssets('assets', distDirName);
    await mergeStyles(inputStylePath, distDirPath, outputStyleName);
    await createTemplate(componentsPath, distDirPath, inputTemplateName, outputTemplateName);
    let end = Date.now();
    console.log(`______COMPLETED IN ${end - start}ms!!!!______`);
  } catch(error) {
    console.error('something went wrong: ' + error.message);
  }
};

npmRunBuild();