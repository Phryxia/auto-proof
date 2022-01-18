const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { ProvidePlugin } = require('webpack')

module.exports = {
  entry: './src/index.tsx',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'build'),
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'esbuild-loader',
        options: {
          loader: 'tsx',
          target: 'es2019',
        },
      },
      {
        test: /\.(module\.)?css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'public/index.html',
      publicPath: '/',
    }),
    new ProvidePlugin({
      React: 'react',
    }),
  ],
  resolve: {
    alias: {
      '@src': path.resolve(__dirname, './src'),
    },
    extensions: ['.tsx', '.ts', '.js', '.css'],
  },
  devServer: {
    compress: true,
    port: 4577,
    open: true,
  },
  mode: 'development',
}
