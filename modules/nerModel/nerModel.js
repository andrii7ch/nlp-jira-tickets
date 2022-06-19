const CATEGORY_TERMS = {
    'Programming Language': {
        'Imperative Programming Languages': [
            'python',
            'c#',
            'java',
            'javascript',
            'php'
        ],
        'Declarative Programming Languages': [
            'html5',
        ]
    },
    'Software Standard': {
        'Data Representation Standard': [
            'war',
            'xmlschema',
            'xml',
            'zip',
        ],
        'Internet Standard': [
            '404',
            'w3c',
            'content-type',
            'openid',
            'policy',
            'uri',
        ],
        'Protocols': [
            'opendirective',
            'oauth',
            'rest',
            'iwc',
        ]
    },
    'Software Tool': {
        'Testing Tool': [],
        'Development Tool': [
            'extension',
            'moodle',
            'widget',
            'jdk',

        ],
        'Deployment Tool': [
            'server',
            'tomcat',

        ],
        'Framework': [
            'apache',
            'framework',
            'wookie',
        ]
    },
    'API': {
        'Software API': [
            'callback'
        ]
    },
    'Software Process': {
        'Development': [
            'patch',
            'implement'
        ],
        'Management': [
            'management',
        ],
        'Testing': [
            'testing',
        ],
        'Delivering': [
            'deploy',
            're-deploy'
        ]
    }
}

const TERM_CATEGORY_MAP = new Map();
for (let category of Object.keys(CATEGORY_TERMS)) {
    for (let subcategory of Object.keys(CATEGORY_TERMS[category])) {
        for (let term of CATEGORY_TERMS[category][subcategory]) {
            TERM_CATEGORY_MAP.set(term, {category: category, subcategory: subcategory});
        }
    }
}

const getNerCategory = word => {
    for (const subWord of word.split(' ')) {
        if (TERM_CATEGORY_MAP.has(subWord)) {
            return TERM_CATEGORY_MAP.get(subWord);
        }
    }
    return null;
};

// const getNerCategory = word => word;

module.exports = getNerCategory;