const grpc = require('grpc');
const uuid = require('uuid');

const RpcService = require('./RpcService');

const validationUtils = require('validation-utils');
const { createNamespace } = require('cls-hooked');
const requestIdHandler = require('./requestIdHandler');

const GRPC_HOST = '0.0.0.0';
const GRPC_PORT = 50051;

const REQUEST_SESSION_CLS_NAMESPACE = 'request';

// See https://www.npmjs.com/package/cls-hooked for the explanation how persisting requestId for the duration of entire call works
const requestNameSpace = createNamespace(REQUEST_SESSION_CLS_NAMESPACE);

let grpcServer;

function initGrpcServer() {
  grpcServer = new grpc.Server();
}

// TODO secure the server
function startServer(grpcPortOverride) {
  grpcServer.bind(
    `${GRPC_HOST}:${grpcPortOverride || GRPC_PORT}`,
    grpc.ServerCredentials.createInsecure()
  );
  grpcServer.start();
  console.log(`Starting gRPC server on port ${config.get('GRPC_PORT')}...`);
  return grpcServer;
}

function addService(proto, rpc) {
  grpcServer.addService(proto, wrapService(rpc));
}

function terminateServer() {
  grpcServer.forceShutdown();
  grpcServer = null;
}

/**
 * Wraps calls to gRPC services in order to enable Promise-based API, provide unified error handling mechanism
 * and enable adding additional interceptors should the need arise
 * @param serviceToWrap
 * @returns {object}
 */
function wrapService(serviceToWrap) {
  validationUtils.instanceOf(
    serviceToWrap,
    RpcService,
    `Service should be instanceOf RpcService`
  );

  return new Proxy(serviceToWrap, {
    get: (service, handlerName) => async (call, callback) => {
      const handler = service[handlerName];
      validationUtils.notNil(
        handler,
        `Unknown method ${handlerName} in service ${service.name}`
      );

      requestNameSpace.run(async () => {
        const requestId = uuid.v4(); // We'll probably be getting it from gateway at some point
        requestIdHandler.storeRequestId(requestNameSpace, requestId);

        // We wrap call to handler in order to have nice Promise-based API
        // inside controllers and only have final gRPC callback in a single
        // place - here
        try {
          await service.runPreMiddleware(call, handlerName);

          let result = await Promise.resolve(
            handler.call(service, call, callback)
          );

          await service.runPostMiddleware(result, handlerName);
          callback(null, result);
        } catch (e) {
          errorHandler.handle(e, call, callback, service);
        }
      });
    }
  });
}

module.exports = {
  addService,
  initGrpcServer,
  startServer,
  terminateServer,
  wrapService
};
