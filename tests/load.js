// Loads the browser modules into a Node context for testing
const fs = require('fs'), path = require('path'), vm = require('vm');
module.exports = function load(extra) {
  const ctx = { console, Math, Date, JSON, setTimeout, clearTimeout, Object, Array, String, Number, Promise, Set, Map, isFinite, parseInt, escape, unescape, encodeURIComponent, decodeURIComponent,
    btoa: (s) => Buffer.from(s, 'binary').toString('base64'), atob: (s) => Buffer.from(s, 'base64').toString('binary') };
  ctx.globalThis = ctx; ctx.window = undefined;
  vm.createContext(ctx);
  for (const f of ['util', 'data', 'athletes', 'state', 'economy', 'sim', 'game'].concat(extra || [])) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f + '.js'), 'utf8'), ctx, { filename: f + '.js' });
  }
  return ctx.BE;
};
