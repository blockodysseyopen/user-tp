/**
 * Copyright 2019 BlockOdyssey Corporation
 * ------------------------------------------------------------------------------
 */

'use strict'

const { sdkPath } = require('./config');
const { TransactionProcessor } = require(`${sdkPath}/processor`);
const UserHandler = require('./handler')

const address = 'tcp://localhost:4004'

const transactionProcessor = new TransactionProcessor(address)

transactionProcessor.addHandler(new UserHandler())

transactionProcessor.start()