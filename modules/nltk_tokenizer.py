# -*- coding: utf-8 -*-

import json
import sys

from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from nltk.tokenize import RegexpTokenizer


def tokenize_and_remove_stop_words(doc):
    # initialize regex tokenizer
    tokenizer = RegexpTokenizer(r'\w+')
    # create English stop words list
    en_stop = set(stopwords.words('english'))
    # Create p_stemmer of class PorterStemmer
    word_net_lem = WordNetLemmatizer()
    # list for tokenized documents in loop
    texts = []
    # clean and tokenize document string
    raw = doc
    tokens = tokenizer.tokenize(raw)
    # remove stop words from tokens
    stopped_tokens = [i for i in tokens if not i in en_stop]
    # stem tokens
    stemmed_tokens = [word_net_lem.lemmatize(i) for i in stopped_tokens]
    # add tokens to list
    return stemmed_tokens


document = sys.stdin.read()
preprocessed = tokenize_and_remove_stop_words(document)
print(json.dumps(preprocessed))
