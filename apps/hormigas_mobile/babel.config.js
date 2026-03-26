const plugin = require("tailwindcss")

module.exports = function (api) {
  api.cache(true)
  return {
    presets: [
      [
        "babel-preset-expo",
        {
          jsxImportSource: "nativewind",
          reactCompiler: false
        },
        'module:@react-native/babel-preset'
      ],
      "nativewind/babel",
    ],
    plugins: [
      ['module-resolver', {
        root: ['./src'],
        alias: {
          '@hormigas/core': '../../packages/core',
          '@hormigas/domain': '../../packages'
        },
      }],
    ],
  }
}