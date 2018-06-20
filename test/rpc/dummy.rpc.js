function generateNumber(call) {
  const randomNumber = Math.floor(Math.random() * Math.floor(3));
  return { randomNumber };
}

function brokenMethod(call) {
  throw new Error('Broken!');
}

module.exports = {
  brokenMethod,
  generateNumber
};
