const PreMiddleware = require('../PreMiddleware');
const { applyFieldMask } = require('protobuf-fieldmask');

class ApplyFieldMaskPreMiddleware extends PreMiddleware {
  /**
   *
   * @param call
   * @param {function} next - function that should be called with an error in case of an error or without parameters to call next middleware in the chain
   */
  execute(call, next) {
    const fieldMask = call.request.field_mask;

    if (fieldMask) {
      call.request = applyFieldMask(call.request, fieldMask.paths || []);
    }
    next();
  }
}

module.exports = ApplyFieldMaskPreMiddleware;
