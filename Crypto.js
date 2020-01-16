/**
 * Copyright 2019 BlockOdyssey Corporation
 * ------------------------------------------------------------------------------
 */

'use strict'

const crypto = require('crypto');
const config = require('./config');

class Crypto {
    constructor(key) {
        if (key) {
            this.key = key;
        } else {
            this.key = config.forPayloadCryptoKey;
        }
        this.algorithm = config.forPayloadCryptoAlgorithm;
        this.iv = Buffer.alloc(16, 0);
    }

    encrypt(target) {
        let cipher = crypto.createCipheriv(this.algorithm, this.key, this.iv);
        let encrypted = cipher.update(target, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        console.log(`===== Encrypt =====`);
        console.log(`${target} -> ${encrypted}`);
        return encrypted;
    }

    decrypt(target) {
        let decipher = crypto.createDecipheriv(this.algorithm, this.key, this.iv);
        let decrypted = decipher.update(target, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        console.log(`===== Decrypt =====`);
        console.log(`${target} -> ${decrypted}`);
        return decrypted;
    }
}

module.exports = Crypto;