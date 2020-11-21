const svd = require('./svd.js');

const multMatrix = (A, B) => {
    if(A[0].length !== B.length) throw Error('Matrices cannot be multiplicated');

    const C = new Array(A.length);

    for(let i = 0; i < A.length; i++) {
        C[i] = new Array(B[0].length);
        for(let j = 0; j < B[0].length; j++) {
            let total = 0;
            for(let k = 0; k < B.length; k++)
                total += A[i][k]*B[k][j];

            C[i][j] = total;
        }
    }

    return C;
};

const transponateMatrix = A => {
    const B = [];
    for (let i = 0; i < A[0].length; i++) {
        B[i] = [];
        for (let j = 0; j < A.length; j++)
            B[i][j] = A[j][i];
    }

    return B;
};

const diagMatrix = vec => {
    const matrix = [];
    vec.forEach((value, i) => {
        matrix.push(new Array(vec.length).fill(0));
        matrix[i][i] = value;
    });

    return matrix;
};

module.exports = (tfidf, limit) => {
    const corporaSVD = svd(tfidf);

    const sortedQ = corporaSVD.q.slice().sort((a, b) => b - a);
    const ascIds = sortedQ.map(val => corporaSVD.q.indexOf(val)).slice(0, limit);

    const U = corporaSVD.u.map(row => row.filter((val, valId) => ascIds.includes(valId)));
    const Q = corporaSVD.q.filter((val, valId) => ascIds.includes(valId));
    const V = corporaSVD.v.map(row => row.filter((val, valId) => ascIds.includes(valId)));

    return transponateMatrix(multMatrix(multMatrix(U, diagMatrix(Q)), transponateMatrix(V))).slice(0, limit);
}