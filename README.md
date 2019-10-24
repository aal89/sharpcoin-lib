# sharpcoin-lib

Dependency free and a pure Javascript solution to connecting and controlling a [sharpcoin](https://github.com/aal89/sharpcoin) core. In its current state this is a very simplistic tool. It can be used to generate wallets, start/stop mining, get balance for a wallet and make transactions. Also included is a decoder which can be used to decode blocks of data and view them in plain JSON.

To use this library you'll need to have a sharpcoin core running, see the link above.

## Install

```sh
npm install sharpcoin --save
```

## Usage

```js
var sharpcoin = require('sharpcoin');
```

```ts
import * as sharpcoin from "sharpcoin";

// or

import { decoder, wallet, client } from "sharpcoin";
```

Exported are three functions: `decoder`, `wallet`, `client`. While `decoder` and `wallet` are directly available the `client` is not. To use the API of the `client` object first an IP address must be given. An initialisation step if you will.

```js
var sharpcoin = require('sharpcoin');
// No inits for the following two exposed objects.
var wallet = sharpcoin.wallet;
var decoder = sharpcoin.decoder;

// Init for the client, such that its API becomes available, iff it connects ofcourse.
var client = sharpcoin.client('127.0.0.1');

```

### API

#### Example

A random example using this library.

```js
var sharpcoin = require('sharpcoin');
var fs = require('fs');
var client = sharpcoin.client('127.0.0.1');
var wallet = sharpcoin.wallet;
var decoder = sharpcoin.decoder;

client.on('keypair', (data) => wallet.save(data, './'));
client.on('balance', (balance) => console.log(balance));

client.generateKeypair();

// A timeout to no have wallet.load error. Obviously this isn't here in real applications.
setTimeout(() => {

    console.log(wallet.load('./').get());

    client.getBalance(wallet.load('./').getPublicKey());

    // Requires a file (block) named 110.
    console.log(decoder(fs.readFileSync('./110.block')));

}, 1000);
```

---
#### decoder(data: Buffer)
---
Returns JSON object representing the block data given as a buffer. Returns an empty object when infating or parsing fails. It is also possible to decode index files.

---
#### wallet.load(path: string)
---
A `wallet.dat` file is loaded from the given path. It sets the data loaded from the file internally and makes the `get()`, `getPublicKey()` and `getAddress()` possible to execute. If you wish to load a different wallet into this object use `load(path)` again.

Do not include the `wallet.dat` filename in the path.

Returns the wallet instance.

---
#### wallet.save(data: Buffer, path: string)
---
Saves the buffer to the path given as `wallet.dat`. If one such file already exists throws an error. Also throws an error if the Buffer is not of length 96. Keypairs generated by the sharpcoin core are always 96 bytes long.

Do not include the `wallet.dat` filename in the path.

Returns the wallet instance.

---
#### wallet.get()
---
Returns the raw data loaded from the `wallet.dat` file. Throws an error if no wallet has been loaded yet.

---
#### wallet.getPublicKey()
---
Return the subset of data from the loaded `wallet.dat` file which is used as the public key in the sharpcoin core. Throws an error if no wallet has been loaded yet.

---
#### wallet.getAddress()
---
Returns the public key converted into a valid sharpcoin address. Throws an error if no wallet has been loaded yet.

---
#### client.startMine(keypair: Buffer)
---
Attempts to start the miner in the sharpcoin core. Accepts a raw keypair, often loaded with `wallet.get()`.

Will either fire the `mine_ok` or `mine_noop` event (see below).

---
#### client.stopMine()
---
Attempts to stop the miner in the sharpcoin core.

Will either fire the `mine_ok` or `mine_noop` event (see below).

---
#### client.generateKeypair()
---
Generates a fresh new keypair in the sharpcoin core. Will fire the `keypair` event.

---
#### client.getBalance(pubk: Buffer)
---
Retrieves the balance for a particular public key. Note that this function does not take in an address. Use it with the `wallet.getPublicKey()` function. Fires the `balance` event.

---
#### client.createTx(keypair: Buffer, ...recipients: { amount: number, recipient: string })
---
Attempts to create a new transaction for a given keypair. Use `wallet.get()` for the keypair and give any amount of sharpcoins to any recipient using the defined struct. The recipients argument is variadic. The `amount` is any number below 2^64 (a **long**) and the recipient is the address of the other party (`wallet.getAddress()`).

Either fires the `tx_ok` or the `tx_noop` event.

---
#### client.on('connect', () => void 0)
---
Fires when connected to the sharpcoin core.

---
#### client.on('err', (err: any) => void 0)
---
Fires when any connection error happens between the client and the sharpcoin core.

---
#### client.on('close', () => void 0)
---
Fires when the connection gets closed between the client and the sharpcoin core.

---
#### client.on('mine_ok', () => void 0)
---
Fires when the startMining/stopMining operation got accepted.

For any additional output try to look at the `stdout` and `stderr` of the sharpcoin core.

---
#### client.on('mine_noop', () => void 0)
---
Fires when the startMining/stopMining operation got rejected.

For any additional output try to look at the `stdout` and `stderr` of the sharpcoin core.

---
#### client.on('keypair', (data: Buffer) => void 0)
---
Fires when a new keypair got generated in the sharpcoin core. The data returned can be directly saved using the wallet function `wallet.save(data, 'some/path');`.

---
#### client.on('balance', (balance: number) => void 0)
---
Fires when a balance request got processed by the sharpcoin core.

---
#### client.on('tx_ok', () => void 0)
---
Fires when the createTx operation got accepted.

For any additional output try to look at the `stdout` and `stderr` of the sharpcoin core.

---
#### client.on('tx_noop', () => void 0)
---
Fires when the createTx operation got rejected.

For any additional output try to look at the `stdout` and `stderr` of the sharpcoin core.
