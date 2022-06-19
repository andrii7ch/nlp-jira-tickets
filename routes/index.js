const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const spawn = require('child_process').spawn;
const removeStopWords = require('../modules/stopWordsRemover/stopWordsRemover');
const removePunctuation = require('../modules/punctuationRemover');
const determineTopics = require('../modules/topics-determinant');
const getNerCategory = require('../modules/nerModel/nerModel');

const docToArray = doc => removeStopWords(removePunctuation(doc).toLowerCase().split(' '));

const wordsToBigrams = wordsArray => {
    const result = [];
    for (let i = 1; i < wordsArray.length; i++) {
        result.push(wordsArray[i - 1] + ' ' + wordsArray[i]);
    }
    return result;
};

const normalizeTerms = termsArray => {
    const process = spawn('python', ['./modules/pymorphy.py']);
    process.stdin.setEncoding('utf-8');
    process.stdin.write(JSON.stringify(termsArray));
    process.stdin.end();

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

    const tickets = await getTickets()
    for (const ticket of tickets) {
        const docName = ticket.name;
        const docContent = ticket.description;
        const tokenizedDocName = docToArray(docName);
        const wordsArray = [
            ...tokenizedDocName,
            ...wordsToBigrams(tokenizedDocName),
            // ...docToArray(docContent),
            ...wordsToBigrams(docToArray(docContent)),
        ];

        const docProps = {
            content: docContent,
            wordsAmount: wordsArray.length,
            comments: ticket.comments,
            sentiment: ticket.sentiment,
        };

        if (!loadFromCache) cacheData.push(wordsArray);

        corpora.docs.set(docName, docProps);
    }

    const jsonNormalizedTerms = loadFromCache ? fs.readFileSync(src + '/terms.json', 'utf8') : await normalizeTerms(cacheData);
    const normalizedTerms = JSON.parse(jsonNormalizedTerms);
    if (!loadFromCache)
        fs.writeFileSync(src + '/terms.json', JSON.stringify(normalizedTerms));


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

const loadNerCorpora = async (name) => {
    const corpora = {
        name,
        docs: new Map(),
        bagOfWords: new Map(),
    };

    const src = './corporas/' + name;
    const tickets = await getTickets();

    const loadFromCache = fs.existsSync(src + '/NerTerms.json');
    const cacheData = [];


    for (const ticket of tickets) {
        const docName = ticket.name;
        const docContent = ticket.description;
        const tokenizedDocName = docToArray(docName);
        const categories = [
            ...tokenizedDocName,
            ...docToArray(docContent),
            ...wordsToBigrams(docToArray(docContent)),
        ].map(word => {
            let categoryInfo = getNerCategory(word);
            if (categoryInfo == null) {
                return null;
            }
            return [
                categoryInfo.category,
                categoryInfo.category,
                categoryInfo.category,
                categoryInfo.subcategory
            ]
        })
            .flatMap(categories => categories)
            .filter(category => category != null);


        const docProps = {
            content: docContent,
            wordsAmount: categories.length,
            comments: ticket.comments,
            sentiment: ticket.sentiment
        };

        if (!loadFromCache) cacheData.push(categories);

        corpora.docs.set(docName, docProps);
    }

    const jsonNormalizedTerms = loadFromCache ? fs.readFileSync(src + '/NerTerms.json', 'utf8') : await normalizeTerms(cacheData);
    const normalizedTerms = JSON.parse(jsonNormalizedTerms);
    if (!loadFromCache)
        fs.writeFileSync(src + '/NerTerms.json', JSON.stringify(normalizedTerms));


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
            termProps.ner = getNerCategory(term);
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

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + './../views/index.html'));
});

router.get('/corporaData', async (req, res) => {
    const withTermsClassification = req.query.withTermsClassification;
    let corpora;
    if (withTermsClassification) {
        corpora = await loadNerCorpora(req.query.corpora);
    } else {
        corpora = await loadCorpora(req.query.corpora);
    }
    const topicsLimit = req.query.topicsLimit ? req.query.topicsLimit : Math.ceil(corpora.docs.size / 2);
    const termsMaxAmount = Math.min(corpora.bagOfWords.size, 50);
    const termsLimit = req.query.termsLimit ? Math.min(req.query.termsLimit, termsMaxAmount) : termsMaxAmount;

    const topics = determineTopics(corpora, topicsLimit, termsLimit);

    let wordsAmount = 0;
    corpora.docs.forEach(docProps => wordsAmount += docProps.wordsAmount);

    const returnData = formatDataForView(corpora, topics);
    returnData.topicsLimit = topicsLimit;
    returnData.termsMaxAmount = termsMaxAmount;

    fs.writeFileSync('./asdsadsa.json', JSON.stringify(returnData));
    res.json(returnData);
});

const getTickets = () => {
    const parsedFile = JSON.parse(fs.readFileSync('tickets_copy.json', 'utf-8'));
    const process = spawn('python', ['./modules/sentiment_analyzer.py']);
    process.stdin.setEncoding('utf-8');
    process.stdin.write(JSON.stringify(parsedFile));
    process.stdin.end();

    return new Promise((resolve, reject) => {
        process.stdout.on('data', data => resolve(JSON.parse(data.toString())));
    });
};

const getCorporasList = async () =>
    Array.from(new Set((await getTickets()).map(r => r.sprint)))


router.get('/getCorporasList', async (req, res) => {
    res.json(await getCorporasList());
});

router.get('/clearCache', (req, res) => {
    console.log('cache is cleared');
    fs.unlinkSync('./corporas/' + req.query.corpora + '/terms.json');
    fs.unlinkSync('./corporas/' + req.query.corpora + '/tfidf.json');
    res.send('done');
});

module.exports = router;
