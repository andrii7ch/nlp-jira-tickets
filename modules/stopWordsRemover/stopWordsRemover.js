const fs = require('fs');
const STOP_WORDS = fs.readFileSync('./modules/stopWordsRemover/ukrainian-stop-words.txt').toString().split('\n');

const removeStopWords = wordsArr => wordsArr.filter(word => !STOP_WORDS.includes(word) && word.length > 4);

module.exports = removeStopWords;