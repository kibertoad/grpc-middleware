const grpc = require('grpc');

function createServer() {
  const server = new grpc.Server();
  server.bind('0.0.0.0:50051', grpc.ServerCredentials.createInsecure());
  return server;
}

module.exports = {
  createServer
};
