/**
 * Copyright 2019 BlockOdyssey Corporation
 * ------------------------------------------------------------------------------
 */

'use strict'

const { sdkPath } = require('./config');
const UserPayload = require('./payload');
const { USER_FAMILY, USER_VERSION, USER_NAMESPACE, UserState } = require('./state');

const { TransactionHandler } = require(`${sdkPath}/processor/handler`);
const { InternalError } = require(`${sdkPath}/processor/exceptions`);

class UserHandler extends TransactionHandler {
    constructor() {
        super(USER_FAMILY, [USER_VERSION], [USER_NAMESPACE]);
    }

    apply(transactionProcessRequest, context) {
        let payload = UserPayload.fromBytes(transactionProcessRequest.payload);
        let userState = new UserState(context);

        return userState.actionFn(payload).then((resAddresses) => {
            if (resAddresses.length === 0) {
                throw new InternalError('State Error!');
            }
        });
    }
}

module.exports = UserHandler;