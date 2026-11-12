// Win probability and stage length of the challenger stream against squad power ÷ opponent power, per squad size.
const BE = require('./load')();
const { stream: ST, athletes: A, util: U } = BE;
function team(power, size, n, seed) { const t = A.opponentTeam(25, n, { seed }); t.players.forEach((p) => { p.power = power / size; }); t.power = power; return t; }
for (const size of [1, 3, 5]) {
  const row = [];
  for (const r of [0.7, 0.85, 1, 1.1, 1.2, 1.35, 1.5, 2]) {
    const rng = U.mulberry32(42); let w = 0, n = 400, t = 0;
    for (let i = 0; i < n; i++) { const m = ST.create(team(100 * r, size, size, 1), team(100, size, 5, 2), { rng }); ST.simulate(m); if (m.winner === 0) { w++; } t += m.t; }
    row.push(r + ':' + (w / n * 100).toFixed(0) + '% ' + (t / n).toFixed(0) + 's');
  }
  console.log(size + '-man', row.join('  '));
}
