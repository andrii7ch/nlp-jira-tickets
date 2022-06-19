# -*- coding: utf-8 -*-

import json
import sys

from nltk.stem import WordNetLemmatizer


def preprocess_data(doc_set):
    word_net_lem = WordNetLemmatizer()
    # list for tokenized documents in loop
    texts = []
    # loop through document list
    for i in doc_set:
        stemmed_tokens = [word_net_lem.lemmatize(j) for j in i]
        # add tokens to list
        texts.append(stemmed_tokens)
    return texts


termsArray = json.loads(sys.stdin.read())
preprocessed = preprocess_data(termsArray)
print(json.dumps(preprocessed))
