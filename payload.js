/**
 * Copyright 2019 BlockOdyssey Corporation
 * ------------------------------------------------------------------------------
 */

'use strict'
const { sdkPath } = require('./config');
const { InvalidTransaction } = require(`${sdkPath}/processor/exceptions`);

class UserPayload {
    constructor (payload) {
        this.nameForAddress = payload.nameForAddress;
        this.userID = payload.userID;
        this.userPWD = payload.userPWD;
        this.action = payload.action;
        this.actionDetail = payload.actionDetail;
        this.timeStamp = payload.timeStamp;
    }
    
    static fromBytes (payload) {
        payload = JSON.parse(payload.toString());

        if (Object.keys(payload).length === 6) {
            if (!payload.nameForAddress) {
                throw new InvalidTransaction('"nameForAddress" is required');
            }
            if (!payload.userID) {
                throw new InvalidTransaction('"userID" is required');
            }
            if (!payload.userPWD) {
                throw new InvalidTransaction('"userPWD" is required');
            }
            if (!payload.action) {
                throw new InvalidTransaction('"action" is required');
            }
            if (!payload.actionDetail) {
                throw new InvalidTransaction('"actionDetail" is required');
            }
            if (!payload.timeStamp) {
                throw new InvalidTransaction('"timeStamp" is required');
            }
            const actionDetail = payload.actionDetail;

            switch(actionDetail.type) {
                case 'userData':
                    if (!actionDetail.userDetail) {
                        throw new InvalidTransaction('"actionDetail.userDetail" is required');
                    }
                    break;
                case 'registrationData':
                    if (!actionDetail.objectCode) {
                        throw new InvalidTransaction('"actionDetail.objectCode" is required');
                    }
                    if (!actionDetail.registrationDetail) {
                        throw new InvalidTransaction('"actionDetail.registrationDetail" is required');
                    }
                    break;
                default:
                    throw new InvalidTransaction(`"actionDetail.type" must be "userData", "registrationData" not ${actionDetail.type}`);
            }

            let userPayload = new UserPayload(payload);

            return userPayload;
        } else {
            throw new InvalidTransaction('Invalid payload serialization');
        }
    }
}

module.exports = UserPayload;