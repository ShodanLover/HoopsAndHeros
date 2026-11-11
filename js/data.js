/* Basketball Empire — static game data & balance tables. Add content here without touching systems. */
(function (root) {
  'use strict';
  const BE = (root.BE = root.BE || {});

  const balance = {
    oppBase: 5.2,          // per-player opponent power at global stage 0
    oppGrowth: [1.3, 1.46, 1.5, 1.54, 1.57, 1.6, 1.62, 1.64, 1.66, 1.68], // per-stage growth by world
    oppGrowthRift: 1.7,       // per global stage
    champMult: [1.0, 1.06, 1.12],
    rewardBase: 6,         // cash per win at stage 0
    rewardGrowth: 1.32,
    champReward: 12,       // championship round reward multiplier
    lossReward: 0.2,
    farmReward: 0.85,
    lvlCostBase: 9,
    lvlCostGrowth: 1.135,
    lvlPowerGrowth: 1.07,
    milestoneEvery: 25,
    milestoneMult: 2,
    starPower: 0.3,        // +30% per extra star
    passiveBase: 0.02,     // fraction of stage reward per second (before facilities)
    offlineBaseEff: 0.4,
    offlineBaseCapH: 3,
    tpPerSecBase: 0.02,
    fansPerWinBase: 3,
    fansGrowth: 1.16,
    maxLevelBase: 400,
    growthCostGrowth: 1.07, // per level, for Team Growth stats
    growthCostStage: 1.0,  // growth prices scale with rewardGrowth^(this * current stage), so a level always costs a few wins
    growthCapBase: 25,      // Team Growth level cap in World 1 ...
    growthCapPerWorld: 10,  // ... plus this per world reached
  };

  const attrs = [
    { k: 'sht', name: 'Shooting', short: 'SHT' },
    { k: 'thr', name: 'Three-Point', short: '3PT' },
    { k: 'hnd', name: 'Ball Handling', short: 'HND' },
    { k: 'pas', name: 'Passing', short: 'PAS' },
    { k: 'spd', name: 'Speed', short: 'SPD' },
    { k: 'str', name: 'Strength', short: 'STR' },
    { k: 'def', name: 'Defense', short: 'DEF' },
    { k: 'stl', name: 'Stealing', short: 'STL' },
    { k: 'blk', name: 'Blocking', short: 'BLK' },
    { k: 'reb', name: 'Rebounding', short: 'REB' },
    { k: 'sta', name: 'Stamina', short: 'STA' },
    { k: 'iq', name: 'Basketball IQ', short: 'IQ' },
  ];

  const positions = {
    PG: { name: 'Point Guard', w: { sht: 1, thr: 1.2, hnd: 1.6, pas: 1.6, spd: 1.3, str: 0.4, def: 0.9, stl: 1.1, blk: 0.3, reb: 0.4, sta: 0.8, iq: 1.4 }, h: [180, 193] },
    SG: { name: 'Shooting Guard', w: { sht: 1.5, thr: 1.6, hnd: 1.2, pas: 0.9, spd: 1.2, str: 0.5, def: 1, stl: 1, blk: 0.4, reb: 0.5, sta: 0.8, iq: 1 }, h: [188, 198] },
    SF: { name: 'Small Forward', w: { sht: 1.3, thr: 1.1, hnd: 1, pas: 0.9, spd: 1.1, str: 0.9, def: 1.2, stl: 0.9, blk: 0.7, reb: 0.9, sta: 1, iq: 1 }, h: [196, 206] },
    PF: { name: 'Power Forward', w: { sht: 1, thr: 0.6, hnd: 0.6, pas: 0.7, spd: 0.8, str: 1.5, def: 1.2, stl: 0.6, blk: 1.1, reb: 1.5, sta: 1, iq: 0.9 }, h: [201, 211] },
    C: { name: 'Center', w: { sht: 0.9, thr: 0.3, hnd: 0.4, pas: 0.6, spd: 0.6, str: 1.7, def: 1.3, stl: 0.4, blk: 1.7, reb: 1.7, sta: 0.9, iq: 0.9 }, h: [206, 221] },
  };

  const rarities = [
    { k: 'common', name: 'Common', color: '#a9b4c2', glow: '#cfd8e3', mult: 1, ovr: [40, 52], cap: 12, shards: 5, costMult: 1 },
    { k: 'uncommon', name: 'Uncommon', color: '#38d996', glow: '#7dffc4', mult: 1.7, ovr: [50, 61], cap: 14, shards: 10, costMult: 1.1 },
    { k: 'rare', name: 'Rare', color: '#3aa8ff', glow: '#8fd1ff', mult: 2.8, ovr: [59, 70], cap: 16, shards: 25, costMult: 1.25 },
    { k: 'epic', name: 'Epic', color: '#b46bff', glow: '#dcb6ff', mult: 4.6, ovr: [68, 79], cap: 18, shards: 60, costMult: 1.45 },
    { k: 'legendary', name: 'Legendary', color: '#ffb22e', glow: '#ffe08a', mult: 7.6, ovr: [78, 88], cap: 20, shards: 150, costMult: 1.7 },
    { k: 'mythic', name: 'Mythic', color: '#ff3f7a', glow: '#ff9ec0', mult: 12.5, ovr: [87, 96], cap: 22, shards: 400, costMult: 2 },
  ];

  const archetypes = [
    { k: 'sharpshooter', name: 'Sharpshooter', boost: { thr: 14, sht: 10, iq: 4 }, pos: ['SG', 'SF', 'PG'], ability: { k: 'deadeye', name: 'Deadeye', desc: '+12% three-point accuracy' } },
    { k: 'slasher', name: 'Slasher', boost: { spd: 12, hnd: 8, str: 4 }, pos: ['SG', 'SF', 'PG'], ability: { k: 'posterizer', name: 'Posterizer', desc: 'Dunks more often, +10% at the rim' } },
    { k: 'general', name: 'Floor General', boost: { pas: 14, iq: 10, hnd: 6 }, pos: ['PG'], ability: { k: 'dimes', name: 'Dime Dropper', desc: 'Assisted shots +8% for teammates' } },
    { k: 'lockdown', name: 'Lockdown Defender', boost: { def: 14, stl: 10, spd: 4 }, pos: ['SG', 'SF', 'PG'], ability: { k: 'clamps', name: 'Clamps', desc: '+15% steal chance' } },
    { k: 'rim', name: 'Rim Protector', boost: { blk: 16, def: 8, str: 6 }, pos: ['C', 'PF'], ability: { k: 'rejection', name: 'Rejection', desc: '+40% block chance' } },
    { k: 'glass', name: 'Glass Cleaner', boost: { reb: 16, str: 8, sta: 4 }, pos: ['C', 'PF'], ability: { k: 'boards', name: 'Board Master', desc: '+30% rebound chance' } },
    { k: 'twoway', name: 'Two-Way Star', boost: { def: 6, sht: 6, spd: 4, iq: 4 }, pos: ['SF', 'SG', 'PF'], ability: { k: 'twoway', name: 'Two-Way', desc: '+5% on every action' } },
    { k: 'showman', name: 'Showman', boost: { hnd: 12, spd: 6, sht: 4 }, pos: ['PG', 'SG', 'SF'], ability: { k: 'showtime', name: 'Showtime', desc: 'Highlights charge energy faster, +fans' } },
    { k: 'post', name: 'Post Scorer', boost: { str: 12, sht: 8, reb: 6 }, pos: ['PF', 'C'], ability: { k: 'bully', name: 'Bully Ball', desc: '+12% post-up success' } },
  ];

  const personalities = [
    { k: 'leader', name: 'Leader', desc: '+3% team power' },
    { k: 'hothead', name: 'Hothead', desc: 'Big plays when energized' },
    { k: 'joker', name: 'Joker', desc: '+5% fans from wins' },
    { k: 'assassin', name: 'Silent Assassin', desc: '+10% shooting in clutch time' },
    { k: 'showboat', name: 'Showboat', desc: 'Celebrates loudly, +energy on dunks' },
    { k: 'workhorse', name: 'Workhorse', desc: 'Stamina drains 30% slower' },
    { k: 'underdog', name: 'Underdog', desc: '+8% power when trailing' },
    { k: 'mentor', name: 'Mentor', desc: '+5% training point gain' },
  ];

  const celebrations = ['fist', 'flex', 'shimmy', 'sky', 'spin', 'flip'];

  const firstNames = ['Marcus', 'Dante', 'Jalen', 'Theo', 'Malik', 'Andre', 'Rico', 'Desmond', 'Tariq', 'Mateo', 'Kenji', 'Luka', 'Omari', 'Isaiah', 'Xavier', 'Darnell', 'Felipe', 'Jamal', 'Nico', 'Tobias', 'Cyrus', 'Ezekiel', 'Bram', 'Kofi', 'Rashad', 'Dmitri', 'Santiago', 'Hiro', 'Quentin', 'Amari', 'Jaxon', 'Elijah', 'Ravi', 'Tyrell', 'Bastian', 'Kwame', 'Leon', 'Mason', 'Gideon', 'Idris', 'Julian', 'Kai', 'Lamar', 'Moses', 'Nate', 'Oscar', 'Pierre', 'Rafael', 'Silas', 'Trey', 'Uriel', 'Vince', 'Wendell', 'Yusuf', 'Zion', 'Aaron', 'Bodhi', 'Caleb', 'Dorian', 'Emeka', 'Finn', 'Grant', 'Hassan', 'Ivan', 'Jabari', 'Kendrick', 'Lorenzo', 'Milo', 'Nikolai', 'Otis', 'Paolo', 'Reggie', 'Stefan', 'Terrence', 'Ulises', 'Vaughn', 'Winston', 'Yannick', 'Zeke', 'Arlo', 'Beau', 'Cedric', 'Darius', 'Emil', 'Fabian', 'Gus', 'Hector', 'Ike', 'Jonah', 'Keon', 'Lucian', 'Montrell', 'Nash', 'Orlando', 'Percy', 'Quincy', 'Roman', 'Sol', 'Thiago'];
  const lastNames = ['Bell', 'Okafor', 'Vasquez', 'Holloway', 'Brightwater', 'Kowalski', 'Mbeki', 'Castellano', 'Fairbanks', 'Nakamura', 'Ashford', 'Delacroix', 'Osei', 'Petrov', 'Quarles', 'Redmond', 'Sterling', 'Thorne', 'Underwood', 'Valdez', 'Whitlock', 'Yarbrough', 'Zeller', 'Abernathy', 'Blackwood', 'Crenshaw', 'Dubois', 'Ellington', 'Fontaine', 'Greer', 'Hargrove', 'Iwu', 'Jessup', 'Kincaid', 'Lockhart', 'Mancini', 'Nwosu', 'Ortega', 'Pemberton', 'Ridley', 'Santos', 'Tillman', 'Upshaw', 'Vance', 'Westbrooke', 'Xiong', 'Yeager', 'Zamora', 'Adeyemi', 'Banks', 'Cortez', 'Drummond', 'Easley', 'Fitzgerald', 'Galloway', 'Hollis', 'Ingram', 'Jovanovic', 'Kimura', 'Langston', 'Monroe', 'Novak', 'Oduya', 'Pruitt', 'Rhodes', 'Sinclair', 'Tran', 'Vukovic', 'Wilder', 'Archer', 'Booker', 'Calloway', 'Dawkins', 'Eze', 'Ferreira', 'Gaines', 'Haddad', 'Ivers', 'Jeter', 'Koenig', 'Lindqvist', 'Mercer', 'Nakashima', 'Oyelaran', 'Prince', 'Ramos', 'Sato', 'Tavares', 'Ueda', 'Villanueva', 'Watts', 'Youngblood'];
  const nicknames = ['Bricks', 'Turbo', 'The Courier', 'Hops', 'Ice', 'Smooth', 'Big Smooth', 'Splash', 'Dime', 'Glide', 'Showtime', 'The Wall', 'Flash', 'Boomer', 'Silk', 'Thunder', 'Jet', 'Rook', 'Buckets', 'Swish', 'Velvet Hands', 'Hook Shot', 'Ghost', 'Tank', 'Lightning', 'Sugar', 'Chef', 'Hammer', 'Highrise', 'Pogo', 'The Professor', 'Updraft', 'Blaze', 'Cash', 'Ace', 'Butter', 'Spider', 'The Beast', 'Rocket', 'Breeze', 'Clutch', 'Diesel', 'Dagger', 'Nitro', 'Sniper', 'Stretch', 'Twister', 'Viper', 'Wizard', 'Zoom', 'Glass Eater', 'Crossover', 'Drifter', 'Pistol', 'Kingpin', 'Skyline', 'Frostbite', 'Comet', 'Atlas', 'Nova'];
  const opponentNicks = ['Big Tony', 'Lil Ray', 'Old Man Gus', 'Corner Kev', 'Sneaky Sal', 'Uncle Mo', 'Hoop Dreams Hank', 'Tall Paul', 'Fast Freddie', 'Jumpin Jay'];

  const skinTones = ['#f6d3b3', '#eabf98', '#d9a272', '#c68a5a', '#a86b45', '#8a5634', '#6b3f26', '#4d2c1b'];
  const hairColors = ['#121014', '#2b1d14', '#4a2f1e', '#7a4b26', '#b07a3c', '#d9b26b', '#a33b22', '#d6d6d6', '#3557c7', '#e2457a'];
  const hairStyles = ['buzz', 'afro', 'fade', 'braids', 'bald', 'curls', 'mohawk', 'flattop', 'locs', 'bun', 'spiky', 'waves'];
  const facialHair = ['none', 'none', 'none', 'stubble', 'goatee', 'beard', 'mustache'];

  const formats = { '1v1': { size: 1, label: '1v1 Streetball' }, '3v3': { size: 3, label: '3v3 Half-Court' }, '5v5': { size: 5, label: '5v5 Full Team' } };

  const worlds = [
    {
      name: 'Neighborhood Streetball', short: 'Streetball', arena: 'The Cracked Blacktop', color: '#ff7a2f', set: 'Asphalt', champ: 'Block Party Classic',
      tagline: 'Chain nets, cracked asphalt, and something to prove.',
      formats: ['1v1', '1v1', '3v3', '3v3', '3v3', '5v5', '5v5', '5v5', '5v5', '5v5'],
      teams: ['Lil Ray', 'Corner Kev', 'Hydrant Heroes', 'Alley Cats', 'Chain Net Crew', 'Blacktop Bandits', 'Fast Freddie\'s Five', 'Big Tony\'s Crew', 'Old Man Gus & Co', 'Kings of 5th Street'],
      unlocks: ['Your 5-player squad', 'Recruiting', 'Facilities', 'Head Coach'],
      theme: { sky: ['#ff9a5a', '#5b3a8c'], floor: '#4a4e57', floor2: '#3d414a', line: '#f2f2f2', paint: '#c2462b', stands: 'fence', crowd: 0.35 },
    },
    {
      name: 'High School Basketball', short: 'High School', arena: 'Westfield High Gym', color: '#2fb6ff', set: 'Varsity', champ: 'State Championship',
      tagline: 'Friday nights, pep bands, and packed bleachers.',
      formats: Array(10).fill('5v5'),
      teams: ['Lincoln Lynx', 'Eastside Eagles', 'Riverdale Rams', 'Oak Hill Owls', 'Central Comets', 'Summit Spartans', 'Bayview Bulldogs', 'Northgate Knights', 'Granite Grizzlies', 'St. Vincent Saints'],
      unlocks: ['Full-court 5v5', 'Tactics', 'Skill Contests', 'Season Pass'],
      theme: { sky: ['#2b3550', '#1a2033'], floor: '#d9a35f', floor2: '#c98f4b', line: '#ffffff', paint: '#1f6fd1', stands: 'bleachers', crowd: 0.5 },
    },
    {
      name: 'College Basketball', short: 'College', arena: 'Memorial Fieldhouse', color: '#ff4d6d', set: 'Campus', champ: 'March Mayhem',
      tagline: 'Student sections, fight songs, and bracket madness.',
      formats: Array(10).fill('5v5'),
      teams: ['Coastal Tech', 'Midstate Miners', 'Ivy Ridge', 'Desert State', 'Lakeshore U', 'Pinewood A&M', 'Capital City', 'Mountain West', 'Southern Bay', 'Royal Oak University'],
      unlocks: ['Gear crafting', 'Development League', 'Weekly Tournament', 'Legacy (prestige)'],
      theme: { sky: ['#1b1330', '#0d0a1a'], floor: '#e0b070', floor2: '#cf9b58', line: '#ffffff', paint: '#b3123a', stands: 'arena', crowd: 0.7 },
    },
    {
      name: 'Regional Pro League', short: 'Regional Pro', arena: 'Harbor Center', color: '#16d9b0', set: 'Pro Circuit', champ: 'Regional Finals',
      tagline: 'Your first paychecks. Your first jumbotron.',
      formats: Array(10).fill('5v5'),
      teams: ['Harbor Hawks', 'Steel City Smelters', 'Prairie Twisters', 'Bay Mariners', 'Copper Coyotes', 'Delta Gators', 'Ridge Runners', 'Valley Vipers', 'Port Pirates', 'Canyon Kings'],
      unlocks: ['Medical Center', 'Stadium upgrades', 'Auto-coaching'],
      theme: { sky: ['#0b1f2a', '#061016'], floor: '#d69a58', floor2: '#c4884a', line: '#e8fff9', paint: '#0d8f75', stands: 'arena', crowd: 0.8 },
    },
    {
      name: 'National Pro League', short: 'National Pro', arena: 'Capital Dome', color: '#ffd23f', set: 'Primetime', champ: 'The Finals',
      tagline: 'Primetime broadcasts and sold-out domes.',
      formats: Array(10).fill('5v5'),
      teams: ['Metro Monarchs', 'Coastline Waves', 'Midnight Ravens', 'Golden Gate Titans', 'Lone Star Outlaws', 'Empire Sentinels', 'Great Lakes Storm', 'Bayou Kings', 'Rocky Peak Lions', 'Capital Dynasty'],
      unlocks: ['Legendary gear sets', 'Bigger offline cap'],
      theme: { sky: ['#1a1405', '#0a0802'], floor: '#e7b979', floor2: '#d6a463', line: '#ffffff', paint: '#2d2d6e', stands: 'arena', crowd: 0.9 },
    },
    {
      name: 'International Basketball', short: 'International', arena: 'World Arena', color: '#4dff7a', set: 'Global', champ: 'Intercontinental Cup',
      tagline: 'Flags in the stands. A whole planet watching.',
      formats: Array(10).fill('5v5'),
      teams: ['Team Aurora', 'Southern Cross', 'Iberian Armada', 'Nordic Frost', 'Pacific Dragons', 'Sahara Suns', 'Andes Condors', 'Balkan Wolves', 'Celtic Storm', 'Samurai Blue'],
      unlocks: ['Global recruits', 'International gear'],
      theme: { sky: ['#0b2312', '#04110a'], floor: '#cfa36a', floor2: '#bd9058', line: '#ffffff', paint: '#1a6d36', stands: 'flags', crowd: 0.95 },
    },
    {
      name: 'Global Championship', short: 'Global', arena: 'The Golden Coliseum', color: '#ff9f1c', set: 'Champion', champ: 'World Crown',
      tagline: 'Only the best organizations on Earth make it here.',
      formats: Array(10).fill('5v5'),
      teams: ['Apex United', 'Titan Collective', 'Royal Phoenix', 'Solar Kings', 'Obsidian Order', 'Crimson Tide XI', 'Valhalla Five', 'Sapphire Syndicate', 'Iron Dynasty', 'The Golden Crown'],
      unlocks: ['Champion gear set'],
      theme: { sky: ['#2a1a00', '#120b00'], floor: '#f0c27a', floor2: '#ddaa60', line: '#fff3d6', paint: '#a8740d', stands: 'gold', crowd: 1 },
    },
    {
      name: 'Legends Division', short: 'Legends', arena: 'Neon Legends Hall', color: '#c86bff', set: 'Legend', champ: 'Legends Invitational',
      tagline: 'Retired icons come back for one more run.',
      formats: Array(10).fill('5v5'),
      teams: ['Old School Allstars', 'Retro Rockets', 'Hardwood Heroes', 'Vintage Vipers', 'Classic Kings', 'Golden Era Giants', 'Throwback Thunder', 'Era Legends', 'Ring Collectors', 'The Immortals'],
      unlocks: ['Legend gear set'],
      theme: { sky: ['#1a0730', '#07020f'], floor: '#2a1b40', floor2: '#24163a', line: '#ff5cf0', paint: '#5a1d99', stands: 'neon', crowd: 1 },
    },
    {
      name: 'Hall of Fame', short: 'Hall of Fame', arena: 'Marble Hall', color: '#f5e6c4', set: 'Immortal', champ: 'Enshrinement Games',
      tagline: 'Statues, banners, and history on every wall.',
      formats: Array(10).fill('5v5'),
      teams: ['Bronze Busts', 'Marble Masters', 'Hall Guardians', 'Banner Raisers', 'Jersey Retirees', 'Ring of Honor', 'Pantheon Five', 'Statue Squad', 'Hall Keepers', 'The Enshrined'],
      unlocks: ['Immortal gear set'],
      theme: { sky: ['#2a2620', '#12100c'], floor: '#e9e2d0', floor2: '#ddd5c0', line: '#b08d3c', paint: '#3b3225', stands: 'marble', crowd: 1 },
    },
    {
      name: 'Basketball Multiverse', short: 'Multiverse', arena: 'The Rift', color: '#5cf2ff', set: 'Cosmic', champ: 'Multiverse Crown',
      tagline: 'Every timeline, every legend, one court.',
      formats: Array(10).fill('5v5'),
      teams: ['Rift Walkers', 'Quantum Quintet', 'Nebula Nets', 'Void Dunkers', 'Paradox Five', 'Starborn', 'Event Horizon', 'Cosmic Ballers', 'Dimension X', 'The Infinite'],
      unlocks: ['Cosmic gear', 'Endless Multiverse Rifts'],
      theme: { sky: ['#06021a', '#000000'], floor: '#120a3a', floor2: '#0e0830', line: '#5cf2ff', paint: '#3d1fa8', stands: 'cosmic', crowd: 1 },
    },
  ];

  // Features unlock by lifetime best global stage cleared (g). Order = intro order.
  const features = {
    recruit: { g: 1, name: 'Recruiting', icon: 'recruit' },
    facilities: { g: 2, name: 'Facilities', icon: 'empire' },
    missions: { g: 2, name: 'Missions', icon: 'missions' },
    daily: { g: 2, name: 'Daily Rewards', icon: 'daily' },
    coaches: { g: 4, name: 'Coaches', icon: 'coach' },
    shop: { g: 3, name: 'Shop', icon: 'shop' },
    gear: { g: 5, name: 'Equipment', icon: 'gear' },
    training: { g: 6, name: 'Attribute Training', icon: 'train' },
    pass: { g: 8, name: 'Season Pass', icon: 'pass' },
    events: { g: 10, name: 'Skill Contests', icon: 'events' },
    tactics: { g: 10, name: 'Tactics', icon: 'tactics' },
    social: { g: 12, name: 'Leagues & Social', icon: 'social' },
    tourney: { g: 14, name: 'Weekly Tournament', icon: 'trophy' },
    craft: { g: 20, name: 'Gear Crafting', icon: 'craft' },
    division: { g: 20, name: 'Development League', icon: 'division' },
    prestige: { g: 20, name: 'Legacy', icon: 'legacy' },
    autocoach: { g: 30, name: 'Auto-Coaching', icon: 'auto' },
  };

  // Team Growth: franchise-wide stats bought with cash from minute one. fx values are per level.
  // Effects: power (team power), cash (all cash), passive (idle income), fans, stamina (less drain), shoot/def/reb (sim bonuses).
  const growth = [
    { k: 'offense', name: 'Offense', icon: 'ball', color: '#ff7a2f', base: 4, fx: { power: 0.015, shoot: 0.002 } },
    { k: 'defense', name: 'Defense', icon: 'shield', color: '#3aa8ff', base: 5, fx: { power: 0.015, def: 0.002 } },
    { k: 'conditioning', name: 'Conditioning', icon: 'dumbbell', color: '#38d996', base: 7, fx: { power: 0.0075, stamina: 0.005 } },
    { k: 'hustle', name: 'Hustle', icon: 'steal', color: '#ffd23f', base: 8, fx: { power: 0.0075, reb: 0.003 } },
    { k: 'clutch', name: 'Clutch Gene', icon: 'fire', color: '#ff4d6d', base: 10, fx: { power: 0.0075, shoot: 0.003 } },
    { k: 'playmaking', name: 'Playmaking', icon: 'swap', color: '#c86bff', base: 10, fx: { power: 0.0075, shoot: 0.001, def: 0.001 } },
    { k: 'revenue', name: 'Gate Revenue', icon: 'cash', color: '#38d996', base: 8, fx: { cash: 0.02 } },
    { k: 'hype', name: 'Fan Hype', icon: 'social', color: '#ff9f1c', base: 12, fx: { passive: 0.03, fans: 0.02 } },
  ];

  // Franchise Story: one chain of small goals, always one active, pinned above the tabs with a GO button.
  // Goals are lifetime totals (stats), best stage reached ('best'), roster size or collection count, so progress
  // only moves forward. 'go' is where the GO button sends the player.
  const questLine = (() => {
    const q = [];
    const add = (text, stat, n, reward, go) => q.push({ id: 'q' + (q.length + 1), text, stat, n, reward, go });
    add('Win your first game', 'wins', 1, { gems: 10 }, 'play');
    add('Level up Bricks', 'levelups', 1, { gems: 10 }, 'team');
    add('Upgrade Team Growth 3 times', 'growthUps', 3, { gems: 10, cash: 1 }, 'growth');
    add('Recruit your first athlete', 'pulls', 1, { gems: 15 }, 'recruit');
    add('Win 3 games', 'wins', 3, { gems: 10 }, 'play');
    add('Reach Game 3: your squad goes 3v3', 'best', 2, { gems: 15, tickets: 1 }, 'play');
    add('Upgrade Team Growth 10 times', 'growthUps', 10, { gems: 15 }, 'growth');
    add('Level up athletes 10 times', 'levelups', 10, { gems: 15 }, 'team');
    add('Own 3 athletes', 'roster', 3, { gems: 15 }, 'recruit');
    add('Build your first facility', 'facilityUps', 1, { gems: 15 }, 'empire');
    add('Reach Game 6: your squad goes 5v5', 'best', 5, { gems: 20, tickets: 1 }, 'play');
    add('Own 5 athletes', 'roster', 5, { gems: 20 }, 'recruit');
    add('Use abilities 3 times', 'abilities', 3, { gems: 10 }, 'play');
    add('Win 15 games', 'wins', 15, { gems: 20 }, 'play');
    add('Upgrade Team Growth 25 times', 'growthUps', 25, { gems: 20 }, 'growth');
    add('Level up athletes 40 times', 'levelups', 40, { gems: 20 }, 'team');
    add('Reach the Block Party Classic (Game 10)', 'best', 9, { gems: 25 }, 'play');
    add('Win the Block Party Classic', 'championships', 1, { gems: 40, tickets: 2 }, 'champ');
    const cum = { wins: 15, levelups: 40, growthUps: 25, pulls: 1, facilityUps: 1, gearUps: 0, abilities: 3, contests: 0, unique: 5 };
    for (let w = 1; w < 10; w++) {
      const W = worlds[w], g0 = w * 10, gem = 20 + w * 10;
      cum.wins += 25 + w * 15; cum.levelups += 60 + w * 40; cum.growthUps += 30 + w * 10; cum.pulls += 5 + w * 3; cum.facilityUps += 8 + w * 4;
      cum.unique += 6 + w * 2; cum.gearUps += 3 + w * 2; cum.abilities += 10 + w * 5; cum.contests += 3;
      add('Win ' + cum.wins + ' games', 'wins', cum.wins, { gems: gem }, 'play');
      add('Reach ' + W.short + ' Game 3', 'best', g0 + 2, { gems: gem, cashMinutes: 10 }, 'play');
      add('Upgrade Team Growth ' + cum.growthUps + ' times', 'growthUps', cum.growthUps, { gems: gem }, 'growth');
      add('Level up athletes ' + cum.levelups + ' times', 'levelups', cum.levelups, { gems: gem }, 'team');
      add('Recruit ' + cum.pulls + ' athletes', 'pulls', cum.pulls, { gems: gem, tickets: 1 }, 'recruit');
      add('Discover ' + cum.unique + ' different athletes', 'unique', cum.unique, { gems: gem }, 'recruit');
      add('Reach ' + W.short + ' Game 6', 'best', g0 + 5, { gems: gem, tickets: 1 }, 'play');
      add('Upgrade facilities or coaches ' + cum.facilityUps + ' times', 'facilityUps', cum.facilityUps, { gems: gem }, 'empire');
      add('Use abilities ' + cum.abilities + ' times', 'abilities', cum.abilities, { gems: gem }, 'play');
      if (w >= 2) add('Upgrade, merge or craft gear ' + cum.gearUps + ' times', 'gearUps', cum.gearUps, { gems: gem }, 'team');
      if (w >= 1) add('Play ' + cum.contests + ' skill contests', 'contests', cum.contests, { gems: gem, eventTickets: 1 }, 'events');
      add('Reach the ' + W.champ, 'best', g0 + 9, { gems: gem + 10 }, 'play');
      add('Win the ' + W.champ, 'championships', w + 1, { gems: gem * 2, tickets: 2, eventTickets: 1 }, 'champ');
    }
    return q;
  })();

  const facilities = [
    { k: 'court', name: 'Home Court', desc: '+15% cash from wins', per: 0.15, base: 40, growth: 1.57, unlock: 2, max: 100, icon: 'court' },
    { k: 'gym', name: 'Weight Room', desc: '+7% team power', per: 0.07, base: 70, growth: 1.60, unlock: 2, max: 100, icon: 'gym' },
    { k: 'training', name: 'Training Facility', desc: '+20% training points & +4% power', per: 0.2, base: 120, growth: 1.62, unlock: 6, max: 100, icon: 'train' },
    { k: 'merch', name: 'Merch Store', desc: '+25% passive income', per: 0.25, base: 160, growth: 1.59, unlock: 5, max: 100, icon: 'merch' },
    { k: 'hq', name: 'Team Headquarters', desc: '+6% cash & power', per: 0.06, base: 900, growth: 1.70, unlock: 10, max: 100, icon: 'hq' },
    { k: 'scouting', name: 'Scouting Department', desc: 'Reveals opponent styles; +10% shards, cheaper Street Scout', per: 0.1, base: 1500, growth: 1.65, unlock: 10, max: 60, icon: 'scout' },
    { k: 'stadium', name: 'Stadium', desc: '+12% fans & +10% passive income', per: 0.12, base: 2.5e4, growth: 1.67, unlock: 20, max: 100, icon: 'stadium' },
    { k: 'academy', name: 'Youth Academy', desc: '+1 recruit ticket per 12h (per level, up to 6/day); boosts Dev League', per: 1, base: 6e4, growth: 1.80, unlock: 20, max: 12, icon: 'academy' },
    { k: 'medical', name: 'Medical Center', desc: '-6% stamina drain, +4% offline efficiency', per: 0.06, base: 3e5, growth: 1.70, unlock: 30, max: 50, icon: 'medical' },
  ];

  const coaches = [
    { k: 'head', name: 'Head Coach', who: 'Coach "Pops" Delgado', desc: '+8% team power', per: 0.08, base: 150, growth: 1.65, unlock: 4, max: 80 },
    { k: 'shooting', name: 'Shooting Coach', who: 'Lena "Splash" Moreau', desc: '+3% shot accuracy, +3% power', per: 0.03, base: 900, growth: 1.70, unlock: 8, max: 50 },
    { k: 'defense', name: 'Defensive Coordinator', who: 'Viktor Hale', desc: '+3% defense, +3% power', per: 0.03, base: 1800, growth: 1.70, unlock: 11, max: 50 },
    { k: 'business', name: 'Business Manager', who: 'Priya Castellanos', desc: '+10% all cash, +3% offline efficiency', per: 0.1, base: 2500, growth: 1.70, unlock: 12, max: 60 },
    { k: 'development', name: 'Player Development', who: 'Marcus "Prof" Reed', desc: '+12% training points, -2% level cost', per: 0.12, base: 6000, growth: 1.75, unlock: 15, max: 20 },
    { k: 'strength', name: 'Strength & Conditioning', who: 'Big Sam Okoro', desc: '+3% rebounding & stamina, +3% power', per: 0.03, base: 1.2e4, growth: 1.70, unlock: 18, max: 50 },
    { k: 'analytics', name: 'Analytics Guru', who: 'Dr. Ada Kwan', desc: '+2% tactic counter bonus; auto-tactics', per: 0.02, base: 5e4, growth: 1.75, unlock: 22, max: 30 },
    { k: 'recruiting', name: 'Recruiting Director', who: 'Sly Bentley', desc: '+10% shards; +1 free Pro Scout ticket daily at Lv 5', per: 0.1, base: 1.5e5, growth: 1.80, unlock: 25, max: 25 },
  ];

  // Accessory slots open by lifetime best stage (unlock). Drops only roll unlocked types.
  const gearTypes = [
    { k: 'shoes', name: 'Sneakers', slot: 'athlete', attr: 'spd', icon: 'shoe', unlock: 5 },
    { k: 'jersey', name: 'Jersey', slot: 'athlete', attr: 'sta', icon: 'jersey', unlock: 5 },
    { k: 'headband', name: 'Headband', slot: 'athlete', attr: 'sht', icon: 'headband', unlock: 10 },
    { k: 'wristband', name: 'Wristband', slot: 'athlete', attr: 'hnd', icon: 'wrist', unlock: 20 },
    { k: 'compression', name: 'Compression Sleeve', slot: 'athlete', attr: 'str', icon: 'sleeve', unlock: 30 },
    { k: 'ball', name: 'Basketball', slot: 'team', attr: 'thr', icon: 'ball', unlock: 15 },
    { k: 'trainer', name: 'Training Equipment', slot: 'team', attr: 'iq', icon: 'dumbbell', unlock: 25 },
  ];
  // Owned effects: power from the whole collection, even on the bench (per athlete, by rarity, x stars),
  // milestone bonuses per athlete level, world set bonuses by athletes discovered per world, and per gear piece.
  const owned = {
    athlete: [0.002, 0.003, 0.005, 0.008, 0.012, 0.02],
    starStep: 0.1,
    milestones: [10, 25, 50, 75, 100],
    milestoneBonus: 0.01,
    worldSets: [[10, 0.03], [20, 0.06], [30, 0.12]],
    gearPerRarity: 0.002,
    gearLevelStep: 0.05,
    gearCap: 1.0,
  };
  const gearRarityPct = [0.04, 0.07, 0.11, 0.17, 0.26, 0.4];
  const gearRarityAttr = [1, 2, 3, 4, 6, 8];

  const abilities = [
    { k: 'hype', name: 'Hype Up', desc: '+30% team power for 6 possessions', cost: 40, unlock: 0, color: '#ff7a2f' },
    { k: 'iso', name: 'Iso Play', desc: 'Your best scorer takes the next shot with +40% accuracy', cost: 30, unlock: 3, color: '#ffd23f' },
    { k: 'lockdown', name: 'Lockdown', desc: '+35% defense for the next 3 possessions', cost: 35, unlock: 10, color: '#3aa8ff' },
    { k: 'timeout', name: 'Timeout', desc: 'Restore stamina and gain +15 energy momentum', cost: 25, unlock: 14, color: '#38d996' },
  ];

  const tactics = {
    off: [
      { k: 'inside', name: 'Pound Inside', desc: 'Drives & post-ups. Beats Man defense.' },
      { k: 'balanced', name: 'Motion Offense', desc: 'Ball movement. Beats the Press.' },
      { k: 'outside', name: 'Let It Fly', desc: 'Threes & jumpers. Beats Zone.' },
    ],
    def: [
      { k: 'man', name: 'Man-to-Man', desc: 'Contest shooters. Beats Let It Fly.' },
      { k: 'zone', name: '2-3 Zone', desc: 'Pack the paint. Beats Pound Inside.' },
      { k: 'press', name: 'Full-Court Press', desc: 'Force turnovers. Beats Motion.' },
    ],
  };
  // counter[myOff][theirDef] => bonus sign
  const offCounters = { inside: 'man', balanced: 'press', outside: 'zone' };
  const defCounters = { man: 'outside', zone: 'inside', press: 'balanced' };

  const prestigeUpgrades = [
    { k: 'income', name: 'Dynasty Income', desc: '+30% cash from every source', per: 0.3, cost: 1, growth: 1.35, max: 200 },
    { k: 'power', name: 'Legacy Training', desc: '+20% team power', per: 0.2, cost: 1, growth: 1.35, max: 200 },
    { k: 'offline', name: 'Night Shift', desc: '+1h offline cap & +8% offline efficiency', per: 1, cost: 2, growth: 1.5, max: 20 },
    { k: 'scout', name: 'Scout Network', desc: '+1 free Pro Scout ticket per day & +20% shards', per: 1, cost: 3, growth: 1.7, max: 5 },
    { k: 'headstart', name: 'Head Start', desc: 'Start each run with cash equal to 2 min of progress per level & keep Lv 10 athletes', per: 1, cost: 2, growth: 1.6, max: 10 },
    { k: 'autotrain', name: 'Auto-Trainer', desc: 'NEW MECHANIC: spends 10% of income per level to auto-level your lineup', per: 0.1, cost: 5, growth: 2, max: 5 },
    { k: 'turbo', name: 'Turbo Mode', desc: 'Unlocks 4x match speed', per: 1, cost: 4, growth: 1, max: 1 },
    { k: 'clutch', name: 'Clutch Gene', desc: '-10% ability energy cost', per: 0.1, cost: 3, growth: 1.8, max: 4 },
    { k: 'goldrush', name: 'Gold Rush', desc: '+2% chance per level for wins to drop gems', per: 0.02, cost: 4, growth: 1.6, max: 10 },
    { k: 'secondunit', name: 'Second Unit', desc: '+100% Development League income', per: 1, cost: 3, growth: 1.6, max: 10 },
    { k: 'cosmetic_gold', name: 'Golden Legacy Court', desc: 'Exclusive cosmetic: gold court & jerseys', per: 1, cost: 10, growth: 1, max: 1, cosmetic: 'legacy' },
  ];

  const cosmetics = [
    { k: 'default', name: 'Franchise Classic', court: null, jersey: ['#ff6a1f', '#1b1f3a'], price: 0, source: 'Default' },
    { k: 'midnight', name: 'Midnight Blue', court: null, jersey: ['#2f6bff', '#0b1230'], price: 0, source: 'Default' },
    { k: 'crimson', name: 'Crimson Crew', court: null, jersey: ['#e8263f', '#20080d'], price: 0, source: 'Default' },
    { k: 'neon', name: 'Neon Nights', court: { floor: '#1a0f33', floor2: '#160c2c', line: '#39f3ff', paint: '#ff2bd6' }, jersey: ['#39f3ff', '#1a0f33'], price: 400, source: 'Shop (400 gems)' },
    { k: 'retro', name: 'Retro Hardwood', court: { floor: '#c98b4a', floor2: '#b97a3c', line: '#fff6dd', paint: '#3b7d4c' }, jersey: ['#f2c14e', '#2f5d3a'], price: 400, source: 'Shop (400 gems)' },
    { k: 'ice', name: 'Ice Palace', court: { floor: '#dff3ff', floor2: '#cfeaff', line: '#3a7bd5', paint: '#7cc6ff' }, jersey: ['#e8f7ff', '#2a5fa8'], price: 600, source: 'Shop (600 gems)' },
    { k: 'pass', name: 'Season Champion', court: null, jersey: ['#ffd23f', '#5a1d99'], price: -1, source: 'Season Pass premium tier 30' },
    { k: 'legacy', name: 'Golden Legacy', court: { floor: '#3a2b07', floor2: '#33260a', line: '#ffd76a', paint: '#a8740d' }, jersey: ['#ffd76a', '#2a1d02'], price: -1, source: 'Legacy perk (prestige)' },
    { k: 'vip', name: 'VIP Platinum', court: { floor: '#2b2f38', floor2: '#262a32', line: '#e6ecf5', paint: '#5f6b7d' }, jersey: ['#e6ecf5', '#2b2f38'], price: -1, source: 'VIP membership' },
  ];

  const loginRewards = [
    { cash: 3, label: 'Cash' },
    { gems: 30 },
    { tickets: 1 },
    { tp: 40, cash: 4 },
    { gems: 50 },
    { gearChest: 2 },
    { tickets: 3, gems: 80 },
  ];

  const missionPool = {
    daily: [
      { k: 'wins', text: 'Win {n} games', n: [8, 15, 25], stat: 'wins' },
      { k: 'threes', text: 'Make {n} three-pointers', n: [10, 20, 30], stat: 'threes' },
      { k: 'dunks', text: 'Throw down {n} dunks', n: [6, 12, 20], stat: 'dunks' },
      { k: 'levels', text: 'Level up athletes {n} times', n: [10, 20, 40], stat: 'levelups' },
      { k: 'growth', text: 'Upgrade Team Growth {n} times', n: [10, 25, 50], stat: 'growthUps' },
      { k: 'ability', text: 'Use abilities {n} times', n: [5, 10, 15], stat: 'abilities' },
      { k: 'facility', text: 'Upgrade facilities {n} times', n: [3, 6, 10], stat: 'facilityUps' },
      { k: 'recruit', text: 'Recruit {n} athletes', n: [1, 3, 5], stat: 'pulls' },
      { k: 'blocks', text: 'Record {n} blocks', n: [5, 10, 15], stat: 'blocks' },
      { k: 'steals', text: 'Record {n} steals', n: [5, 10, 15], stat: 'steals' },
      { k: 'contest', text: 'Play {n} skill contests', n: [1, 2, 3], stat: 'contests', feature: 'events' },
      { k: 'train', text: 'Train attributes {n} times', n: [3, 6, 10], stat: 'trains', feature: 'training' },
    ],
    weekly: [
      { k: 'wins', text: 'Win {n} games', n: [80, 150], stat: 'wins' },
      { k: 'stages', text: 'Clear {n} new stages', n: [5, 10], stat: 'stagesCleared' },
      { k: 'pulls', text: 'Recruit {n} athletes', n: [10, 20], stat: 'pulls' },
      { k: 'levels', text: 'Level up athletes {n} times', n: [150, 300], stat: 'levelups' },
      { k: 'gear', text: 'Upgrade or merge gear {n} times', n: [10, 25], stat: 'gearUps', feature: 'gear' },
      { k: 'contests', text: 'Play {n} skill contests', n: [8, 15], stat: 'contests', feature: 'events' },
      { k: 'champ', text: 'Win {n} championship games', n: [3, 6], stat: 'champWins' },
    ],
  };

  const achievements = [
    { k: 'wins', name: 'Winner', stat: 'wins', tiers: [1, 10, 50, 250, 1000, 5000, 25000], icon: 'trophy' },
    { k: 'threes', name: 'Splash Brother', stat: 'threes', tiers: [10, 100, 1000, 5000, 25000], icon: 'ball' },
    { k: 'dunks', name: 'Posterizer', stat: 'dunks', tiers: [10, 100, 1000, 5000, 25000], icon: 'dunk' },
    { k: 'blocks', name: 'Not In My House', stat: 'blocks', tiers: [10, 100, 750, 4000], icon: 'block' },
    { k: 'steals', name: 'Pickpocket', stat: 'steals', tiers: [10, 100, 750, 4000], icon: 'steal' },
    { k: 'collect', name: 'Collector', stat: 'unique', tiers: [3, 10, 25, 50, 100, 200, 300], icon: 'recruit' },
    { k: 'pulls', name: 'Talent Scout', stat: 'pulls', tiers: [1, 10, 50, 200, 500, 1000], icon: 'recruit' },
    { k: 'legend', name: 'Living Legend', stat: 'legendaries', tiers: [1, 5, 15, 30], icon: 'star' },
    { k: 'mythic', name: 'Myth Maker', stat: 'mythics', tiers: [1, 3, 10], icon: 'star' },
    { k: 'world', name: 'World Traveler', stat: 'bestWorld', tiers: [2, 3, 4, 5, 6, 7, 8, 9, 10], icon: 'map' },
    { k: 'champs', name: 'Champion', stat: 'championships', tiers: [1, 3, 5, 10, 25, 50], icon: 'trophy' },
    { k: 'prestige', name: 'Dynasty', stat: 'prestiges', tiers: [1, 3, 5, 10, 25], icon: 'legacy' },
    { k: 'levelups', name: 'Grinder', stat: 'levelups', tiers: [10, 100, 1000, 5000, 20000], icon: 'up' },
    { k: 'growth', name: 'Franchise Builder', stat: 'growthUps', tiers: [10, 100, 500, 2000, 10000], icon: 'chart' },
    { k: 'cash', name: 'Money Maker', stat: 'cashEarned', tiers: [1e3, 1e6, 1e9, 1e12, 1e15, 1e18, 1e24], icon: 'cash' },
    { k: 'facility', name: 'Architect', stat: 'facilityUps', tiers: [5, 50, 250, 1000], icon: 'empire' },
    { k: 'gear', name: 'Gearhead', stat: 'gearUps', tiers: [5, 50, 250, 1000], icon: 'gear' },
    { k: 'contest', name: 'Showstopper', stat: 'contests', tiers: [1, 10, 50, 200], icon: 'events' },
    { k: 'streak', name: 'Loyal Fan', stat: 'loginDays', tiers: [3, 7, 30, 100, 365], icon: 'daily' },
    { k: 'perfect', name: 'Perfect Night', stat: 'perfectFT', tiers: [1, 5, 20], icon: 'ball' },
  ];
  const achievementGems = [10, 20, 40, 75, 120, 200, 300, 400, 500];

  // Real-money products. Prices are display labels; purchasing requires a platform provider.
  const products = [
    { sku: 'starter', name: 'Starter Bundle', price: '$1.99', once: true, grant: { gems: 500, tickets: 10, gearChest: 3, cosmetic: 'crimson' }, tag: 'Best value · once', desc: '500 gems, 10 Pro Scout tickets, 3 gear chests' },
    { sku: 'gems_s', name: 'Handful of Gems', price: '$0.99', grant: { gems: 100 }, desc: '100 gems' },
    { sku: 'gems_m', name: 'Pouch of Gems', price: '$4.99', grant: { gems: 550 }, desc: '550 gems (+10% bonus)' },
    { sku: 'gems_l', name: 'Bag of Gems', price: '$9.99', grant: { gems: 1200 }, desc: '1,200 gems (+20% bonus)' },
    { sku: 'gems_xl', name: 'Chest of Gems', price: '$19.99', grant: { gems: 2600 }, desc: '2,600 gems (+30% bonus)' },
    { sku: 'gems_xxl', name: 'Vault of Gems', price: '$49.99', grant: { gems: 7000 }, desc: '7,000 gems (+40% bonus)' },
    { sku: 'recruit_bundle', name: 'Scouting Combine', price: '$4.99', grant: { tickets: 15, gems: 200 }, desc: '15 Pro Scout tickets + 200 gems' },
    { sku: 'cosmetic_bundle', name: 'Arena Style Pack', price: '$2.99', grant: { cosmetic: ['neon', 'retro', 'ice'] }, desc: 'Neon Nights, Retro Hardwood & Ice Palace looks (cosmetic only)' },
    { sku: 'pass', name: 'Season Pass Premium', price: '$9.99', grant: { pass: true }, desc: 'Unlocks the premium reward track for this season' },
    { sku: 'vip', name: 'VIP Membership', price: '$14.99', once: true, grant: { vip: true }, desc: 'Permanent: no interstitial ads, +25% offline earnings, 4x speed, +40 gems daily, VIP Platinum look' },
  ];

  const gemShop = [
    { k: 'ticket1', name: 'Pro Scout Ticket', cost: 100, grant: { tickets: 1 } },
    { k: 'ticket10', name: '10 Pro Scout Tickets', cost: 900, grant: { tickets: 10 } },
    { k: 'tp', name: 'Training Crate', cost: 60, grant: { tpHours: 2 } },
    { k: 'cashbag', name: 'Cash Briefcase', cost: 80, grant: { cashMinutes: 30 } },
    { k: 'gearchest', name: 'Gear Chest', cost: 120, grant: { gearChest: 1 } },
    { k: 'autocoach', name: 'Auto-Coach License', cost: 600, grant: { autocoach: true }, once: true },
  ];

  const ads = {
    offline: { name: 'Double offline earnings', daily: 6 },
    tp: { name: 'Training materials', daily: 3 },
    daily: { name: 'Extra daily reward', daily: 1 },
    tourney: { name: 'Bonus tournament rewards', daily: 3 },
    ticket: { name: 'Free Pro Scout ticket', daily: 2 },
    freepro: { name: 'Free Pro Scout recruit', daily: 1 },
    freeevent: { name: 'Free Event Scout recruit', daily: 1 },
    contest: { name: 'Extra contest attempt', daily: 3 },
  };

  const alliances = [
    { k: 'a1', name: 'Rim Runners Collective', motto: 'Fast breaks, faster friends', members: 28 },
    { k: 'a2', name: 'Midnight Hoopers', motto: 'Ball never sleeps', members: 30 },
    { k: 'a3', name: 'The Paint Syndicate', motto: 'We live in the lane', members: 25 },
    { k: 'a4', name: 'Sunday League Legends', motto: 'Casual hoopers welcome', members: 22 },
    { k: 'a5', name: 'Banner Hunters', motto: 'Rings over everything', members: 30 },
  ];

  const aiFranchiseNames = ['Brooklyn Bricklayers', 'Sunset Swish', 'Iron Rim Club', 'Harbor Hoops Co', 'Velvet Dunk', 'Cobalt Crossovers', 'Golden Nets', 'Rust Belt Rebounders', 'Saltwater Shooters', 'Pine Box Ballers', 'Arctic Alley-Oops', 'Dust Devils', 'Neon Fadeaways', 'Copperhead Hoops', 'Lighthouse Lob City', 'Granite Guards', 'Backboard Bandits', 'Thunder Alley', 'Riverbend Rockets', 'Sky Hook Society', 'Paper Planes HC', 'Corner Three Club', 'Bayside Blockers', 'Red Clay Rollers', 'Mesa Monsoons', 'Ember Elite', 'Hardwood Heritage', 'Pivot Point', 'Tidal Triple', 'Midtown Mambas', 'Jade Jumpers', 'Ozone Outlaws', 'Phantom Pick & Roll', 'Cyclone Crew', 'Lakeside Lob', 'Summit Swishers', 'Desert Dime', 'Boardwalk Ballers', 'Northern Lights BC', 'Velocity Hoops', 'Crown Court', 'Echo Park Elite', 'Fast Break Factory', 'Glasswork Giants', 'Hilltop Hoopers', 'Indigo Isos', 'Juke Box Five', 'Keystone Kings', 'Lockdown Lab', 'Moonshot Squad'];

  const franchiseAdjectives = ['Blacktop', 'Downtown', 'Rooftop', 'Midnight', 'Concrete', 'Golden', 'Rising', 'Northside', 'Uptown', 'Southpaw'];
  const franchiseNouns = ['Ballers', 'Hoopers', 'Dynasty', 'Kings', 'Flight', 'Empire', 'Legends', 'Squad', 'Collective', 'Phoenix'];

  BE.data = {
    balance, attrs, positions, rarities, archetypes, personalities, celebrations, firstNames, lastNames, nicknames, opponentNicks,
    skinTones, hairColors, hairStyles, facialHair, formats, worlds, features, growth, questLine, facilities, coaches, gearTypes, gearRarityPct,
    gearRarityAttr, owned, abilities, tactics, offCounters, defCounters, prestigeUpgrades, cosmetics, loginRewards, missionPool,
    achievements, achievementGems, products, gemShop, ads, alliances, aiFranchiseNames, franchiseAdjectives, franchiseNouns,
  };
})(typeof window !== 'undefined' ? window : globalThis);
