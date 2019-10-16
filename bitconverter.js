function getBytesTLVSizeBE(nr) {
    const b = Buffer.alloc(3)
    b.writeUIntBE(nr, 0, 3);
    return b;
}

function getBytesUInt64BE(nr) {
    // Hacky way to get a 8 byte buffer for any number:

    // Append a zero when the toString result when its odd in length, otherwise the
    // buffer.from action will drop the lsb(yte) from the string resulting in inaccurate
    // representations. Hacky way because this will not parse all numbers up to 2**64,
    // among other reasons. Still acceptable approach because only the last few in the
    // 2**64 range are not correctly parsed, for example 18446744073709550000 is parsed,
    // while 18446744073709552000 is not.
    const hex = nr.toString(16).length % 2 == 0 ? nr.toString(16) : `0${nr.toString(16)}`;
    const b = Buffer.from(hex, 'hex');
    return Buffer.alloc(8).fill(b, 8 - b.length, 8, 'hex');
}

module.exports = {
    getBytesTLVSizeBE,
    getBytesUInt64BE
}
