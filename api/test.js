module.exports = (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'CommonJS handler working',
    time: new Date().toISOString()
  });
};
