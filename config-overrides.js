module.exports = function override(config) {
  config.resolve.fallback = {
    ...config.resolve.fallback,
    crypto: false,
    stream: false,
    buffer: false,
    util: false,
    process: false
  };
  
  config.ignoreWarnings = [/Failed to parse source map/];
  
  return config;
};