# -*- coding: utf-8 -*-
import sys
import json
import pymorphy2

morph = pymorphy2.MorphAnalyzer(lang='uk')

docsArr = json.loads(sys.argv[1])

normalizedDocsTerms = []
for wordsArr in docsArr:
    normalizedDocsTerms.append([])
    currentDocNormalizedTerms = normalizedDocsTerms[len(normalizedDocsTerms) - 1]

    for word in wordsArr:
        parsedWord = morph.parse(word)[0]
        if any(termObj['normalForm'] == parsedWord.normal_form for termObj in currentDocNormalizedTerms):
            for termObj in currentDocNormalizedTerms:
                if termObj['normalForm'] == parsedWord.normal_form:
                    termObj['frequency'] += 1
        else:
            termObj = {
                "normalForm": parsedWord.normal_form,
                "pos": parsedWord.tag.POS,
                "frequency": 1
            }
            currentDocNormalizedTerms.append(termObj)

print(json.dumps(normalizedDocsTerms))