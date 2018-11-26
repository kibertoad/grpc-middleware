const errorHandler = require('../lib/errorHandler');
const logger = require('../shared/logger');
const dummyLogger = logger.getLogger('dummy');
const anotherLogger = logger.getLogger('dummy2');

describe('errorHandler', () => {
  it('correctly resolves logger for a service', () => {
    const loggerSpy = jest.spyOn(dummyLogger, 'error');
    const anotherLoggerSpy = jest.spyOn(anotherLogger, 'error');

    errorHandler.handle(new Error('Service exploded'), {}, () => {
    }, {
      name: 'dummy'
    });

    expect(loggerSpy).toHaveBeenCalledWith(
      'Internal error: ',
      new Error('Service exploded')
    );
    expect(anotherLoggerSpy).not.toHaveBeenCalled();
  });
});
