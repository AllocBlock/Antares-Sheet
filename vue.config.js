const webpack = require('webpack')

const customTags = [
  "tab-box",
  "bar",
  "bar-number",
  "bar-split",
  "notes",
  "clef",
  "note",
  "note-element",
  "note-fret-stem",
  "note-fret-empty",
  "note-fret",
  "note-stem",
  "note-flag",
  "note-flag-connect",
  "repeat",
  "row",
  "bg-lines",
  "bg-line",
  "row-split",
  "note-stum",
  "time-signature",
  "chord",
  "chord-pure",
  "chord-body",
  "chord-ruby",
  "info",
  "underline",
  "underline-pure",
  "text",
]

module.exports = {
  publicPath: "./",
  lintOnSave: false,
  devServer: {
    overlay: {
      warning: false,
      errors: false
    }
  },
  configureWebpack: {
    devtool: 'source-map'
  },
  chainWebpack: config => {
    config.plugin('provide').use(webpack.ProvidePlugin, [{
      $: 'jquery',
      jquery: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery'
    }])
    config.module
    .rule('vue')
    .use('vue-loader')
    .tap(options => {
      options.compilerOptions = {
        ...options.compilerOptions,
        isCustomElement: tag => customTags.includes(tag)
      }
      return options
    })
  }
}