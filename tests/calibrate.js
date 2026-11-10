const BE = require('./load')();
const { sim, athletes: A, util: U } = BE;
function team(power, size, seed){ const t = A.opponentTeam(25, size, {seed}); t.players.forEach(p=>p.power=power/size); t.power=power; return t; }
for (const fmt of ['1v1','3v3','5v5']) {
  const size = BE.data.formats[fmt].size;
  const row = [];
  for (const r of [0.7,0.85,1,1.1,1.2,1.35,1.5,2]) {
    const rng = U.mulberry32(42); let w=0, n=400, pts=0, poss=0, feat=0;
    for (let i=0;i<n;i++){ const m=sim.createMatch(team(100*r,size,1),team(100,size,2),{format:fmt,rng}); while(!m.over){const e=sim.nextPossession(m); if(e.featured)feat++;} if(m.winner===0)w++; pts+=m.score[0]+m.score[1]; poss+=m.poss;}
    row.push(r+':'+(w/n*100).toFixed(0)+'%');
    if (r===1) console.log(fmt,'avg total pts',(pts/n).toFixed(1),'poss',(poss/n).toFixed(1),'featured',(feat/n).toFixed(1));
  }
  console.log(fmt, row.join('  '));
}
