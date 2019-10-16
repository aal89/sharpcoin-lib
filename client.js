var net = require('net');
var bitconverter = require('./bitconverter');
var decoder = require('./decoder');
var TLVHeaderSize = 4;
var clientPort = 28910;
var eventEmitter = new (require('events')).EventEmitter();
var isOK = 0x98;
var responses = {
    mining: (data) => data[0] == isOK ? eventEmitter.emit('mine_ok') : eventEmitter.emit('mine_noop'),
    keypair: (data) => eventEmitter.emit('keypair', data),
    balance: (data) => eventEmitter.emit('balance', parseInt(data.toString('hex'), 16) || 0),
    txcreation: (data) => data[0] == isOK ? eventEmitter.emit('tx_ok') : eventEmitter.emit('tx_noop'),
    push: (data) => _isBlock(data) ? eventEmitter.emit('pushed_block', decoder(data)) : eventEmitter.emit('pushed_tx', decoder(data)),
}

function startMine(client, keypair) {
    if (client == null)
        throw new Error('Client is undefined.');

    if (keypair == null || !(keypair instanceof Buffer) || keypair.length !== 96)
        throw new Error('Keypair is not of length 96 or not a Buffer.');

    client.write(Buffer.concat([Buffer.from([0x01, 0x00, 0x00, 0x61, 0x00]), keypair]));
}

function stopMine(client) {
    if (client == null)
        throw new Error('Client is undefined.');

    client.write(Buffer.from([0x01, 0x00, 0x00, 0x01, 0x01]));
}

function generateKeypair(client) {
    if (client == null)
        throw new Error('Client is undefined.');

    client.write(Buffer.from([0x03, 0x00, 0x00, 0x01, 0x00]));
}

function getBalance(client, publickey) {
    if (publickey == null || !(publickey instanceof Buffer) || publickey.length !== 64)
        throw new Error('Publickey is not of length 64 or not a Buffer.');

    client.write(Buffer.concat([Buffer.from([0x05, 0x00, 0x00, 0x40]), publickey]));
}

function createTx(client, keypair, ...recipients) {
    if (keypair == null || !(keypair instanceof Buffer) || keypair.length !== 96)
        throw new Error('Keypair is not of length 96 or not a Buffer.');

    if(!recipients.length || !_validRecipients(recipients))
        throw new Error('One or more given recipients are invalid.');

    // kinda magic number 49, but each recipient object contains an amount in long (8 bytes) and a recipient a string of 41 bytes.
    const totalLength = keypair.length + recipients.length * 49;

    client.write(Buffer.concat([
        Buffer.from([0x07]),
        bitconverter.getBytesTLVSizeBE(totalLength),
        keypair,
        recipients.map(_recipientToBytes).reduce((a, c) => Buffer.concat([a, c]), Buffer.alloc(0))
    ]));
}

function _validRecipients(recipients) {
    return recipients.every(recipient => typeof recipient.amount === 'number'
    && recipient.amount < 2**64
    && typeof recipient.recipient === 'string'
    && recipient.recipient.startsWith('s')
    && recipient.recipient.length == 41);
}

function _recipientToBytes(recipient) {
    return Buffer.concat([bitconverter.getBytesUInt64BE(recipient.amount), Buffer.from(recipient.recipient, 'utf8')]);
}

function _isBlock(data) {
    var d = decoder(data);
    return d.Index && d.PreviousHash && d.TargetHash && d.Hash && d.Timestamp && d.Nonce && d.Transactions;
}

module.exports = (clientIp) => {
    var backend = new net.Socket();

    backend.connect(clientPort, clientIp);

    backend.on('connect', () => eventEmitter.emit('connect'));
    backend.on('error', (err) => eventEmitter.emit('err', err));
    backend.on('close', () => eventEmitter.emit('close'));

    backend.on('data', function(data) {
        switch (data[0]) {
            case 0x02: responses.mining(data.slice(TLVHeaderSize)); break;
            case 0x04: responses.keypair(data.slice(TLVHeaderSize)); break;
            case 0x06: responses.balance(data.slice(TLVHeaderSize)); break;
            case 0x08: responses.txcreation(data.slice(TLVHeaderSize)); break;
            case 0xff: responses.push(data.slice(TLVHeaderSize)); break;
        }
    });

    return Object.assign(eventEmitter, {
        startMine: (keypair) => startMine(backend, keypair),
        stopMine: () => stopMine(backend),
        generateKeypair: () => generateKeypair(backend),
        getBalance: (pubk) => getBalance(backend, pubk),
        createTx: (keypair, ...recipients) => createTx(backend, keypair, ...recipients)
    });
}
