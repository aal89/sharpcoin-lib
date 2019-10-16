var zlib = require('zlib');

function decode(data) {
    try {
        return JSON.parse(zlib.inflateRawSync(data));
    } catch {
        return {};
    }
}

module.exports = decode;
