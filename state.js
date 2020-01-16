/**
 * Copyright 2019 BlockOdyssey Corporation
 * ------------------------------------------------------------------------------
 */

'use strict'
const { sdkPath } = require('./config');
const { InvalidTransaction } = require(`${sdkPath}/processor/exceptions`);
const Crypto = require('./Crypto');
const crypto = require('crypto');

const _hash = (x) => {
    return crypto.createHash('sha512').update(x).digest('hex').toLowerCase();
};

const USER_FAMILY = 'user';
const USER_VERSION = '1.0';
const USER_NAMESPACE = _hash(USER_FAMILY).substring(0, 6);
const USER_KEY = _hash(USER_FAMILY).substring(0, 24);

const _makeUserAddress = (userID, nameForAddress) => {
    let prevAddress = userID;

    if (prevAddress !== nameForAddress) {
        throw new InvalidTransaction(`"nameForAddress" is wrong: ${nameForAddress}`);
    }
    let postfix = _hash(prevAddress).slice(-64);
    return USER_NAMESPACE + postfix;
};

class UserState {
    constructor (context) {
        this.context = context;
        this.timeout = 500;
    }

    async actionFn(payload) {
        if (payload.action === 'create') {
            return await this.createUser(payload);
        } else if (payload.action === 'modify') {
            return await this.modifyUser(payload);
        } else if (payload.action === 'register') {
            return await this.registerObject(payload);
        } else {
            throw new InvalidTransaction(`"action" must be "create", "modify", "register" not ${payload.action}`);
        }
    }

    async createUser (payload) {
        try {
            if (payload.actionDetail.type !== 'userData') {
                throw new InvalidTransaction('If action is "create", type must be "userData"');
            }
            let address = _makeUserAddress(payload.userID, payload.nameForAddress);

            let stateValue = await this._getUser(address);
            if (stateValue !== null) {
                throw new InvalidTransaction(`Action is "create" but User already in state, userID: ${payload.userID}`);
            } else {
                stateValue = {
                    userID: payload.userID,
                    userDetail: payload.actionDetail.userDetail,
                    creationDate: payload.timeStamp,
                    historyOfChange: [
                        {
                            date: payload.timeStamp,
                            action: 'create'
                        }
                    ],
                    registeredObject: []
                };
                stateValue.userPWD = new Crypto(USER_KEY).encrypt(payload.userPWD);
                return await this._setEntry(address, stateValue);
            }
        } catch (err) {
            throw err;
        }
    }

    async modifyUser (payload) {
        try {
            if (payload.actionDetail.type !== 'userData') {
                throw new InvalidTransaction('If action is "modify", type must be "userData"');
            }
            let address = _makeUserAddress(payload.userID, payload.nameForAddress);

            let stateValue = await this._getUser(address);
            if (stateValue === null) {
                throw new InvalidTransaction(`Action is "modify" but there is no User in state, userID: ${payload.userID}`);
            } else {
                let statePWD = new Crypto(USER_KEY).decrypt(stateValue.userPWD);
                if (statePWD !== payload.userPWD) {
                    throw new InvalidTransaction(`User Password wrong`);
                } else {
                    if (payload.actionDetail.userDetail.newPWD) {
                        stateValue.userPWD = payload.actionDetail.userDetail.newPWD;
                        delete payload.actionDetail.userDetail.newPWD;
                    }
                    stateValue.userDetail = payload.actionDetail.userDetail;
                    stateValue.historyOfChange.push({
                        date: payload.timeStamp,
                        action: 'modify'
                    });
                    return await this._setEntry(address, stateValue);
                }
            }
        } catch (err) {
            throw err;
        }
    }

    async registerObject (payload) {
        try {
            if (payload.actionDetail.type !== 'registrationData') {
                throw new InvalidTransaction('If action is "register", type must be "registrationData"');
            }
            let address = _makeUserAddress(payload.userID, payload.nameForAddress);

            let stateValue = await this._getUser(address);
            if (stateValue === null) {
                throw new InvalidTransaction(`Action is "register" but there is no User in state, userID: ${payload.userID}`);
            } else {
                let statePWD = new Crypto(USER_KEY).decrypt(stateValue.userPWD);
                if (statePWD !== payload.userHWD) {
                    throw new InvalidTransaction(`User Password wrong`);
                } else {
                    stateValue.registeredObject.push({
                        date: payload.timeStamp,
                        objectCode: payload.actionDetail.objectCode,
                        registrationDetail: payload.actionDetail.registrationDetail
                    });
                    stateValue.historyOfChange.push({
                        date: payload.timeStamp,
                        action: 'register'
                    });
                    return await this._setEntry(address, stateValue);
                }
            }
        } catch (err) {
            throw err;
        }
    }

    async _getUser(address) {
        try {
            let possibleAddressValues = await this.context.getState([address], this.timeout);
            let stateValueRep = possibleAddressValues[address];
            let stateValue;
            if (stateValueRep && stateValueRep.length > 0) {
                stateValue = JSON.parse(stateValueRep.toString());
                return stateValue;
            } else {
                return null;
            }
        } catch (err) {
            throw err;
        }
    }

    async _setEntry(address, stateValue) {
        let entries = {
            [address]: Buffer.from(JSON.stringify(stateValue))
        }
        return await this.context.setState(entries);
    }
}

module.exports = {
    USER_FAMILY,
    USER_VERSION,
    USER_NAMESPACE,
    UserState
};