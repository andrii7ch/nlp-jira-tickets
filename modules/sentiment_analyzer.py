import sys
import json
from nltk.sentiment import SentimentIntensityAnalyzer

sia = SentimentIntensityAnalyzer()

tickets = json.loads(sys.stdin.read())


def get_polarity_score(c):
    return sia.polarity_scores(c)['compound']


for ticket in tickets:
    for comment in ticket['comments']:
        comment['sentiment'] = get_polarity_score(comment['name'])
    ticket['sentiment'] = get_polarity_score(ticket['description'])

print(json.dumps(tickets))
