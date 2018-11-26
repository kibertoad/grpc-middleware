const REQUEST_ID_KEY = 'requestId';
let namespace;

/**
 * Stores requestId within the scope of a single gRPC call
 * @param {Object} requestNamespace - cls-hooked namespace
 * @param {string} requestId
 */
function storeRequestId(requestNamespace, requestId) {
  requestNamespace.set(REQUEST_ID_KEY, requestId);
  namespace = requestNamespace;
}

/**
 * Retrieves requestId of a specific gRPC call (based on callback hierarchy, see https://github.com/jeff-lewis/cls-hooked for more details)
 * @returns {undefined}
 */
function retrieveRequestId() {
  return namespace ? namespace.get(REQUEST_ID_KEY) : undefined;
}

module.exports = {
  storeRequestId,
  retrieveRequestId
};
