module.exports = function override(config, env) {
  // Fix dynamic import error
  config.output = {
    ...config.output,
    environment: {
      dynamicImport: true,
      module: true,
    },
  };

  // Set target
  config.target = ["web", "es2020"];

  // Disable code splitting jika masih bermasalah
  if (env === "production") {
    config.optimization.splitChunks = {
      cacheGroups: {
        default: false,
      },
    };
    config.optimization.runtimeChunk = false;
  }

  return config;
};
