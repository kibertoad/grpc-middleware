const { wrapService } = require('../lib/grpcServer');
const RpcService = require('../shared/RpcService');

describe('grpc_service_wrapper', () => {
  describe('wrapService', () => {
    it('happy path - supports service returning non-promises', done => {
      class DummyRpcService extends RpcService {
        doStuff() {
          return {};
        }
      }

      const wrappedService = wrapService(new DummyRpcService('name'));

      wrappedService.doStuff({}, () => {
        done();
      });
    });

    it('happy path - supports service returning promises', done => {
      class DummyRpcService extends RpcService {
        doStuff() {
          return Promise.resolve({});
        }
      }

      const wrappedService = wrapService(new DummyRpcService('name'));

      wrappedService.doStuff({}, () => {
        done();
      });
    });

    it('handles errors thrown in service correctly', done => {
      class DummyRpcService extends RpcService {
        doStuff() {
          throw new Error('Service crashed');
        }
      }

      const wrappedService = wrapService(new DummyRpcService('name'));

      wrappedService.doStuff({}, (err, result) => {
        expect(err).toEqual({ message: 'Internal error', status: 13 });
        done();
      });
    });

    it('handles rejected promises correctly', done => {
      class DummyRpcService extends RpcService {
        doStuff() {
          return Promise.reject('Service crashed');
        }
      }

      const wrappedService = wrapService(new DummyRpcService('name'));

      wrappedService.doStuff({}, (err, result) => {
        expect(err).toEqual({ message: 'Internal error', status: 13 });
        done();
      });
    });
  });
});
