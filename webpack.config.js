const path = require('path');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: {
    config: './src/javascripts/config.js',
    board: './src/javascripts/board.js'
  },
  output: {
    path: path.join(__dirname, './dist/'),
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.html$/,
        use: [
          {
            loader: 'html-loader',
            options: { minimize: false }
          }
        ]
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader']
      }
    ]
  },
  plugins: [
    new HtmlWebPackPlugin({
      template: './src/views/board.html',
      chunks: ['board'],
      filename: './index.html'
    }),
    new HtmlWebPackPlugin({
      template: './src/views/config.html',
      chunks: ['config'],
      filename: './config.html'
    }),
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[id].css'
    })
  ]
};
