// Bundles the game into single self-contained HTML files.
//   dist/basketball-empire.html  — full standalone document (open directly or host anywhere)
//   dist/artifact.html           — page body for the claude.ai Artifact publisher (no <html>/<head> wrapper)
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
const js = scripts.map((f) => '/* ' + f + ' */\n' + fs.readFileSync(path.join(root, f), 'utf8')).join('\n');
const safeJs = js.replace(/<\/script/gi, '<\\/script');
const fonts = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;500;600;700&family=Press+Start+2P&display=swap">';
const body = '<div id="app"></div>\n<div id="modal-root"></div>\n<div id="toast-root"></div>\n<div id="coach-root"></div>\n<div id="fx-root"></div>';
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
const full = html
  .replace('<link rel="stylesheet" href="css/style.css">', () => '<style>\n' + css + '\n</style>')
  .replace(/<!--SCRIPTS-->[\s\S]*<!--\/SCRIPTS-->/, () => '<script>\n' + safeJs + '\n</script>');
fs.writeFileSync(path.join(root, 'dist/basketball-empire.html'), full);
const artifact = '<title>Basketball Empire</title>\n<meta name="theme-color" content="#0a0e1d">\n' + fonts + '\n<style>\n' + css + '\n</style>\n' + body + '\n<script>\n' + safeJs + '\n</script>\n';
fs.writeFileSync(path.join(root, 'dist/artifact.html'), artifact);
console.log('built', (full.length / 1024).toFixed(0) + ' KB', scripts.length, 'modules');
