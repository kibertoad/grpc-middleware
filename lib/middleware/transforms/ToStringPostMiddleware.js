const get = require('lodash.get');
const PostMiddleware = require('../PostMiddleware');

class ToStringPostMiddleware extends PostMiddleware {
  /**
   *
   * @param propertyName
   * @param {string} [containerPath] If handler returns list of entities, containerName should specify path to that list
   */
  constructor(propertyName, containerPath) {
    super();
    this.propertyName = propertyName;
    this.containerPath = containerPath;
  }

  /**
   *
   * @param res - response entity
   * @param {function} next - function that should be called with an error in case of an error or without parameters to call next middleware in the chain
   */
  execute(res, next) {
    if (!this.containerPath) {
      _transform(res, this.propertyName);
    } else {
      const container = get(res, this.containerPath);
      for (let i = 0; i < container.length; i++) {
        const entity = container[i];
        _transform(entity, this.propertyName);
      }
    }
    next();
  }
}

function _transform(entity, propertyName) {
  const propertyValue = entity[propertyName];
  if (!propertyValue) {
    return;
  }
  if (!Array.isArray(propertyValue)) {
    entity[propertyName] = propertyValue.toString();
  } else {
    entity[propertyName] = propertyValue.map(attr => {
      if (!_.isNil(attr)) {
        return attr.toString;
      }
    });
  }
}

module.exports = ToStringPostMiddleware;
