const grpc = require('grpc');

const path = require('path');
const PROTO_PATH = path.resolve(__dirname, 'protos');

const DUMMY_PROTO_PATH = path.resolve(PROTO_PATH, 'dummy.proto');
const dummyProto = grpc.load(DUMMY_PROTO_PATH).dummy;
const dummyRpc = require('./rpc/dummy.rpc');

const serverHelper = require('./helpers/server.helper');

const caller = require('grpc-caller');

const chai = require('chai');
const { assert, expect } = chai;
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

const client = caller('0.0.0.0:50051', DUMMY_PROTO_PATH, 'dummy');

const GrpcMiddlewareManager = require('../lib/GrpcMiddlewareManager');

describe('grpc-middleware', () => {
  describe('middleware', () => {
    let server;
    let middlewareManager;
    beforeEach(async () => {
      server = await serverHelper.createServer();
      middlewareManager = new GrpcMiddlewareManager(server, e => {
        console.log('RPC error: ', e);
      });
    });

    afterEach(async () => {
      if (server) {
        return server.forceShutdown();
      }
      server = undefined;
    });

    it('global premiddleware - happy path', async () => {
      let counter = 0;
      middlewareManager.registerGlobalPreMiddleware(call => {
        counter++;
      });
      middlewareManager.registerService(dummyRpc, dummyProto.dummy.service);
      server.start();
      await client.generateNumber({});
      assert.equal(counter, 1);
    });

    it('global postmiddleware - happy path', async () => {
      let interceptedResult;
      middlewareManager.registerGlobalPostMiddleware((call, result) => {
        interceptedResult = result;
      });
      middlewareManager.registerService(dummyRpc, dummyProto.dummy.service);
      server.start();
      const response = await client.generateNumber({});
      assert.deepEqual(response, interceptedResult);
    });

    it('premiddleware - happy path', async () => {
      let counter = 0;
      middlewareManager.registerService(dummyRpc, dummyProto.dummy.service, call => {
        counter++;
      });
      server.start();
      await client.generateNumber({});
      assert.equal(counter, 1);
    });

    it('postmiddleware - happy path', async () => {
      let interceptedResult;
      middlewareManager.registerService(dummyRpc, dummyProto.dummy.service, [], (call, result) => {
        interceptedResult = result;
      });
      server.start();
      const response = await client.generateNumber({});
      assert.deepEqual(response, interceptedResult);
    });
  });

  describe('errorHandler', () => {
    let server;
    let middlewareManager;
    beforeEach(async () => {
      server = await serverHelper.createServer();
      middlewareManager = new GrpcMiddlewareManager(server, (e, call, callback) => {
        callback(e);
      });
    });

    afterEach(async () => {
      if (server) {
        return server.forceShutdown();
      }
      server = undefined;
    });

    it('correctly processes error', async () => {
      middlewareManager.registerService(dummyRpc, dummyProto.dummy.service);
      server.start();
      const promise = client.nonExistingMethod({});
      await expect(promise)
        .to.eventually.be.rejected.and.be.an.instanceOf(Error)
        .and.have.property('details', 'callHandler is not a function');
    });

    it('correctly propagates error', async () => {
      middlewareManager.registerService(dummyRpc, dummyProto.dummy.service);
      server.start();
      const promise = client.brokenMethod({});
      await expect(promise)
        .to.eventually.be.rejected.and.be.an.instanceOf(Error)
        .and.have.property('details', 'Broken!');
    });
  });
});
