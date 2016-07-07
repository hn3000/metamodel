
var webpack = require('webpack');

module.exports = {
  entry: "./out/src/model.js",
  output: {
    path: "./out",
    filename: "metamodel-bundle-[name].js"
  },
  plugins: [
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false,
            },
            output: {
                comments: false,
            },
        }),
        new webpack.optimize.CommonsChunkPlugin("common.js")
    ]
}
