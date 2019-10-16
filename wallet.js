var { existsSync, readFileSync, writeFileSync } = require('fs');
var { join } = require('path');
var crypto = require('crypto');
var data = null;

function load(path) {
    const walletFile = join(path, 'wallet.dat');
    if (!existsSync(walletFile))
        throw new Error('No wallet found.');

    data = readFileSync(walletFile);
    
    return this;
}

function save(data, path) {
    const walletFile = join(path, 'wallet.dat');
    if (existsSync(walletFile))
        throw new Error('A wallet already exists.');

    if (data == null || data.length !== 96)
        throw new Error('Data is not of length 96.');

    writeFileSync(walletFile, data);

    return this;
}

function get() {
    if (data == null || !(data instanceof Buffer) || data.length !== 96)
        throw new Error('No wallet loaded yet, run load() first.');

    return data;
}

function getPublicKey() {
    if (data == null || !(data instanceof Buffer) || data.length !== 96)
        throw new Error('No wallet loaded yet, run load() first.');

    return data.slice(0, 64);
}

function getAddress() {
    var shasum = crypto.createHash('sha1');
    shasum.update(getPublicKey(), 'binary');
    return `s${shasum.digest('hex')}`;
}

module.exports = {
    load,
    save,
    get,
    getPublicKey,
    getAddress
}
