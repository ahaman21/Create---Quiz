const path = require('path');

module.exports = {
  // ... other webpack configurations
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    compress: true,
    port: 3002,
    hot: true,
    allowedHosts: 'all',
    proxy: {
      '/api': 'http://localhost:5000'
    }
  }
};
