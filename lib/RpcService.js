class RpcService {
  /**
   *
   * @param {string} serviceName
   */
  constructor(serviceName) {
    this.name = serviceName;
    this.preMiddleware = {};
    this.postMiddleware = {};
  }

  addPreMiddleware(serviceHandlerName, middleware) {
    this._addMiddleware(serviceHandlerName, middleware, this.preMiddleware);
  }

  addPostMiddleware(serviceHandlerName, middleware) {
    this._addMiddleware(serviceHandlerName, middleware, this.postMiddleware);
  }

  /**
   * Run pre-request-lifecycle middleware.
   * @param {Object} call - call object. Can be mutated by middleware
   * @param {String} serviceHandlerName - rpc service handler name
   * @return {Promise<*>} - promise that resolves after all middleware was executed
   */
  runPreMiddleware(call, serviceHandlerName) {
    _runMiddleware(call, serviceHandlerName, this.preMiddleware);
  }

  /**
   * Run post-request-lifecycle middleware.
   * @param {Object} result - response object. Can be mutated by middleware
   * @param {String} serviceHandlerName - rpc service handler name
   */
  runPostMiddleware(result, serviceHandlerName) {
    _runMiddleware(result, serviceHandlerName, this.postMiddleware);
  }

  /**
   *
   * @param serviceHandlerName - name of a service handler (method)
   * @param middleware - middleware to add
   * @param middlewareList - list of all middleware for the service
   * @private
   */
  _addMiddleware(serviceHandlerName, middleware, middlewareList) {
    if (!Array.isArray(middleware)) {
      middleware = [middleware];
    }

    if (!middlewareList[serviceHandlerName]) {
      middlewareList[serviceHandlerName] = [];
    }

    middlewareList[serviceHandlerName].push(...middleware);
  }
}

/**
 *
 * @param executeParam - call (for preMiddleware) or response (for postMiddlewar)
 * @param {PreMiddleware[]|PostMiddleware[]} middleware
 * @param resolve
 * @returns {Function}
 * @private
 */
function _initMiddlewareCallback(executeParam, middleware = [], resolve) {
  return err => {
    if (err) {
      throw err;
    }
    if (!middleware || middleware.length === 0) {
      resolve();
      return noop;
    }
    const currentMiddleware = middleware.shift();
    currentMiddleware.execute(
      executeParam,
      _initMiddlewareCallback(executeParam, middleware, resolve)
    );
  };
}

function _runMiddleware(executionParam, serviceHandlerName, middlewareList) {
  return new Promise((resolve, reject) => {
    const middlewareCallback = _initMiddlewareCallback(
      executionParam,
      middlewareList[serviceHandlerName],
      resolve
    );
    middlewareCallback(); // Start going through the chain
  });
}

const noop = () => {};

module.exports = RpcService;
