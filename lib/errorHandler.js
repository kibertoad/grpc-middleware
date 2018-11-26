const { InvalidArgumentError, ServerError } = require('../shared/errors/index');

function handle(error, call, callback, service) {
  console.error('Internal error: ', error);
  const returnedError = _resolvePublicError(error);

  callback({
    message: returnedError.message,
    status: returnedError.statusCode
  });
}

function _resolvePublicError(internalError) {
  if (internalError.name === 'ValidationError') {
    return new InvalidArgumentError(`JSON Schema validation error: ${internalError.message}`);
  }

  return new ServerError();
}

module.exports = {
  handle
};
