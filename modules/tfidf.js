module.exports = (corpora) => {
    const termsAmount = corpora.bagOfWords.size;
    const totalDocsAmount = corpora.docs.size;
    const tfidf = new Array(termsAmount);

    let termId = 0;
    corpora.bagOfWords.forEach((termProps, term) => {
        tfidf[termId] = new Array(totalDocsAmount).fill(0);

        let docId = 0;
        corpora.docs.forEach(docProps => {
            if (docProps.terms.has(term)) {
                const tf = docProps.terms.get(term).frequency / docProps.wordsAmount;
                const idf = Math.log10(totalDocsAmount / termProps.docs.length);
                docProps.terms.get(term).relation = tfidf[termId][docId] = tf * idf;
            }
            docId++;
        });

        termId++;
    });

    return tfidf;
};