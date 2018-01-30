module.exports = enabled => enabled ? msg => {
  console.log('Bistro: ', msg);
} : () => {};
