const { override, addPostcssPlugins, useBabelRc } = require('customize-cra')

/* config-overrides.js */

module.exports = {
  webpack: override(
    useBabelRc(),
    addPostcssPlugins([require('tailwindcss'), require('autoprefixer')]),
  ),
}
