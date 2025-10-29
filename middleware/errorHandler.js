function errorHandler(err, req, res, next){
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || 'Server Error',
    // don't send stack in production
    ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {})
  });
}

module.exports = errorHandler;
