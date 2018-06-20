function generateNumber(call) {
  const randomNumber = Math.floor(Math.random() * Math.floor(3));
  return { randomNumber };
}

function nonImplementedMethod(call) {
  throw new Error('Not implemented!');
}

module.exports = {
  generateNumber
};
