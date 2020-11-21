// Словники
const colors = [
    '#FE6A6A',
    '#A7FCDB',
    '#DF93FF',
    '#EAD376',
    '#FFD7FC',
    '#b59a84',
    '#F1956E',
    '#84c1ff',
    '#88f78d',
    '#989bd1',
    '#d3cba2',
    '#ffae93',
];
const ukrPOS = {
    NOUN: 'іменник',
    ADJF: 'прикметник',
    ADJS: 'прикметник',
    COMP: 'прикметник',
    VERB: 'дієслово',
    INFN: 'дієслово',
    PRTF: 'дієприкметник',
    PRTS: 'дієприкметник',
    GRND: 'дієприкметник',
    NUMR: 'чисельник',
    ADVB: 'прислівник',
    NPRO: 'займенник',
    PRED: 'предикат',
    PREP: 'прийменник',
    CONJ: 'сполучник',
    PRCL: 'частка',
    INTJ: 'вигук'
}
const ukrNER = {
    location: 'локація',
    person: 'особа',
    number: 'кількість',
    organisation: 'організація',
    time: 'час',
    currency: 'валюта'
};

// Спеціальні методи
const clearArray = arr => { while (arr.length > 0) arr.pop() };
const capitalize = string => string.charAt(0).toUpperCase() + string.slice(1);
const clearContainer = container => container.innerHTML = '';

// Візуальні елементи
const ui = {
    graphCanvas: document.querySelector('.graph'),
    docsContainer: document.querySelector('.docs-list'),
    topicsContainer: document.querySelector('.topics-list'),
    termDetails: {
        container: document.querySelector('.term-details'),
        value: document.querySelector('.term-detail__value'),
        pos: document.querySelector('.term-detail__pos-value'),
        ner: {
            row: document.querySelector('.term-detail__ner'),
            value: document.querySelector('.term-detail__ner-value')
        },
        docsAmount: document.querySelector('.term-detail__docs-amount-value'),
        topic: document.querySelector('.term-detail__topic-value'),
    },
    corporaSelector: document.getElementById('corporaSelector'),
    topicsLimitSlider: document.getElementById('topicsLimit'),
    termsLimitSlider: document.getElementById('termsLimit'),
    loadingTime: document.querySelector('.loadingTime'),
    clearCache: document.querySelector('.clearCache')
};

// Класи
class Doc {
    constructor(name, props) {
        this.name = name;
        this.content = props.content;
        this.terms = props.terms;
        this.wordAmount = props.wordAmount;
    }

    linkTerms() {
        this.terms = this.terms.map(termVal => corpora.terms.filter(termObj => termObj.value === termVal)[0]);
    }

    highlight() {
        this.ui.classList.add('highlighted');
    }

    removeHighlight() {
        this.ui.classList.remove('highlighted');
    }

    render() {
        this.ui = document.createElement('div');
        this.ui.classList.add('doc');

        const title = document.createElement('h2');
        title.textContent = this.name;
        title.onclick = () => this.ui.classList.toggle('opened');

        const content = document.createElement('p');
        content.textContent = this.content;

        const termsContainer = document.createElement('div');
        termsContainer.classList.add('terms');

        this.terms.forEach(termObj => {
            const termSpan = document.createElement('span');
            termSpan.classList.add('term');
            termSpan.style.backgroundColor = termObj.topic.color;
            termSpan.textContent = termObj.value;

            termSpan.onclick = e => {
                e.stopPropagation();
                termObj.onClick();
            }

            termsContainer.append(termSpan);
        });

        this.ui.append(title);
        this.ui.append(content);
        this.ui.append(termsContainer);

        ui.docsContainer.append(this.ui);
    }
}

class Term {
    constructor(id, value, props) {
        this.id = id;
        this.value = value;
        this.pos = props.pos;
        this.topic = props.topic;
        this.topicRelation = props.topicRelation;
        if (props.ner) this.ner = props.ner;
        this.docs = props.docs;
    }

    linkDocs() {
        this.docs = this.docs.map(docName => corpora.docs.filter(docObj => docObj.name === docName)[0]);
    }

    linkTopic() {
        this.topic = corpora.topics[this.topic];
    }

    showDetails() {
        ui.termDetails.container.classList.remove('hidden');
        ui.termDetails.ner.row.classList.remove('hidden');

        ui.termDetails.value.textContent = capitalize(this.value);
        ui.termDetails.pos.textContent = this.pos ? ukrPOS[this.pos] : 'латиниця';
        if(this.ner) ui.termDetails.ner.value.textContent = ukrNER[this.ner];
        else ui.termDetails.ner.row.classList.add('hidden');
        ui.termDetails.docsAmount.textContent = this.docs.length;
        ui.termDetails.topic.style.backgroundColor = this.topic.color;
    }

    highlightDocs() {
        this.docs.forEach(doc => doc.highlight());
    }

    onClick() {
        highlightLinks.clear();
        graph.graphData().nodes[this.id].links.forEach(link => highlightLinks.add(link));

        clearDocsHighlights();
        this.showDetails();
        this.highlightDocs();
    }

    getCommonDocs(termObj) {
        return this.docs.filter(docObj => docObj.terms.includes(termObj));
    }
}

class Topic {
    constructor(id, terms) {
        this.id = id;
        this.terms = terms;
        this.color = colors[id];
    }

    linkTerms() {
        this.terms = this.terms.map(termVal => corpora.terms.filter(termObj => termObj.value === termVal)[0]);
    }

    render() {
        this.ui = document.createElement('div');
        this.ui.classList.add('topic');

        for (let i = 0; i < 4; i++) {
            if (this.terms.length - 1 < i) break;

            const termSpan = document.createElement('span');
            termSpan.classList.add('term');
            termSpan.style.backgroundColor = this.color;
            termSpan.textContent = this.terms[i].value;

            termSpan.onclick = e => {
                e.stopPropagation();
                this.terms[i].onClick();
            }

            this.ui.append(termSpan);
        }

        ui.topicsContainer.append(this.ui);
    }
}

// Унікальні об'єкти
const corpora = {
    name: null,
    terms: [],
    docs: [],
    topics: [],

    interlinkObjects: () => {
        corpora.docs.forEach(doc => doc.linkTerms());
        corpora.terms.forEach(term => {
            term.linkDocs();
            term.linkTopic();
        });
        corpora.topics.forEach(topic => topic.linkTerms());
    },

    parseData: data => {
        corpora.clear();

        data.terms.forEach((termArr, termId) => corpora.terms.push(new Term(termId, termArr[0], termArr[1])));
        data.topics.forEach((terms, topicId) => corpora.topics.push(new Topic(topicId, terms)));
        data.docs.forEach(docArr => corpora.docs.push(new Doc(docArr[0], docArr[1])));

        corpora.interlinkObjects();
    },

    clear: () => {
        clearArray(corpora.terms);
        clearArray(corpora.docs);
        clearArray(corpora.topics);
    },

    getLinksDataForGraph: () => {
        const termsLinks = [];
        corpora.docs.forEach(docObj => {
            docObj.terms.forEach((term1, term1Id) => {
                docObj.terms.forEach((term2, term2Id) => {
                    if (term2Id > term1Id) {
                        termsLinks.push({
                            "source": term1.id,
                            "target": term2.id
                        });
                    }
                })
            });
        });
        return termsLinks;
    },

    getNodesDataForGraph: () => {
        return corpora.terms.map(termObj => ({
            "id": termObj.id,
            "name": termObj.value,
            "val": termObj.docs.length / 2,
            "color": termObj.topic.color
        }))
    },

    getTermObjByValue: val => corpora.terms.filter(termObj => termObj.value === val)[0],
};

const highlightLinks = new Set();

const graph = ForceGraph()(ui.graphCanvas)
    .width(window.innerWidth * 0.7)
    .zoom(3)
    .nodeCanvasObject((node, ctx) => {
        const label = node.name;
        const fontSize = node.val + 2;
        ctx.font = `${fontSize}px Sans-Serif`;
        const textWidth = ctx.measureText(label).width;
        const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);

        const rectX = node.x - bckgDimensions[0] / 2;
        const rectY = node.y - bckgDimensions[1] / 2;
        const rectWidth = bckgDimensions[0];
        const rectHeight = bckgDimensions[1];
        const cornerRadius = node.val;

        ctx.lineJoin = "round";
        ctx.lineWidth = cornerRadius;
        ctx.fillStyle = node.color;
        ctx.strokeStyle = node.color;

        ctx.strokeRect(rectX+(cornerRadius/2), rectY+(cornerRadius/2), rectWidth - cornerRadius, rectHeight-cornerRadius);
        ctx.fillRect(rectX+(cornerRadius/2), rectY+(cornerRadius/2), rectWidth-cornerRadius, rectHeight-cornerRadius);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'black';
        ctx.fillText(label, node.x, node.y);
    })
    .linkWidth(link => highlightLinks.has(link) ? 2 : 1)
    .linkColor(link => highlightLinks.has(link) ? '#4c4c4c' : '#dbdbdb')
    .onNodeClick(node => corpora.getTermObjByValue(node.name).onClick())
    .onNodeDrag(node => corpora.getTermObjByValue(node.name).onClick())
    .onLinkClick(link => {
        highlightLinks.clear();
        clearDocsHighlights();

        highlightLinks.add(link);
        const sourceTermObj = corpora.getTermObjByValue(link.source.name);
        const targetTermObj = corpora.getTermObjByValue(link.target.name);
        const commonDocs = sourceTermObj.getCommonDocs(targetTermObj);
        commonDocs.forEach(doc => doc.highlight());
    });


// Методи сторінки
const clearDocsHighlights = () => corpora.docs.forEach(docObj => docObj.removeHighlight());

const clearTermDetails = () => {
    ui.termDetails.container.classList.add('hidden');
    ui.termDetails.topic.className = 'term-detail__topic-value';
};

const loadData = async (corporaName) => {
    const topicsLimit = corpora.name === corporaName ? ui.topicsLimitSlider.value : null;
    const termsLimit = corpora.name === corporaName ? ui.termsLimitSlider.value : null;

    let src = `/corporaData?corpora=${corporaName}`;
    if (topicsLimit) src += `&topicsLimit=${topicsLimit}`;
    if (termsLimit) src += `&termsLimit=${termsLimit}`;

    const response = await fetch(src);
    const data = await response.json();

    corpora.name = corporaName;
    corpora.parseData(data);

    ui.topicsLimitSlider.max = data.docs.length;
    if (!topicsLimit) ui.topicsLimitSlider.value = data.topicsLimit;

    ui.termsLimitSlider.max = data.termsMaxAmount;
    if (!termsLimit) ui.termsLimitSlider.value = data.terms.length;
};

const renderPage = (loadingTime) => {
    clearContainer(ui.docsContainer);
    corpora.docs.forEach(doc => doc.render());

    clearContainer(ui.topicsContainer);
    corpora.topics.forEach(topic => topic.render());

    ui.loadingTime.textContent = Math.round(loadingTime) / 1000 + ' сек';
    ui.clearCache.textContent = 'Очистити кеш';
    ui.clearCache.classList.add('active');

    const gData = {
        nodes: corpora.getNodesDataForGraph(),
        links: corpora.getLinksDataForGraph()
    };

    // cross-link node objects
    gData.links.forEach(link => {
        const a = gData.nodes[link.source];
        const b = gData.nodes[link.target];

        !a.links && (a.links = []);
        !b.links && (b.links = []);
        a.links.push(link);
        b.links.push(link);
    });

    graph.graphData(gData);
}

const showCorpora = async (name) => {
    const t0 = performance.now();
    await loadData(name);
    const t1 = performance.now();
    renderPage(t1 - t0);
};

const getCorporasList = async () => {
    const response = await fetch('/getCorporasList');
    return await response.json();
};

const initCorporasSelector = async corporasList => {
    corporasList.forEach(corporaName => {
        const option = document.createElement('option');
        option.value = option.innerText = corporaName;
        ui.corporaSelector.append(option);
    });
};

const onPageInit = async () => {
    const corporasList = await getCorporasList();
    initCorporasSelector(corporasList);
    showCorpora(corporasList[0]);
}

// Налаштування event listeners
ui.corporaSelector.onchange = () => showCorpora(ui.corporaSelector.value);
ui.topicsLimitSlider.onchange = () => showCorpora(corpora.name);
ui.termsLimitSlider.onchange = () => showCorpora(corpora.name);
ui.clearCache.onclick = async () => {
    if (!ui.clearCache.classList.contains('active')) return;

    await fetch(`/clearCache?corpora=${corpora.name}`);
    ui.clearCache.textContent = 'Кеш очищено';
    ui.clearCache.classList.remove('active');
};
document.addEventListener('click', clearDocsHighlights);
document.addEventListener('click', clearTermDetails);
document.addEventListener('click', () => highlightLinks.clear());

onPageInit();