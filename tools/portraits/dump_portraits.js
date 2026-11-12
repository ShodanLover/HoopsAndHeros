// Renders sample vector portraits (BE.athletes.portraitSVGRaw) to large PNGs, one folder per athlete,
// so they can be run through the agent-sprite-forge hibit finish for comparison.
//   node tools/portraits/dump_portraits.js <outDir> [count]
const path = require('path'), fs = require('fs');
const { chromium } = require('playwright');
(async () => {
  const out = path.resolve(process.argv[2] || 'art/portraits/source');
  const count = +(process.argv[3] || 8);
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + path.resolve(__dirname, '../../dist/basketball-empire.html'));
  await page.waitForFunction(() => window.BE && BE.athletes && BE.athletes.portraitSVGRaw);
  const svgs = await page.evaluate((n) => {
    const A = BE.athletes, cat = A.catalog, step = Math.floor(cat.length / n);
    const out = [];
    for (let i = 0; i < n; i++) {
      const t = cat[i * step];
      out.push({ id: t.id, svg: A.portraitSVGRaw(t, { colors: ['#ff6a1f', '#1b1f3a'] }) });
    }
    return out;
  }, count);
  for (const s of svgs) {
    const dir = path.join(out, String(s.id)); fs.mkdirSync(dir, { recursive: true });
    await page.setContent('<body style="margin:0;background:transparent">' + s.svg.replace('<svg', '<svg width="320" height="320"') + '</body>');
    await page.locator('svg').screenshot({ path: path.join(dir, 'frame_000.png'), omitBackground: true });
  }
  await browser.close();
  console.log('dumped', svgs.length, 'portraits to', out);
})();
