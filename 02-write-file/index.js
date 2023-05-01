const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { stdin: input, stdout: output } = require('process');

const textPath = path.join(__dirname, 'text.txt');

const setQuestion = (isFirst) => {
  const questionMessage = `input something ${isFirst ? '' : 'else'}\n`;
  const callback = (data) => data === 'exit' ? rl.close() : appendText(data + '\n');
  rl.question(questionMessage, callback);
};
const appendText = (data) => {
  const callback = (error) => {
    if (error) throw error;
    setQuestion(false);
  }
  fs.appendFile(textPath, data, callback);
};
const openHandler = (error) => {
  if (error) throw error;
  setQuestion(true);
}
const closeHandler = () => console.log('____thank you for typing!____');

fs.open(textPath, 'w', openHandler);
const rl = readline.createInterface({ input, output });
rl.on('close', closeHandler);