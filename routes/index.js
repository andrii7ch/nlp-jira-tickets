const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const spawn = require('child_process').spawn;
const removeStopWords = require('../modules/stopWordsRemover/stopWordsRemover');
const removePunctuation = require('../modules/punctuationRemover');
const determineTopics = require('../modules/topics-determinant');
const nerData = JSON.parse(fs.readFileSync('./modules/ner.json', 'utf8'));

const docToArray = doc => removeStopWords(removePunctuation(doc).toLowerCase().split(' '));

const normalizeTerms = termsArray => {
    const process = spawn('python', ['./modules/pymorphy.py', JSON.stringify(termsArray)]);

    return new Promise((resolve, reject) => {
        process.stdout.on('data', data => resolve(data.toString()));
    });
};

const filterTermsByPOS = (mapEntry, posArray) => {
    return mapEntry.filter(term => !posArray.includes(term[1].pos));
}

const loadCorpora = async (name) => {
    const corpora = {
        name,
        docs: new Map(),
        bagOfWords: new Map(),
    };

    const src = './corporas/' + name;

    const loadFromCache = fs.existsSync(src + '/terms.json');
    const cacheData = [];

    const files = fs.readdirSync(src);
    for (const fileId in files) {
        const file = files[fileId];

        if (path.extname(file) !== '.txt') continue;

        const docName = file.substring(0, file.length - 4);
        const docContent = fs.readFileSync(src + '/' + file, 'utf8');
        const wordsArray = docToArray(docContent);

        const docProps = {
            content: docContent,
            wordsAmount: wordsArray.length,
        };

        if (!loadFromCache) cacheData.push(wordsArray);

        corpora.docs.set(docName, docProps);
    }

    const jsonNormalizedTerms = loadFromCache ? fs.readFileSync(src + '/terms.json', 'utf8') : await normalizeTerms(cacheData);
    if (!loadFromCache)
        fs.writeFile(src + '/terms.json', jsonNormalizedTerms,() => console.log('terms.json was created'));

    const normalizedTerms = JSON.parse(jsonNormalizedTerms);

    normalizedTerms.forEach((docTerms, docId) => {
        const docName = [...corpora.docs.entries()][docId][0];

        corpora.docs.get(docName).terms = new Map(docTerms.map(termProps => [termProps.normalForm, {...termProps}]));
        docTerms.forEach(termProps => {
            if (corpora.bagOfWords.has(termProps.normalForm))
                corpora.bagOfWords.get(termProps.normalForm).docs.push(docName);
            else
                corpora.bagOfWords.set(termProps.normalForm, {
                    pos: termProps.pos,
                    docs: [docName]
                });
        });
    });

    corpora.bagOfWords = new Map([...corpora.bagOfWords.entries()].sort());

    return corpora;
};

const formatDataForView = (corpora, topics) => {
    const data = {
        topics: topics.map(topic => [...topic.entries()].map(term => term[0])),
        docs: [],
        terms: [],
    };

    data.topics.forEach((topic, topicId) => {
        topic.forEach(term => {
            const termProps = corpora.bagOfWords.get(term);
            termProps.topic = topicId;
            termProps.topicRelation = topics[topicId].get(term).relation;
            if(termProps.pos === 'NOUN' && nerData[term])
                termProps.ner = nerData[term];
            data.terms.push([term, termProps]);
        });
    });

    corpora.docs.forEach((docProps, doc) => {
        docProps.terms = [...docProps.terms.entries()]
            .filter(term => new Map(data.terms).has(term[0]))
            .sort((term1, term2) => term2[1].relation - term1[1].relation)
            .map(term => term[0]);

        data.docs.push([doc, docProps]);
    });

    return data;
}

router.get('/',(req, res) => {
    res.sendFile(path.join(__dirname + './../views/index.html'));
});

router.get('/corporaData', async (req, res) => {
    const corpora = await loadCorpora(req.query.corpora);
    const topicsLimit = req.query.topicsLimit ? req.query.topicsLimit : Math.ceil(corpora.docs.size / 2);
    const termsMaxAmount = Math.min(corpora.bagOfWords.size, 50);
    const termsLimit = req.query.termsLimit ? Math.min(req.query.termsLimit, termsMaxAmount) : termsMaxAmount;

    const topics = determineTopics(corpora, topicsLimit, termsLimit);

    let wordsAmount = 0;
    corpora.docs.forEach(docProps => wordsAmount += docProps.wordsAmount);

    const returnData = formatDataForView(corpora, topics);
    returnData.topicsLimit = topicsLimit;
    returnData.termsMaxAmount = termsMaxAmount;

    fs.writeFile('./asdsadsa.json', JSON.stringify(returnData),() => console.log('asdsadas'));
    res.json(returnData);
});

const getDirectories = source =>
    fs.readdirSync(source, { withFileTypes: true })
        .filter(dir => dir.isDirectory())
        .map(dir => dir.name)

router.get('/getCorporasList', (req, res) => {
    res.json(getDirectories('./corporas'));
});

router.get('/clearCache', (req, res) => {
    console.log('cache is cleared');
    fs.unlinkSync('./corporas/' + req.query.corpora + '/terms.json');
    fs.unlinkSync('./corporas/' + req.query.corpora + '/tfidf.json');
    res.send('done');
});

module.exports = router;