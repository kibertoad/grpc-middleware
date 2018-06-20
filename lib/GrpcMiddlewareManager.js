class GrpcMiddlewareManager {
  constructor(grpcServer, errorHandler) {
    this.server = grpcServer;
    this.errorHandler = errorHandler;
    this.globalPreMiddleware = [];
    this.globalPostMiddleware = [];
  }

  registerGlobalPreMiddleware(preMiddleware) {
    this.globalPreMiddleware.push(preMiddleware);
  }

  registerGlobalPostMiddleware(postMiddleware) {
    this.globalPostMiddleware.push(postMiddleware);
  }

  /**
   *
   * @param {Object} service
   * @param {Object} proto
   * @param {function|function[]} premiddleware
   * @param {function|function[]} postmiddleware
   */
  registerService(service, proto, premiddleware = [], postmiddleware = []) {
    if (!Array.isArray(premiddleware)) {
      premiddleware = [premiddleware];
    }
    if (!Array.isArray(postmiddleware)) {
      postmiddleware = [postmiddleware];
    }

    this.server.addService(
      proto,
      wrapInProxy(
        service,
        this.errorHandler,
        [...this.globalPreMiddleware, ...premiddleware],
        [...this.globalPostMiddleware, ...postmiddleware]
      )
    );
  }
}

function wrapInProxy(rpcService, errorHandler, premiddleware, postmiddleware) {
  return new Proxy(rpcService, {
    get: (obj, prop) => async (call, callback) => {
      try {
        const callHandler = obj[prop];

        for (i = 0; i < premiddleware.length; i++) {
          await premiddleware[i](call);
        }

        const result = await Promise.resolve(callHandler(call, callback));

        for (i = 0; i < postmiddleware.length; i++) {
          await postmiddleware[i](call, result);
        }

        callback(null, result);
      } catch (e) {
        if (errorHandler) {
          errorHandler(e, call, callback);
        } else {
          throw e;
        }
      }
    }
  });
}

module.exports = GrpcMiddlewareManager;
