const path = require('path')
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = {
  entry: './src/index.ts',
  module: {
    rules: [
      // {
      //   test: /\.tsx?$/,
      //   "use": {
      //     "loader": "ts-loader",
      //     "options": {
      //       "transpileOnly": true,
      //       "projectReferences": true
      //     }
      //   },
      //   exclude: /node_modules/,
      // },
      {
        test: /\.tsx?$/,
        "use": {
          "loader": "babel-loader",
        },
        exclude: /node_modules/,
      },
      {
        test: /\.m?js/,
        resolve: {
          fullySpecified: false,
        },
      },
      // {
      //   test: /\.mjs$|esm\/.*\.js$/, // /\.jsx?$|\.mjs$/,
      //   "use": {
      //     "loader": "babel-loader",
      //   }
      // },
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
      plugins: [new TsconfigPathsPlugin({/* options: see below */})]
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  }
}