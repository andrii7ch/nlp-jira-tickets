module.exports = text =>
    text
        .replace(/[№«»“”!"#$%&()*+,./:;<=>?@[\]^_`{|}~\\\d-\n\t\r]/g, " ")
        .replace(/\s{2,}/g,' ');