// Test-only Babel config — lets Jest (CommonJS) load the app's native ES
// modules (public/js/**) for jsdom runtime tests. Does not affect how the
// browser loads these files (plain <script type="module">, unchanged).
module.exports = {
  presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
};
