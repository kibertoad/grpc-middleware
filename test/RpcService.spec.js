const PostMiddleware = require('../lib/middleware/PostMiddleware');
const PreMiddleware = require('../lib/middleware/PreMiddleware');
const RpcService = require('../lib/RpcService');
const { expect } = require('chai');

describe('RpcService', () => {
  it('#runPreMiddleware', () => {
    class BarPreMiddleware extends PreMiddleware {
      execute(call) {
        call.request.param = 'bar';
      }
    }

    class DummyService extends RpcService {
      constructor() {
        super('dummy');

        this.addPreMiddleware('create', new BarPreMiddleware());
      }

      create() {}
    }

    const service = new DummyService();
    const call = {
      request: {
        param: 'foo'
      }
    };

    service.runPreMiddleware(call, 'create');
    expect(call.request.param).to.equal('bar');
  });

  it('#runPostMiddleware', () => {
    class BarPostMiddleware extends PostMiddleware {
      execute(response) {
        response.result = 'bar';
      }
    }

    class DummyService extends RpcService {
      constructor() {
        super('dummy');

        this.addPostMiddleware('create', new BarPostMiddleware());
      }

      create() {}
    }

    const service = new DummyService();

    let response = {
      result: 'foo'
    };
    service.runPostMiddleware(response, 'create');

    expect(response.result).to.equal('bar');
  });
});
