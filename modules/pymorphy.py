# -*- coding: utf-8 -*-
import sys
import json
import pymorphy2
from nltk.stem import WordNetLemmatizer


morph = pymorphy2.MorphAnalyzer(lang='uk')
word_net_lem = WordNetLemmatizer()


docsArr = json.loads(sys.stdin.read())

normalizedDocsTerms = []
for wordsArr in docsArr:
    normalizedDocsTerms.append([])
    currentDocNormalizedTerms = normalizedDocsTerms[len(normalizedDocsTerms) - 1]

    for word in wordsArr:
        parsedWordNormalForm = ' '.join(map(lambda w: word_net_lem.lemmatize(w), word.split(' ')))
        if any(termObj['normalForm'] == parsedWordNormalForm for termObj in currentDocNormalizedTerms):
            for termObj in currentDocNormalizedTerms:
                if termObj['normalForm'] == parsedWordNormalForm:
                    termObj['frequency'] += 1
        else:
            termObj = {
                "normalForm": parsedWordNormalForm,
                "pos": None,
                "frequency": 1
            }
            currentDocNormalizedTerms.append(termObj)

print(json.dumps(normalizedDocsTerms))