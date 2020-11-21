const fs = require('fs');
const tfidf = require('./tfidf.js');
const getTopicsMatrix = require('./lsa.js')

module.exports = (corpora, topicsLimit, termsLimit) => {
    const cacheSrc = './corporas/' + corpora.name + '/tfidf.json';
    const loadFromCache = fs.existsSync(cacheSrc);
    const corporaTFIDF = loadFromCache ? JSON.parse(fs.readFileSync(cacheSrc, 'utf8')) : tfidf(corpora);

    if (!loadFromCache)
        fs.writeFile(cacheSrc, JSON.stringify(corporaTFIDF), () => console.log('tfidf.json was created'));

    if (topicsLimit > corpora.docs.length) topicsLimit = corpora.docs.length;
    const topicsMatrix = getTopicsMatrix(corporaTFIDF, topicsLimit);

    const topics = [];
    for (let i = 0; i < topicsLimit; i++) topics.push(new Map());

    const termsImportances = [];
    let termId = 0;
    corpora.bagOfWords.forEach((termProps, term) => {
        let topicIdWithMaxTermRelation = 0;
        let maxTermRelation = topicsMatrix[0][termId];

        for (let topicId = 1; topicId < topicsLimit; topicId++) {
            if (topicsMatrix[topicId][termId] > maxTermRelation) {
                topicIdWithMaxTermRelation = topicId;
                maxTermRelation = topicsMatrix[topicId][termId];
            }
        }

        termsImportances.push(termProps.docs.length * maxTermRelation);
        topics[topicIdWithMaxTermRelation].set( term, { ...termProps, relation: maxTermRelation });
        termId++;
    });

    termsImportances.sort((a, b) => b - a);
    const termImportanceLimit = termsImportances[termsLimit] ? termsImportances[termsLimit] : 0;

    return topics.map(topic =>
        new Map([...topic.entries()]
            .sort((a, b) =>
                b[1].docs.length * b[1].relation - a[1].docs.length * a[1].relation)
            .filter(term => term[1].docs.length * term[1].relation > termImportanceLimit)
        )
    ).filter(topic => topic.size > 0);
};