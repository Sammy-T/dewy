const {merge} = require("webpack-merge");
const TerserPlugin = require("terser-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const common = require("./webpack.common.js");

module.exports = merge(common, {
  mode: "production",

  output: {
    publicPath: "",
    filename: "[name].[fullhash:5].js",
    chunkFilename: "[id].[fullhash:5].css"
  },

  optimization: {
    minimizer: [
      new TerserPlugin({
        cache: true,
        parallel: true,
        sourceMap: true
      }),

      new MiniCssExtractPlugin({
        filename: "[name].[fullhash:5].css",
        chunkFilename: "[id].[fullhash:5].css"
      }),

      new CssMinimizerPlugin()
    ]
  }
});
