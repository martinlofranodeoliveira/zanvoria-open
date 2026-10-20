(() => {
  'use strict';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', { alpha: false });
  const boot = document.getElementById('boot');
  const stick = document.getElementById('stick');
  const stickKnob = stick?.querySelector('span');
  const W = canvas.width;
  const H = canvas.height;
  const TILE = 64;
  const WORLD_W = 72;
  const WORLD_H = 52;
  const SAVE_VERSION = 1;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (a, b, n) => a + (b - a) * n;
  const dist = (a, b, c, d) => Math.hypot(a - c, b - d);
  const choose = (items, n) => items[Math.abs(hash(n)) % items.length];
  const hash = (n) => {
    let x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
    return Math.floor((x - Math.floor(x)) * 2147483647);
  };
  const rnd = (n) => (hash(n) % 10000) / 10000;
  const stringHash = (text) => [...text].reduce((sum, char) => ((sum << 5) - sum + char.charCodeAt(0)) | 0, 0);

  const TYPES = {
    flora: { name: 'Flora', color: '#78e08f', strong: 'tide', weak: 'ember' },
    tide: { name: 'Tide', color: '#5bc8ff', strong: 'ember', weak: 'volt' },
    ember: { name: 'Ember', color: '#ff9b52', strong: 'flora', weak: 'tide' },
    volt: { name: 'Volt', color: '#f7db63', strong: 'stone', weak: 'flora' },
    stone: { name: 'Stone', color: '#c8a06a', strong: 'umbra', weak: 'tide' },
    umbra: { name: 'Umbra', color: '#b68cff', strong: 'volt', weak: 'stone' }
  };

  const CREATURES = {
    lumora: {
      name: 'Lumora',
      type: 'flora',
      bio: 'A foxlike grove spirit that heals when the wind changes.',
      base: { hp: 34, atk: 8, def: 6, spd: 9 },
      palette: ['#efffd7', '#78e08f', '#238a57', '#f4dd73'],
      moves: ['Leaf Rush', 'Gleam Bite']
    },
    gladevein: {
      name: 'Gladevein',
      type: 'flora',
      bio: 'An evolved grove guardian with living runes across its mane.',
      base: { hp: 54, atk: 13, def: 10, spd: 11 },
      palette: ['#f3ffe2', '#60c983', '#1c714d', '#e7ff78'],
      moves: ['Runic Bloom', 'Verdant Break']
    },
    voltkit: {
      name: 'Voltkit',
      type: 'volt',
      bio: 'A restless cub that stores lightning in its tail rings.',
      base: { hp: 30, atk: 10, def: 5, spd: 12 },
      palette: ['#fff6b3', '#f7db63', '#c88019', '#4be4ff'],
      moves: ['Spark Dash', 'Static Fang']
    },
    stormlynx: {
      name: 'Stormlynx',
      type: 'volt',
      bio: 'An evolved thunder hunter that blinks between charged stones.',
      base: { hp: 48, atk: 15, def: 8, spd: 16 },
      palette: ['#fff9bf', '#f5d84f', '#905d16', '#5fffff'],
      moves: ['Tempest Claw', 'Overcharge']
    },
    terrapup: {
      name: 'Terrapup',
      type: 'stone',
      bio: 'A loyal ridge beast with mineral armor over its shoulders.',
      base: { hp: 42, atk: 8, def: 10, spd: 5 },
      palette: ['#f1d5a2', '#c8a06a', '#654a34', '#79d4b8'],
      moves: ['Quartz Ram', 'Burrow Guard']
    },
    basaltaur: {
      name: 'Basaltaur',
      type: 'stone',
      bio: 'An evolved ridge beast with shield plates forged by old magma.',
      base: { hp: 66, atk: 13, def: 17, spd: 6 },
      palette: ['#f5d6a4', '#a98255', '#463426', '#83f0d1'],
      moves: ['Obsidian Charge', 'Plate Wall']
    },
    emberlyn: {
      name: 'Emberlyn',
      type: 'ember',
      bio: 'A lantern-cat that appears near old watchfires.',
      base: { hp: 32, atk: 11, def: 5, spd: 10 },
      palette: ['#ffe1aa', '#ff9b52', '#ab3f2d', '#ffe86a'],
      moves: ['Cinder Swipe', 'Flare Pounce']
    },
    flarelyn: {
      name: 'Flarelyn',
      type: 'ember',
      bio: 'An evolved lantern-cat whose chest flame burns blue under pressure.',
      base: { hp: 50, atk: 16, def: 8, spd: 13 },
      palette: ['#ffe6b2', '#ff8c42', '#7c2d26', '#fff06f'],
      moves: ['Blueflare Rush', 'Solar Rend']
    },
    aqualisk: {
      name: 'Aqualisk',
      type: 'tide',
      bio: 'A river serpent that sings through the reeds at dusk.',
      base: { hp: 36, atk: 8, def: 7, spd: 10 },
      palette: ['#c6f6ff', '#5bc8ff', '#226d97', '#b6f2d6'],
      moves: ['Tide Coil', 'Foam Veil']
    },
    tidewyrm: {
      name: 'Tidewyrm',
      type: 'tide',
      bio: 'An evolved river sovereign with fins like polished glass.',
      base: { hp: 58, atk: 13, def: 11, spd: 14 },
      palette: ['#d4fbff', '#4dbde5', '#174e75', '#b8ffd6'],
      moves: ['Abyss Coil', 'Mirror Current']
    },
    shadefin: {
      name: 'Shadefin',
      type: 'umbra',
      bio: 'A moonlit manta that glides through ruins without sound.',
      base: { hp: 35, atk: 10, def: 7, spd: 11 },
      palette: ['#e7d6ff', '#b68cff', '#514274', '#4de1d1'],
      moves: ['Night Pulse', 'Phase Cut']
    },
    nyxray: {
      name: 'Nyxray',
      type: 'umbra',
      bio: 'An evolved night manta that folds itself through shadows.',
      base: { hp: 55, atk: 15, def: 11, spd: 15 },
      palette: ['#eadbff', '#9d73e8', '#3a2d59', '#56f0e1'],
      moves: ['Void Wing', 'Mooncut']
    },
    silkettle: {
      name: 'Silkettle',
      type: 'flora',
      bio: 'A tiny kettle-moth that brews pollen into healing mist.',
      base: { hp: 28, atk: 7, def: 5, spd: 13 },
      palette: ['#fbffe1', '#b8ee76', '#4e8d42', '#ffb7d8'],
      moves: ['Pollen Pin', 'Mist Mend']
    },
    ferrubbit: {
      name: 'Ferrubbit',
      type: 'stone',
      bio: 'A metal-eared burrower that loves coins and old keys.',
      base: { hp: 40, atk: 9, def: 12, spd: 7 },
      palette: ['#f0ddbd', '#b38d61', '#5d4c3d', '#bce8ff'],
      moves: ['Iron Hop', 'Coin Guard']
    },
    cindrake: {
      name: 'Cindrake',
      type: 'ember',
      bio: 'A small ash dragon that hoards sparks in its collar scales.',
      base: { hp: 34, atk: 12, def: 7, spd: 9 },
      palette: ['#ffe2bd', '#ff7848', '#7b2b20', '#ffd447'],
      moves: ['Ash Bite', 'Wing Flare']
    },
    jellyvolt: {
      name: 'Jellyvolt',
      type: 'volt',
      bio: 'A floating bell creature whose tendrils hum with static.',
      base: { hp: 32, atk: 10, def: 6, spd: 12 },
      palette: ['#f1fbff', '#6fdcff', '#245d82', '#fff36a'],
      moves: ['Bell Shock', 'Pulse Float']
    },
    mosshorn: {
      name: 'Mosshorn',
      type: 'flora',
      bio: 'A gentle horned calf with mossy armor and stubborn courage.',
      base: { hp: 46, atk: 8, def: 12, spd: 5 },
      palette: ['#eff5c7', '#7fbf67', '#496b38', '#d4b06e'],
      moves: ['Horn Sprout', 'Root Brace']
    },
    gloomimp: {
      name: 'Gloomimp',
      type: 'umbra',
      bio: 'A ruin prankster that steals lantern light and laughs from cracks.',
      base: { hp: 31, atk: 11, def: 5, spd: 14 },
      palette: ['#efe2ff', '#9f77d8', '#332447', '#65f4dd'],
      moves: ['Lantern Theft', 'Sneak Cut']
    },
    riftstag: {
      name: 'Rift Stag',
      type: 'umbra',
      bio: 'A crowned alpha born from a broken leyline.',
      base: { hp: 70, atk: 13, def: 10, spd: 8 },
      palette: ['#f0e7ff', '#c4a4ff', '#352450', '#6af2ff'],
      moves: ['Antler Rift', 'Gravity Bloom'],
      boss: true
    }
  };

  const WILD_TABLE = [
    ['lumora', 15],
    ['voltkit', 13],
    ['terrapup', 13],
    ['emberlyn', 12],
    ['aqualisk', 12],
    ['shadefin', 7],
    ['silkettle', 9],
    ['ferrubbit', 8],
    ['cindrake', 7],
    ['jellyvolt', 7],
    ['mosshorn', 8],
    ['gloomimp', 5],
    ['gladevein', 1],
    ['stormlynx', 1],
    ['basaltaur', 1],
    ['flarelyn', 1],
    ['tidewyrm', 1],
    ['nyxray', 1]
  ];

  const EVOLUTIONS = {
    lumora: { to: 'gladevein', level: 10 },
    voltkit: { to: 'stormlynx', level: 10 },
    terrapup: { to: 'basaltaur', level: 11 },
    emberlyn: { to: 'flarelyn', level: 10 },
    aqualisk: { to: 'tidewyrm', level: 11 },
    shadefin: { to: 'nyxray', level: 12 }
  };

  const SHOP_ITEMS = [
    { id: 'prisms', name: '3 Rift Prisms', cost: 45, qty: 3, desc: 'Capture weakened wild creatures.' },
    { id: 'herbs', name: '2 Glow Herbs', cost: 35, qty: 2, desc: 'Camp inside a dungeon or heal during exploration.' },
    { id: 'keys', name: 'Rift Key', cost: 90, qty: 1, desc: 'Open locked dungeon doors and bonus chests.' }
  ];

  const DUNGEONS = [
    { id: 'moss-gate', name: 'Mossgate Depths', x: 30.5 * TILE, y: 22.5 * TILE, types: ['flora', 'stone', 'umbra'], maxDepth: 4, level: 7, reward: 170 },
    { id: 'crystal-ruin', name: 'Crystal Ruin', x: 58.0 * TILE, y: 13.5 * TILE, types: ['volt', 'tide', 'umbra'], maxDepth: 5, level: 10, reward: 260 }
  ];

  const NPCS = [
    {
      id: 'aryn',
      name: 'Aryn',
      title: 'Rift Keeper',
      x: 12.5 * TILE,
      y: 10.5 * TILE,
      color: '#6af2ff',
      lines: [
        'The wilds are unstable. Tame three aetherlings, then challenge the Rift Stag.',
        'Every captured creature keeps its level. Build a party that covers weaknesses.',
        'When the Stag falls, the first island opens for deeper production.'
      ]
    },
    {
      id: 'mira',
      name: 'Mira',
      title: 'Market Smith',
      x: 16.5 * TILE,
      y: 12.5 * TILE,
      color: '#f7db63',
      lines: [
        'The market is open. Prisms, herbs and keys are cheaper before the second island.',
        'Rare spawns prefer crystal ground after dusk. Bring keys before deep ruins.'
      ]
    },
    {
      id: 'soren',
      name: 'Soren',
      title: 'Scout',
      x: 20.5 * TILE,
      y: 8.5 * TILE,
      color: '#78e08f',
      lines: [
        'Dash through grass, but slow down in ruins. Encounters are stronger there.',
        'The minimap marks nearby creatures. The cyan diamonds are dungeon gates.'
      ]
    }
  ];

  const BUILDINGS = [
    { id: 'guild', name: 'Aryn Guild', action: 'heal', x: 10.3 * TILE, y: 7.0 * TILE, w: 4.4 * TILE, h: 2.65 * TILE, roof: '#295d72', wall: '#687887', sign: '#6af2ff' },
    { id: 'market', name: 'Mira Market', action: 'shop', x: 17.0 * TILE, y: 8.0 * TILE, w: 3.8 * TILE, h: 2.45 * TILE, roof: '#7d6232', wall: '#75665b', sign: '#ffe16f' },
    { id: 'stable', name: 'Wildbound Stable', action: 'stable', x: 9.2 * TILE, y: 13.05 * TILE, w: 3.4 * TILE, h: 2.1 * TILE, roof: '#5b7441', wall: '#675742', sign: '#78e08f' }
  ];

  const QUEST = {
    id: 'first-rift',
    title: 'Seal the First Rift',
    steps: [
      'Talk to Aryn in Havenhold',
      'Tame 3 wild aetherlings',
      'Defeat the Rift Stag near the northern ruins'
    ]
  };

  const CONTRACT_POOL = [
    { id: 'wins-3', name: 'Win 3 battles', metric: 'wins', target: 3, reward: { coins: 90, prisms: 1 }, score: 450 },
    { id: 'captures-2', name: 'Tame 2 creatures', metric: 'captures', target: 2, reward: { coins: 80, prisms: 2 }, score: 520 },
    { id: 'dungeon-1', name: 'Clear 1 rift dungeon', metric: 'dungeonsCleared', target: 1, reward: { coins: 160, keys: 1 }, score: 950 },
    { id: 'evolve-1', name: 'Trigger 1 evolution', metric: 'evolutions', target: 1, reward: { coins: 120, prisms: 1 }, score: 820 },
    { id: 'party-3', name: 'Build a full party', metric: 'partySize', target: 3, reward: { coins: 75, herbs: 1 }, score: 420 },
    { id: 'codex-6', name: 'Capture 6 species', metric: 'capturedSpecies', target: 6, reward: { coins: 180, prisms: 2 }, score: 1000 }
  ];

  const ACHIEVEMENTS = [
    { id: 'first-tame', name: 'First Bond', desc: 'Tame your first creature.', reward: 300 },
    { id: 'full-party', name: 'Wildbound Trio', desc: 'Fill all three party slots.', reward: 500 },
    { id: 'first-evolution', name: 'Blooming Power', desc: 'Evolve one creature.', reward: 700 },
    { id: 'dungeon-clear', name: 'Depth Walker', desc: 'Clear a rift dungeon.', reward: 900 },
    { id: 'stag-slayer', name: 'First Rift Sealed', desc: 'Defeat the Rift Stag.', reward: 1500 },
    { id: 'collector-10', name: 'Field Researcher', desc: 'Capture 10 species.', reward: 1800 }
  ];

  const input = {
    x: 0,
    y: 0,
    dash: false,
    interact: false,
    menu: false,
    touchX: 0,
    touchY: 0
  };

  const keys = new Set();
  const camera = { x: 0, y: 0 };
  const particles = [];
  const floaters = [];
  const buttons = [];
  const art = {
    keyart: new Image(),
    lineup: new Image()
  };
  const VOICE_LINES = {}; // Voice media excluded; procedural audio remains.
  const voiceCache = new Map();
  let tiles = [];
  let wilds = [];
  let battle = null;
  let mode = 'title';
  let last = performance.now();
  let elapsed = 0;
  let dirty = false;
  let saveTimer = 0;
  let audio = null;
  let muted = false;
  let startedGameplay = false;
  let titlePulse = 0;
  let lastVoiceAt = 0;


  const state = {
    version: SAVE_VERSION,
    player: {
      x: 13 * TILE,
      y: 14 * TILE,
      facing: 'down',
      anim: 0,
      name: 'Rift Tamer'
    },
    party: [],
    stable: [],
    inventory: {
      prisms: 8,
      coins: 120,
      herbs: 2,
      keys: 0
    },
    quest: {
      talkedAryn: false,
      tamed: 0,
      defeatedStag: false,
      completed: false
    },
    stats: {
      battles: 0,
      captures: 0,
      wins: 0,
      playSeconds: 0,
      score: 0,
      dungeonsCleared: 0,
      evolutions: 0,
      lastLeaderboardScore: 0
    },
    codex: {
      seen: {},
      captured: {}
    },
    contracts: {
      day: '',
      claimed: {}
    },
    achievements: {},
    history: [],
    dungeon: null,
    ui: {
      stableSelected: 0
    },
    settings: {
      muted: false
    }
  };

  function defaultParty() {
    return [
      makeCreature('lumora', 5, 'Sprig'),
      makeCreature('voltkit', 4, 'Jolt')
    ];
  }

  function makeCreature(id, level = 3, nickname = null) {
    const def = CREATURES[id];
    const maxHp = maxHpFor(id, level);
    return {
      uid: `${id}-${Date.now().toString(36)}-${Math.floor(Math.random() * 9999)}`,
      id,
      nickname: nickname || def.name,
      level,
      xp: 0,
      hp: maxHp,
      maxHp,
      guard: 0,
      bond: 0
    };
  }

  function maxHpFor(id, level) {
    const def = CREATURES[id];
    return Math.round(def.base.hp + level * 7 + def.base.def * 0.8);
  }

  function attackFor(creature) {
    return CREATURES[creature.id].base.atk + creature.level * 2.2;
  }

  function defenseFor(creature) {
    return CREATURES[creature.id].base.def + creature.level * 1.5 + (creature.guard || 0);
  }

  function xpToNext(creature) {
    return 30 + creature.level * 18;
  }

  function typeMod(attackerType, defenderType) {
    if (TYPES[attackerType].strong === defenderType) return 1.35;
    if (TYPES[attackerType].weak === defenderType) return 0.75;
    return 1;
  }

  function generateTiles() {
    tiles = Array.from({ length: WORLD_H }, (_, y) => (
      Array.from({ length: WORLD_W }, (_, x) => {
        const town = x >= 9 && x <= 22 && y >= 7 && y <= 16;
        const path = town && (Math.abs(y - 12) <= 1 || Math.abs(x - 15) <= 1);
        const river = Math.abs(x - 43 - Math.sin(y * 0.45) * 3) < 1.1 && y > 5 && y < 43;
        const lake = Math.hypot(x - 52, y - 34) < 5.5;
        const ruin = Math.hypot(x - 36, y - 11) < 7;
        const crystal = Math.hypot(x - 57, y - 14) < 7;
        const n = rnd(x * 13.71 + y * 91.17);
        if (path) return 'path';
        if (town) return n > 0.78 ? 'garden' : 'town';
        if (river || lake) return 'water';
        if (ruin && n > 0.22) return n > 0.68 ? 'ruin' : 'stone';
        if (crystal && n > 0.35) return 'crystal';
        if (n > 0.78) return 'forest';
        if (n < 0.1) return 'brush';
        return 'grass';
      })
    ));
  }

  function tileAtPixel(x, y) {
    const tx = Math.floor(x / TILE);
    const ty = Math.floor(y / TILE);
    if (tx < 0 || ty < 0 || tx >= WORLD_W || ty >= WORLD_H) return 'water';
    return tiles[ty][tx];
  }

  function isBlocked(x, y) {
    const tile = tileAtPixel(x, y);
    if (tile === 'water') return true;
    for (const building of BUILDINGS) {
      if (x > building.x + 14 && x < building.x + building.w - 14 && y > building.y + 30 && y < building.y + building.h) {
        return true;
      }
    }
    return false;
  }

  function findSpawn(seed, preferNorth = false) {
    for (let i = 0; i < 200; i += 1) {
      const x = (6 + Math.floor(rnd(seed + i * 3) * (WORLD_W - 12))) * TILE + TILE / 2;
      const yBase = preferNorth ? 6 : 8;
      const ySpan = preferNorth ? 14 : WORLD_H - 14;
      const y = (yBase + Math.floor(rnd(seed + i * 5) * ySpan)) * TILE + TILE / 2;
      if (!isBlocked(x, y) && tileAtPixel(x, y) !== 'town' && tileAtPixel(x, y) !== 'path') return { x, y };
    }
    return { x: 28 * TILE, y: 24 * TILE };
  }

  function weightedWild(seed) {
    const total = WILD_TABLE.reduce((sum, row) => sum + row[1], 0);
    let roll = rnd(seed) * total;
    for (const [id, weight] of WILD_TABLE) {
      roll -= weight;
      if (roll <= 0) return id;
    }
    return 'lumora';
  }

  function spawnWilds() {
    wilds = [];
    for (let i = 0; i < 34; i += 1) {
      const spot = findSpawn(800 + i * 31);
      const id = weightedWild(330 + i * 19);
      const tile = tileAtPixel(spot.x, spot.y);
      const biomeBonus = tile === 'crystal' || tile === 'ruin' ? 3 : tile === 'forest' ? 1 : 0;
      wilds.push({
        uid: `wild-${i}`,
        id,
        x: spot.x,
        y: spot.y,
        homeX: spot.x,
        homeY: spot.y,
        level: 3 + Math.floor(rnd(i * 14.3) * 7) + biomeBonus,
        phase: rnd(i + 6.5) * Math.PI * 2,
        rare: rnd(i * 77) > 0.9
      });
    }

    const bossSpot = { x: 37.5 * TILE, y: 9.5 * TILE };
    wilds.push({
      uid: 'riftstag-alpha',
      id: 'riftstag',
      x: bossSpot.x,
      y: bossSpot.y,
      homeX: bossSpot.x,
      homeY: bossSpot.y,
      level: 12,
      phase: 0,
      boss: true,
      rare: true
    });
  }

  async function loadGame() {
    generateTiles();
    spawnWilds();
    state.party = defaultParty();

    const settings = window.CrazyBridge?.getSettings?.() || {};
    state.settings = { ...state.settings, ...settings };
    muted = !!state.settings.muted;

    try {
      const save = await window.CrazyBridge?.getSave?.();
      if (save?.version === SAVE_VERSION) {
        mergeSave(save);
      }
    } catch (error) {
      console.warn('[game] save hydration failed', error);
    }

    initializeProgressSystems();
    await window.CrazyBridge?.loadingStop?.();
    boot?.classList.add('hidden');
    boot?.setAttribute('hidden', '');
    const params = new URLSearchParams(window.location.search);
    if (params.has('autostart')) {
      setTimeout(() => {
        startGame();
        if (params.has('battle')) startBattle(wilds.find((wild) => !wild.boss) || wilds[0]);
        if (params.get('screen') === 'menu') mode = 'menu';
        if (params.get('screen') === 'shop') mode = 'shop';
        if (params.get('screen') === 'stable') mode = 'stable';
        if (params.get('screen') === 'dungeon') {
          state.dungeon = { id: DUNGEONS[0].id, depth: 2, maxDepth: DUNGEONS[0].maxDepth, reward: DUNGEONS[0].reward, level: DUNGEONS[0].level, seed: 42, loot: 84 };
          mode = 'dungeon';
        }
      }, 80);
    }
  }

  function initializeProgressSystems() {
    for (const creature of [...state.party, ...state.stable]) {
      markCodex(creature.id, true);
    }
    resetDailyContractsIfNeeded();
    updateAchievements();
  }

  function dayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function resetDailyContractsIfNeeded() {
    const today = dayKey();
    if (state.contracts.day !== today) {
      state.contracts.day = today;
      state.contracts.claimed = {};
      markDirty();
    }
  }

  function activeContracts() {
    resetDailyContractsIfNeeded();
    const seed = Math.abs(stringHash(state.contracts.day || dayKey()));
    const pool = [...CONTRACT_POOL];
    const selected = [];
    for (let i = 0; i < 3 && pool.length; i += 1) {
      const index = (hash(seed + i * 97) % pool.length + pool.length) % pool.length;
      selected.push(pool.splice(index, 1)[0]);
    }
    return selected;
  }

  function contractProgress(contract) {
    if (contract.metric === 'partySize') return state.party.length;
    if (contract.metric === 'capturedSpecies') return Object.keys(state.codex.captured || {}).length;
    return state.stats[contract.metric] || 0;
  }

  function claimContract(contractId) {
    const contract = activeContracts().find((entry) => entry.id === contractId);
    if (!contract || state.contracts.claimed?.[contract.id]) return;
    if (contractProgress(contract) < contract.target) return;
    applyReward(contract.reward);
    state.contracts.claimed[contract.id] = true;
    state.stats.score += contract.score;
    addFloater(`Contract complete: ${contract.name}`, W / 2, H - 112, 1.8, '#ffe16f');
    updateAchievements();
    submitLeaderboardScore();
    markDirty();
  }

  function applyReward(reward) {
    for (const [key, value] of Object.entries(reward || {})) {
      state.inventory[key] = (state.inventory[key] || 0) + value;
    }
  }

  function markCodex(id, captured = false) {
    const wasSeen = !!state.codex.seen[id];
    const wasCaptured = !!state.codex.captured[id];
    state.codex.seen[id] = true;
    if (captured) state.codex.captured[id] = true;
    if (!wasSeen || (captured && !wasCaptured)) markDirty();
  }

  function updateAchievements() {
    const capturedSpecies = Object.keys(state.codex.captured || {}).length;
    const checks = {
      'first-tame': state.stats.captures >= 1,
      'full-party': state.party.length >= 3,
      'first-evolution': state.stats.evolutions >= 1,
      'dungeon-clear': state.stats.dungeonsCleared >= 1,
      'stag-slayer': state.quest.defeatedStag,
      'collector-10': capturedSpecies >= 10
    };
    for (const achievement of ACHIEVEMENTS) {
      if (checks[achievement.id]) unlockAchievement(achievement.id);
    }
  }

  function unlockAchievement(id) {
    if (state.achievements[id]) return false;
    const achievement = ACHIEVEMENTS.find((entry) => entry.id === id);
    if (!achievement) return false;
    state.achievements[id] = true;
    state.stats.score += achievement.reward;
    addFloater(`Achievement: ${achievement.name}`, W / 2, 92, 2.4, '#6af2ff');
    markDirty();
    return true;
  }

  function mergeSave(save) {
    state.player = { ...state.player, ...save.player };
    state.party = Array.isArray(save.party) && save.party.length ? save.party.map(reviveCreature) : defaultParty();
    state.stable = Array.isArray(save.stable) ? save.stable.map(reviveCreature) : [];
    state.inventory = { ...state.inventory, ...save.inventory };
    state.quest = { ...state.quest, ...save.quest };
    state.stats = { ...state.stats, ...save.stats };
    state.codex = {
      seen: { ...state.codex.seen, ...(save.codex?.seen || {}) },
      captured: { ...state.codex.captured, ...(save.codex?.captured || {}) }
    };
    state.contracts = { ...state.contracts, ...save.contracts };
    state.achievements = { ...state.achievements, ...save.achievements };
    state.history = Array.isArray(save.history) ? save.history.slice(0, 12) : [];
    state.dungeon = save.dungeon || null;
    state.settings = { ...state.settings, ...save.settings };
    muted = !!state.settings.muted;
    if (state.quest.defeatedStag) {
      wilds = wilds.filter((wild) => wild.uid !== 'riftstag-alpha');
    }
  }

  function reviveCreature(creature) {
    const revived = { ...creature };
    revived.maxHp = maxHpFor(revived.id, revived.level);
    revived.hp = clamp(Number(revived.hp || revived.maxHp), 1, revived.maxHp);
    revived.guard = 0;
    return revived;
  }

  function serializeSave() {
    return {
      version: SAVE_VERSION,
      player: {
        x: Math.round(state.player.x),
        y: Math.round(state.player.y),
        facing: state.player.facing,
        name: state.player.name
      },
      party: state.party,
      stable: state.stable,
      inventory: state.inventory,
      quest: state.quest,
      stats: state.stats,
      codex: state.codex,
      contracts: state.contracts,
      achievements: state.achievements,
      history: state.history,
      dungeon: state.dungeon,
      settings: state.settings
    };
  }

  function markDirty() {
    dirty = true;
  }

  async function saveNow() {
    dirty = false;
    state.settings.muted = muted;
    window.CrazyBridge?.setSettings?.(state.settings);
    await window.CrazyBridge?.setSave?.(serializeSave());
  }

  function startGame() {
    if (mode !== 'title') return;
    mode = 'overworld';
    unlockAudio();
    if (!startedGameplay) {
      startedGameplay = true;
      window.CrazyBridge?.gameplayStart?.();
    }
    markDirty();
  }

  function unlockAudio() {
    if (audio) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      audio = new AudioCtx();
      playTone(246, 0.05, 'triangle', 0.03);
      setTimeout(() => playTone(369, 0.07, 'sine', 0.025), 80);
    } catch {
      audio = null;
    }
  }

  function playTone(freq, dur = 0.08, type = 'sine', gain = 0.04) {
    if (!audio || muted) return;
    const osc = audio.createOscillator();
    const amp = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audio.currentTime);
    amp.gain.setValueAtTime(gain, audio.currentTime);
    amp.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + dur);
    osc.connect(amp).connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + dur);
  }

  function playVoice(id, cooldown = 0.55) {
    const src = VOICE_LINES[id];
    if (!src || muted) return;
    const now = performance.now() / 1000;
    if (now - lastVoiceAt < cooldown) return;
    lastVoiceAt = now;
    try {
      let clip = voiceCache.get(id);
      if (!clip) {
        clip = new Audio(src);
        clip.preload = 'auto';
        clip.volume = 0.72;
        voiceCache.set(id, clip);
      }
      clip.currentTime = 0;
      clip.play().catch(() => {});
    } catch {
      // Voice assets are an enhancement; gameplay must not depend on them.
    }
  }

  function recordEvent(kind, text, score = 0) {
    state.history.unshift({
      id: `${Date.now().toString(36)}-${Math.floor(Math.random() * 9999)}`,
      kind,
      text,
      score,
      day: dayKey(),
      t: Math.floor(state.stats.playSeconds)
    });
    state.history = state.history.slice(0, 12);
    if (score) state.stats.score += score;
    markDirty();
  }

  function update(dt) {
    elapsed += dt;
    titlePulse += dt;
    saveTimer += dt;
    if (mode !== 'title') state.stats.playSeconds += dt;
    updateInputAxis();

    if (mode === 'overworld') updateOverworld(dt);
    if (mode === 'battle') updateBattle(dt);
    if (mode === 'menu') updateMenu(dt);
    if (mode === 'shop' || mode === 'stable' || mode === 'dungeon') updateModalMode();

    updateParticles(dt);
    if (dirty && saveTimer > 2) {
      saveTimer = 0;
      saveNow();
    }
  }

  function updateInputAxis() {
    let x = 0;
    let y = 0;
    if (keys.has('a') || keys.has('arrowleft')) x -= 1;
    if (keys.has('d') || keys.has('arrowright')) x += 1;
    if (keys.has('w') || keys.has('arrowup')) y -= 1;
    if (keys.has('s') || keys.has('arrowdown')) y += 1;
    x += input.touchX;
    y += input.touchY;
    const len = Math.hypot(x, y);
    input.x = len > 0 ? x / len : 0;
    input.y = len > 0 ? y / len : 0;
    input.dash = keys.has('shift') || keys.has(' ');
  }

  function updateOverworld(dt) {
    const player = state.player;
    const moving = Math.hypot(input.x, input.y) > 0.05;
    const speed = (input.dash ? 245 : 165) * (tileAtPixel(player.x, player.y) === 'brush' ? 0.86 : 1);
    if (moving) {
      if (Math.abs(input.x) > Math.abs(input.y)) player.facing = input.x > 0 ? 'right' : 'left';
      else player.facing = input.y > 0 ? 'down' : 'up';
      const nextX = player.x + input.x * speed * dt;
      const nextY = player.y + input.y * speed * dt;
      if (!isBlocked(nextX, player.y)) player.x = clamp(nextX, TILE, WORLD_W * TILE - TILE);
      if (!isBlocked(player.x, nextY)) player.y = clamp(nextY, TILE, WORLD_H * TILE - TILE);
      player.anim += dt * (input.dash ? 14 : 9);
      if (Math.random() < dt * 8) addTrail(player.x, player.y + 18, tileAtPixel(player.x, player.y));
      markDirty();
    } else {
      player.anim += dt * 2.5;
    }

    camera.x = lerp(camera.x, player.x - W / 2, 0.09);
    camera.y = lerp(camera.y, player.y - H / 2, 0.09);
    camera.x = clamp(camera.x, 0, WORLD_W * TILE - W);
    camera.y = clamp(camera.y, 0, WORLD_H * TILE - H);

    for (const wild of wilds) {
      wild.phase += dt;
      if (!wild.boss) {
        const wanderX = Math.cos(wild.phase * 0.7 + wild.level) * 22;
        const wanderY = Math.sin(wild.phase * 0.9 + wild.level) * 18;
        const targetX = wild.homeX + wanderX;
        const targetY = wild.homeY + wanderY;
        if (!isBlocked(targetX, targetY)) {
          wild.x = lerp(wild.x, targetX, 0.015);
          wild.y = lerp(wild.y, targetY, 0.015);
        }
      }

      const radius = wild.boss ? 58 : 38;
      if (dist(player.x, player.y, wild.x, wild.y) < radius && (input.dash || input.interact)) {
        input.interact = false;
        startBattle(wild);
        return;
      }
    }

    if (input.interact) {
      input.interact = false;
      const npc = nearestNpc();
      const building = nearestBuilding();
      const dungeon = nearestDungeon();
      if (npc) speak(npc);
      else if (building) interactBuilding(building);
      else if (dungeon) enterDungeon(dungeon);
    }

    if (input.menu) {
      input.menu = false;
      mode = 'menu';
      window.CrazyBridge?.gameplayStop?.();
    }
  }

  function updateMenu() {
    if (input.menu || keys.has('escape')) {
      input.menu = false;
      mode = 'overworld';
      window.CrazyBridge?.gameplayStart?.();
    }
  }

  function updateModalMode() {
    if (input.menu || keys.has('escape')) {
      input.menu = false;
      mode = 'overworld';
      window.CrazyBridge?.gameplayStart?.();
    }
  }

  function nearestNpc() {
    let best = null;
    let bestDist = 76;
    for (const npc of NPCS) {
      const d = dist(state.player.x, state.player.y, npc.x, npc.y);
      if (d < bestDist) {
        best = npc;
        bestDist = d;
      }
    }
    return best;
  }

  function nearestBuilding() {
    let best = null;
    let bestDist = 86;
    for (const building of BUILDINGS) {
      const doorX = building.x + building.w / 2;
      const doorY = building.y + building.h - 16;
      const d = dist(state.player.x, state.player.y, doorX, doorY);
      if (d < bestDist) {
        best = building;
        bestDist = d;
      }
    }
    return best;
  }

  function nearestDungeon() {
    let best = null;
    let bestDist = 82;
    for (const dungeon of DUNGEONS) {
      const d = dist(state.player.x, state.player.y, dungeon.x, dungeon.y);
      if (d < bestDist) {
        best = dungeon;
        bestDist = d;
      }
    }
    return best;
  }

  function interactBuilding(building) {
    if (building.action === 'heal') {
      const cost = state.quest.defeatedStag ? 0 : 18;
      if (state.inventory.coins >= cost) {
        state.inventory.coins -= cost;
        healParty();
        addFloater(cost ? `Party healed for ${cost} coins.` : 'Aryn healed your party.', state.player.x, state.player.y - 88, 3.5, '#9ff0c2', true);
        markDirty();
      } else {
        addFloater('Not enough coins for guild healing.', state.player.x, state.player.y - 88, 3.2, '#ffcf7a', true);
      }
      playTone(392, 0.12, 'sine', 0.03);
    } else if (building.action === 'shop') {
      mode = 'shop';
      playVoice('miraMarket');
      window.CrazyBridge?.gameplayStop?.();
    } else if (building.action === 'stable') {
      mode = 'stable';
      window.CrazyBridge?.gameplayStop?.();
    }
  }

  function speak(npc) {
    const index = npc.id === 'aryn'
      ? (state.quest.talkedAryn ? (state.quest.tamed >= 3 ? 1 : 0) : 0)
      : Math.floor(elapsed / 3) % npc.lines.length;
    addFloater(`${npc.name}: ${npc.lines[index]}`, npc.x, npc.y - 60, 4.5, npc.color, true);
    if (npc.id === 'aryn') playVoice(index === 1 ? 'arynRift' : 'arynIntro');
    if (npc.id === 'mira') playVoice('miraMarket');
    if (npc.id === 'soren') playVoice('sorenScout');
    if (npc.id === 'aryn') {
      if (!state.quest.talkedAryn) recordEvent('quest', 'Aryn marked the first rift on your map.', 35);
      state.quest.talkedAryn = true;
      if (state.quest.tamed >= 3 && !state.quest.defeatedStag) {
        addFloater('The Rift Stag waits in the northern ruins.', npc.x, npc.y - 92, 4.5, '#c4a4ff', true);
      }
      markDirty();
    }
    playTone(312, 0.06, 'sine', 0.03);
  }

  function enterDungeon(dungeon) {
    const minParty = state.party.filter((creature) => creature.hp > 0).length;
    if (minParty === 0) {
      addFloater('Heal your party before entering a rift dungeon.', dungeon.x, dungeon.y - 70, 3, '#ffcf7a', true);
      return;
    }
    state.dungeon = {
      id: dungeon.id,
      depth: 1,
      maxDepth: dungeon.maxDepth,
      reward: dungeon.reward,
      level: dungeon.level,
      seed: Math.floor(elapsed * 1000) + state.stats.battles * 31,
      loot: 0
    };
    mode = 'dungeon';
    input.interact = false;
    window.CrazyBridge?.gameplayStop?.();
    addFloater(`${dungeon.name} opened. Clear ${dungeon.maxDepth} rooms.`, state.player.x, state.player.y - 90, 3.4, '#6af2ff', true);
    markDirty();
  }

  function currentDungeonDef() {
    return DUNGEONS.find((dungeon) => dungeon.id === state.dungeon?.id) || DUNGEONS[0];
  }

  function startDungeonBattle() {
    if (!state.dungeon) return;
    const dungeon = currentDungeonDef();
    const options = Object.entries(CREATURES)
      .filter(([, def]) => dungeon.types.includes(def.type) && !def.boss)
      .map(([id]) => id);
    const isBossRoom = state.dungeon.depth >= state.dungeon.maxDepth;
    const id = isBossRoom
      ? choose(['gladevein', 'stormlynx', 'basaltaur', 'flarelyn', 'tidewyrm', 'nyxray'], state.dungeon.seed + state.dungeon.depth)
      : choose(options, state.dungeon.seed + state.dungeon.depth * 17);
    const wild = {
      uid: `${dungeon.id}-room-${state.dungeon.depth}`,
      id,
      x: state.player.x,
      y: state.player.y,
      level: state.dungeon.level + state.dungeon.depth + (isBossRoom ? 3 : 0),
      phase: 0,
      rare: isBossRoom,
      dungeon: true
    };
    startBattle(wild, { type: 'dungeon', dungeonId: dungeon.id });
  }

  function leaveDungeon() {
    state.dungeon = null;
    mode = 'overworld';
    window.CrazyBridge?.gameplayStart?.();
    markDirty();
  }

  function useDungeonHerb() {
    if (!state.dungeon) return;
    if (state.inventory.herbs <= 0) {
      addFloater('No herbs left.', W / 2, H - 120, 1.4, '#ffcf7a');
      return;
    }
    state.inventory.herbs -= 1;
    healParty(0.82);
    addFloater('Campfire rest restored the party.', W / 2, H - 120, 1.6, '#9ff0c2');
    playTone(440, 0.12, 'triangle', 0.03);
    markDirty();
  }

  function buyShopItem(itemId) {
    const item = SHOP_ITEMS.find((entry) => entry.id === itemId);
    if (!item) return;
    if (state.inventory.coins < item.cost) {
      addFloater('Not enough coins.', W / 2, H - 112, 1.4, '#ffcf7a');
      playTone(120, 0.07, 'sawtooth', 0.025);
      return;
    }
    state.inventory.coins -= item.cost;
    state.inventory[item.id] = (state.inventory[item.id] || 0) + item.qty;
    addFloater(`Bought ${item.name}.`, W / 2, H - 112, 1.5, '#9ff0c2');
    playTone(512, 0.08, 'triangle', 0.03);
    markDirty();
  }

  function stableAction(action) {
    if (action === 'heal') {
      const cost = state.quest.defeatedStag ? 0 : 25;
      if (state.inventory.coins < cost) {
        addFloater('Not enough coins for stable care.', W / 2, H - 112, 1.5, '#ffcf7a');
        return;
      }
      state.inventory.coins -= cost;
      healParty();
      for (const creature of state.stable) {
        creature.maxHp = maxHpFor(creature.id, creature.level);
        creature.hp = creature.maxHp;
      }
      addFloater('All creatures restored.', W / 2, H - 112, 1.6, '#9ff0c2');
      markDirty();
      return;
    }

    if (action === 'train') {
      const cost = 120;
      if (state.inventory.coins < cost) {
        addFloater('Training costs 120 coins.', W / 2, H - 112, 1.5, '#ffcf7a');
        return;
      }
      state.inventory.coins -= cost;
      for (const creature of state.party) giveXp(creature, Math.round(xpToNext(creature) * 0.55));
      state.stats.score += 350;
      addFloater('Party training complete.', W / 2, H - 112, 1.6, '#ffe16f');
      markDirty();
      return;
    }

    if (action.startsWith('stable-')) {
      const index = Number(action.slice(7));
      const creature = state.stable[index];
      if (!creature) return;
      if (state.party.length < 3) {
        state.party.push(creature);
        state.stable.splice(index, 1);
      } else {
        const swapIndex = clamp(state.ui.stableSelected || 0, 0, state.party.length - 1);
        const partyCreature = state.party[swapIndex];
        state.party[swapIndex] = creature;
        state.stable[index] = partyCreature;
      }
      addFloater(`${creature.nickname} moved into the party.`, W / 2, H - 112, 1.6, '#9ff0c2');
      markDirty();
    }

    if (action.startsWith('party-')) {
      state.ui.stableSelected = Number(action.slice(6));
    }
  }

  function startBattle(wild, context = null) {
    if (wild.boss && state.quest.tamed < 3) {
      addFloater('The alpha ignores unproven tamers. Tame 3 creatures first.', wild.x, wild.y - 70, 3.6, '#ffcf7a', true);
      return;
    }

    const enemy = makeCreature(wild.id, wild.level);
    markCodex(wild.id);
    updateAchievements();
    battle = {
      wildUid: wild.uid,
      wild,
      enemy,
      activeIndex: Math.max(0, state.party.findIndex((creature) => creature.hp > 0)),
      turn: 'player',
      log: [`A wild ${CREATURES[wild.id].name} appeared.`],
      timer: 0,
      shake: 0,
      ended: false,
      context,
      buttons: []
    };
    if (battle.activeIndex < 0) {
      healParty();
      battle.activeIndex = 0;
    }
    mode = 'battle';
    state.stats.battles += 1;
    input.interact = false;
    window.CrazyBridge?.gameplayStop?.();
    if (wild.boss) playVoice('riftstagChallenge');
    playTone(146, 0.08, 'sawtooth', 0.035);
    setTimeout(() => playTone(220, 0.1, 'triangle', 0.03), 110);
  }

  function updateBattle(dt) {
    if (!battle) return;
    battle.timer += dt;
    battle.shake = Math.max(0, battle.shake - dt * 18);
    if (battle.turn === 'enemy' && battle.timer > 0.9) {
      enemyMove();
    }
    if (input.menu || keys.has('escape')) {
      input.menu = false;
      finishBattle(false, 'You retreated to Havenhold.');
    }
  }

  function activeCreature() {
    return state.party[battle?.activeIndex || 0];
  }

  function playerBattleAction(action) {
    if (!battle || battle.turn !== 'player' || battle.ended) return;
    const active = activeCreature();
    if (!active || active.hp <= 0) return;

    if (action === 'attack') {
      dealDamage(active, battle.enemy, 1, CREATURES[active.id].moves[0]);
      endPlayerTurn();
    } else if (action === 'special') {
      dealDamage(active, battle.enemy, 1.22, CREATURES[active.id].moves[1]);
      active.guard = Math.max(0, active.guard - 1);
      endPlayerTurn();
    } else if (action === 'guard') {
      active.guard = 5 + Math.floor(active.level / 2);
      battle.log.unshift(`${active.nickname} braces behind aether light.`);
      addFloater('GUARD', W / 2 - 320, H / 2 + 110, 1.2, '#d7f6ff');
      playTone(188, 0.12, 'triangle', 0.025);
      endPlayerTurn();
    } else if (action === 'tame') {
      attemptTame();
    } else if (action.startsWith('swap-')) {
      const index = Number(action.slice(5));
      if (state.party[index]?.hp > 0 && index !== battle.activeIndex) {
        battle.activeIndex = index;
        battle.log.unshift(`Go, ${state.party[index].nickname}!`);
        playTone(512, 0.06, 'sine', 0.03);
        endPlayerTurn();
      }
    }
  }

  function endPlayerTurn() {
    if (battle.enemy.hp <= 0) {
      finishBattle(true);
      return;
    }
    battle.turn = 'enemy';
    battle.timer = 0;
  }

  function enemyMove() {
    if (!battle || battle.ended) return;
    const active = activeCreature();
    if (!active) return;
    const enemy = battle.enemy;
    const move = CREATURES[enemy.id].moves[Math.floor(rnd(elapsed + enemy.level) * 2)];
    dealDamage(enemy, active, enemy.id === 'riftstag' ? 1.12 : 0.95, move, true);
    if (active.guard) active.guard = 0;

    if (active.hp <= 0) {
      const next = state.party.findIndex((creature) => creature.hp > 0);
      if (next >= 0) {
        battle.activeIndex = next;
        battle.log.unshift(`${active.nickname} fainted. ${state.party[next].nickname} jumps in.`);
      } else {
        finishBattle(false, 'Your party was exhausted. You wake up in Havenhold.');
        return;
      }
    }
    battle.turn = 'player';
    battle.timer = 0;
  }

  function dealDamage(attacker, defender, power, move, enemySide = false) {
    const atkDef = CREATURES[attacker.id];
    const defDef = CREATURES[defender.id];
    const mod = typeMod(atkDef.type, defDef.type);
    const base = attackFor(attacker) * power - defenseFor(defender) * 0.42;
    const variance = 0.88 + rnd(elapsed * 11 + attacker.level * 8) * 0.22;
    const dmg = Math.max(3, Math.round(base * mod * variance));
    defender.hp = clamp(defender.hp - dmg, 0, defender.maxHp);
    const quality = mod > 1 ? 'Super effective' : mod < 1 ? 'Resisted' : 'Hit';
    battle.log.unshift(`${move}: ${quality}. ${dmg} damage.`);
    battle.shake = 1;
    addFloater(`-${dmg}`, enemySide ? W / 2 + 320 : W / 2 - 320, H / 2 + 60, 1.1, mod > 1 ? '#ffe16f' : '#f3f7ff');
    playTone(mod > 1 ? 420 : 260, 0.06, enemySide ? 'sawtooth' : 'square', 0.03);
  }

  function attemptTame() {
    if (state.inventory.prisms <= 0) {
      battle.log.unshift('No rift prisms left.');
      playTone(104, 0.08, 'sawtooth', 0.025);
      return;
    }
    if (battle.enemy.id === 'riftstag') {
      battle.log.unshift('Alpha creatures must be defeated, not tamed.');
      return;
    }
    state.inventory.prisms -= 1;
    const hpRatio = battle.enemy.hp / battle.enemy.maxHp;
    const chance = clamp(0.18 + (1 - hpRatio) * 0.62 + state.quest.tamed * 0.025, 0.2, 0.86);
    const roll = rnd(elapsed * 29 + battle.enemy.level * 13 + state.stats.captures * 7);
    if (roll < chance) {
      const captured = reviveCreature({ ...battle.enemy, hp: Math.max(8, Math.round(battle.enemy.maxHp * 0.55)), bond: 1 });
      if (state.party.length < 3) state.party.push(captured);
      else state.stable.push(captured);
      markCodex(captured.id, true);
      state.quest.tamed += 1;
      state.stats.captures += 1;
      state.stats.score += 360 + captured.level * 35;
      recordEvent('capture', `${CREATURES[captured.id].name} bonded with the party.`, 90);
      playVoice('captureSuccess');
      updateAchievements();
      finishBattle(true, `${CREATURES[captured.id].name} joined your team.`);
    } else {
      battle.log.unshift('The prism cracked. The creature broke free.');
      playTone(150, 0.08, 'triangle', 0.025);
      endPlayerTurn();
    }
    markDirty();
  }

  function finishBattle(victory, message = '') {
    if (!battle || battle.ended) return;
    battle.ended = true;
    const defeatedBoss = victory && battle.enemy.id === 'riftstag';
    const dungeonContext = battle.context?.type === 'dungeon';
    if (victory) {
      state.stats.wins += 1;
      const xp = battle.enemy.level * (defeatedBoss ? 24 : 12);
      const coins = battle.enemy.level * (defeatedBoss ? 18 : 6);
      const prisms = defeatedBoss ? 4 : (rnd(elapsed * 17) > 0.72 ? 1 : 0);
      const scoreGain = Math.round(xp * 7 + coins * 3 + (defeatedBoss ? 2500 : 0) + (dungeonContext ? 600 : 0));
      state.inventory.coins += coins;
      state.inventory.prisms += prisms;
      state.stats.score += scoreGain;
      for (const creature of state.party) {
        if (creature.hp > 0) giveXp(creature, xp);
      }
      if (!dungeonContext) wilds = wilds.filter((wild) => wild.uid !== battle.wildUid);
      if (defeatedBoss) {
        state.quest.defeatedStag = true;
        state.quest.completed = true;
        message = 'The first rift is sealed. New islands can now be built.';
        recordEvent('rift', 'The Rift Stag fell and the first rift went quiet.', 500);
        submitLeaderboardScore();
      } else if (dungeonContext && state.dungeon) {
        state.dungeon.loot += coins;
        if (state.dungeon.depth >= state.dungeon.maxDepth) {
          completeDungeon();
          battle = null;
          markDirty();
          return;
        }
        state.dungeon.depth += 1;
        message = `Room cleared. Rift depth ${state.dungeon.depth}/${state.dungeon.maxDepth}.`;
      } else if (!message) {
        message = `Victory. +${xp} XP, +${coins} coins${prisms ? ', +1 prism' : ''}.`;
      }
      addFloater(message, state.player.x, state.player.y - 80, 4, '#9ff0c2', true);
      playTone(523, 0.1, 'sine', 0.04);
      setTimeout(() => playTone(659, 0.12, 'sine', 0.035), 130);
    } else {
      healParty(0.62);
      state.player.x = 13 * TILE;
      state.player.y = 14 * TILE;
      addFloater(message, state.player.x, state.player.y - 80, 4, '#ffb4a4', true);
      playTone(124, 0.16, 'triangle', 0.035);
    }
    battle = null;
    if (dungeonContext && state.dungeon) {
      mode = 'dungeon';
      window.CrazyBridge?.gameplayStop?.();
    } else {
      mode = 'overworld';
      window.CrazyBridge?.gameplayStart?.();
    }
    markDirty();
  }

  function completeDungeon() {
    if (!state.dungeon) return;
    const dungeon = currentDungeonDef();
    const keyBonus = state.inventory.keys > 0 ? 80 : 0;
    if (state.inventory.keys > 0) state.inventory.keys -= 1;
    const reward = state.dungeon.reward + state.dungeon.loot + keyBonus;
    state.inventory.coins += reward;
    state.inventory.prisms += 2;
    state.stats.dungeonsCleared += 1;
    state.stats.score += reward * 5 + state.dungeon.maxDepth * 900;
    recordEvent('dungeon', `${dungeon.name} was cleared at depth ${state.dungeon.maxDepth}.`, 180);
    updateAchievements();
    addFloater(`${dungeon.name} cleared. +${reward} coins, +2 prisms.`, state.player.x, state.player.y - 90, 4, '#9ff0c2', true);
    submitLeaderboardScore();
    state.dungeon = null;
    mode = 'overworld';
    window.CrazyBridge?.gameplayStart?.();
    playVoice('dungeonClear');
    playTone(659, 0.12, 'sine', 0.04);
    setTimeout(() => playTone(784, 0.12, 'sine', 0.035), 140);
  }

  async function submitLeaderboardScore() {
    const score = computeScore();
    state.stats.lastLeaderboardScore = score;
    try {
      const result = await window.CrazyBridge?.submitScore?.(score);
      if (result?.submitted) {
        addFloater(`Leaderboard score submitted: ${score}`, state.player.x, state.player.y - 126, 3.5, '#6af2ff', true);
      }
    } catch (error) {
      console.warn('[game] leaderboard submit skipped', error);
    }
    markDirty();
  }

  function computeScore() {
    const partyPower = [...state.party, ...state.stable].reduce((sum, creature) => sum + creature.level * 90 + (EVOLUTIONS[creature.id] ? 0 : 350), 0);
    const codexPower = Object.keys(state.codex.captured || {}).length * 240 + Object.keys(state.codex.seen || {}).length * 55;
    return Math.round(
      state.stats.score +
      state.stats.wins * 180 +
      state.stats.captures * 420 +
      state.stats.dungeonsCleared * 1600 +
      state.stats.evolutions * 900 +
      partyPower +
      codexPower +
      state.inventory.coins
    );
  }

  function giveXp(creature, amount) {
    creature.xp += amount;
    while (creature.xp >= xpToNext(creature)) {
      creature.xp -= xpToNext(creature);
      creature.level += 1;
      creature.maxHp = maxHpFor(creature.id, creature.level);
      creature.hp = creature.maxHp;
      addFloater(`${creature.nickname} reached level ${creature.level}`, state.player.x, state.player.y - 110, 3.2, '#ffe16f', true);
      maybeEvolve(creature);
    }
  }

  function maybeEvolve(creature) {
    const evo = EVOLUTIONS[creature.id];
    if (!evo || creature.level < evo.level) return false;
    const previous = CREATURES[creature.id].name;
    creature.id = evo.to;
    creature.nickname = CREATURES[evo.to].name;
    creature.maxHp = maxHpFor(creature.id, creature.level);
    creature.hp = creature.maxHp;
    creature.bond = (creature.bond || 0) + 3;
    state.stats.evolutions += 1;
    state.stats.score += 1200;
    markCodex(creature.id, true);
    recordEvent('evolution', `${previous} evolved into ${creature.nickname}.`, 220);
    addFloater(`${previous} evolved into ${creature.nickname}!`, state.player.x, state.player.y - 140, 4.2, '#ffe16f', true);
    playVoice('evolution');
    playTone(740, 0.18, 'sine', 0.04);
    updateAchievements();
    markDirty();
    return true;
  }

  function healParty(ratio = 1) {
    for (const creature of state.party) {
      creature.maxHp = maxHpFor(creature.id, creature.level);
      creature.hp = Math.max(1, Math.round(creature.maxHp * ratio));
      creature.guard = 0;
    }
  }

  function addTrail(x, y, tile) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 18,
      vy: -10 - Math.random() * 20,
      life: 0.5 + Math.random() * 0.35,
      max: 0.85,
      size: 3 + Math.random() * 4,
      color: tile === 'crystal' ? '#98f8ff' : tile === 'path' ? '#e2c080' : '#c6ef9e'
    });
  }

  function addFloater(text, x, y, life = 1.4, color = '#ffffff', world = false) {
    floaters.push({ text, x, y, life, max: life, color, world });
  }

  function updateParticles(dt) {
    for (const p of particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 30 * dt;
    }
    for (const f of floaters) {
      f.life -= dt;
      f.y -= dt * (f.world ? 10 : 22);
    }
    while (particles.length && particles[0].life <= 0) particles.shift();
    while (floaters.length && floaters[0].life <= 0) floaters.shift();
  }

  function render() {
    ctx.clearRect(0, 0, W, H);
    if (mode === 'title') renderTitle();
    else {
      renderWorld();
      renderOverworldUi();
      if (mode === 'battle') renderBattle();
      if (mode === 'menu') renderMenu();
      if (mode === 'shop') renderShop();
      if (mode === 'stable') renderStable();
      if (mode === 'dungeon') renderDungeon();
    }
    renderFloaters();
  }

  function renderTitle() {
    if (art.keyart.complete && art.keyart.naturalWidth) {
      drawCoverImage(art.keyart, 0, 0, W, H);
      const veil = ctx.createLinearGradient(0, 0, 0, H);
      veil.addColorStop(0, 'rgba(4, 8, 13, 0.18)');
      veil.addColorStop(0.56, 'rgba(4, 8, 13, 0.08)');
      veil.addColorStop(1, 'rgba(4, 8, 13, 0.5)');
      ctx.fillStyle = veil;
      ctx.fillRect(0, 0, W, H);
    } else {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#0b1017');
      g.addColorStop(0.5, '#142437');
      g.addColorStop(1, '#0b1017');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    for (let i = 0; i < 130; i += 1) {
      const x = rnd(i * 4.1) * W;
      const y = rnd(i * 6.2) * H;
      const r = 0.5 + rnd(i * 2.7) * 2.2;
      ctx.fillStyle = `rgba(174, 235, 255, ${0.18 + rnd(i) * 0.45})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    if (!art.keyart.complete || !art.keyart.naturalWidth) {
      drawRift(W / 2, H / 2 + 8, 252, titlePulse);
      drawCreatureShape(CREATURES.riftstag, W / 2 + 280, H / 2 + 72, 2.35, titlePulse, true);
      drawCreatureShape(CREATURES.lumora, W / 2 - 305, H / 2 + 145, 1.65, titlePulse + 1.1, false);
      drawCreatureShape(CREATURES.voltkit, W / 2 - 430, H / 2 + 182, 1.45, titlePulse + 2.2, false);
    }

    ctx.textAlign = 'center';
    ctx.fillStyle = '#f6fbff';
    ctx.font = '900 58px Inter, system-ui, sans-serif';
    ctx.shadowColor = 'rgba(5, 9, 14, 0.95)';
    ctx.shadowBlur = 22;
    ctx.fillText('AETHER RIFT', W / 2, 112);
    ctx.font = '900 26px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#ffe16f';
    ctx.shadowBlur = 12;
    ctx.fillText('WILDBOUND', W / 2, 150);
    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(7, 13, 20, 0.68)';
    roundRect(W / 2 - 330, H - 172, 660, 96, 18);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.stroke();
    ctx.fillStyle = '#dce8ff';
    ctx.font = '800 17px Inter, system-ui, sans-serif';
    ctx.fillText('Explore, tame, battle, evolve your party and seal the first rift.', W / 2, H - 135);
    ctx.fillStyle = titlePulse % 1 > 0.45 ? '#ffffff' : '#8fc9ff';
    ctx.font = '900 16px Inter, system-ui, sans-serif';
    ctx.fillText('PRESS ANY KEY OR CLICK TO START', W / 2, H - 101);
  }

  function drawCoverImage(image, x, y, w, h) {
    const imageRatio = image.naturalWidth / image.naturalHeight;
    const targetRatio = w / h;
    let sw = image.naturalWidth;
    let sh = image.naturalHeight;
    let sx = 0;
    let sy = 0;
    if (imageRatio > targetRatio) {
      sw = image.naturalHeight * targetRatio;
      sx = (image.naturalWidth - sw) / 2;
    } else {
      sh = image.naturalWidth / targetRatio;
      sy = (image.naturalHeight - sh) / 2;
    }
    ctx.drawImage(image, sx, sy, sw, sh, x, y, w, h);
  }

  function renderWorld() {
    const startX = Math.floor(camera.x / TILE) - 1;
    const endX = Math.ceil((camera.x + W) / TILE) + 1;
    const startY = Math.floor(camera.y / TILE) - 1;
    const endY = Math.ceil((camera.y + H) / TILE) + 1;

    for (let y = startY; y <= endY; y += 1) {
      for (let x = startX; x <= endX; x += 1) {
        if (x < 0 || y < 0 || x >= WORLD_W || y >= WORLD_H) continue;
        drawTile(x, y, tiles[y][x]);
      }
    }

    drawDecorations(startX, endX, startY, endY);
    drawTownBuildings();
    drawDungeonGates();

    const entities = [
      ...NPCS.map((npc) => ({ kind: 'npc', y: npc.y, item: npc })),
      ...wilds.map((wild) => ({ kind: 'wild', y: wild.y, item: wild })),
      { kind: 'player', y: state.player.y, item: state.player }
    ].sort((a, b) => a.y - b.y);

    for (const entity of entities) {
      if (entity.kind === 'npc') drawNpc(entity.item);
      if (entity.kind === 'wild') drawWild(entity.item);
      if (entity.kind === 'player') drawPlayer(entity.item);
    }

    for (const p of particles) {
      const alpha = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = p.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x - camera.x, p.y - camera.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    const darkness = 0.08 + Math.sin(elapsed * 0.08) * 0.04;
    ctx.fillStyle = `rgba(6, 9, 18, ${darkness})`;
    ctx.fillRect(0, 0, W, H);
  }

  function drawTile(tx, ty, tile) {
    const x = tx * TILE - camera.x;
    const y = ty * TILE - camera.y;
    const seed = tx * 117 + ty * 991;
    const palette = {
      grass: ['#31583b', '#3f734b'],
      brush: ['#294d35', '#51783e'],
      forest: ['#1f3d2e', '#2f5e37'],
      path: ['#8a6846', '#b68a54'],
      town: ['#4d5260', '#6a7381'],
      garden: ['#34573a', '#6f9151'],
      water: ['#163d55', '#236e8a'],
      stone: ['#4c5661', '#65717e'],
      ruin: ['#3c3a48', '#69617b'],
      crystal: ['#243e50', '#3a7484']
    }[tile];
    const g = ctx.createLinearGradient(x, y, x + TILE, y + TILE);
    g.addColorStop(0, palette[0]);
    g.addColorStop(1, palette[1]);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, TILE + 1, TILE + 1);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.055)';
    ctx.strokeRect(x, y, TILE + 1, TILE + 1);

    if (tile === 'grass' || tile === 'brush' || tile === 'garden') {
      for (let i = 0; i < 3; i += 1) {
        const gx = x + 8 + rnd(seed + i * 2) * 48;
        const gy = y + 12 + rnd(seed + i * 3) * 42;
        ctx.strokeStyle = `rgba(190, 236, 137, ${tile === 'brush' ? 0.28 : 0.18})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(gx, gy + 8);
        ctx.quadraticCurveTo(gx + 4, gy - 2, gx + 12, gy - 6);
        ctx.stroke();
      }
    }

    if (tile === 'forest') {
      ctx.fillStyle = 'rgba(12, 27, 20, 0.34)';
      ctx.beginPath();
      ctx.ellipse(x + 32, y + 28, 26, 20, rnd(seed) * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    if (tile === 'water') {
      ctx.strokeStyle = 'rgba(166, 229, 255, 0.22)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 2; i += 1) {
        const yy = y + 18 + i * 20 + Math.sin(elapsed * 1.3 + seed) * 3;
        ctx.beginPath();
        ctx.moveTo(x + 8, yy);
        ctx.bezierCurveTo(x + 22, yy - 8, x + 36, yy + 8, x + 56, yy);
        ctx.stroke();
      }
    }

    if (tile === 'crystal' && rnd(seed) > 0.48) {
      drawCrystal(x + 22 + rnd(seed + 1) * 18, y + 36 + rnd(seed + 2) * 14, 0.45 + rnd(seed + 3) * 0.35);
    }

    if (tile === 'ruin' && rnd(seed) > 0.5) {
      ctx.fillStyle = 'rgba(192, 183, 208, 0.28)';
      roundRect(x + 12, y + 16, 38, 13, 3);
      ctx.fill();
      ctx.fillStyle = 'rgba(20, 18, 27, 0.24)';
      ctx.fillRect(x + 18, y + 19, 26, 4);
    }
  }

  function drawDecorations(startX, endX, startY, endY) {
    for (let y = startY; y <= endY; y += 1) {
      for (let x = startX; x <= endX; x += 1) {
        if (x < 0 || y < 0 || x >= WORLD_W || y >= WORLD_H) continue;
        const tile = tiles[y][x];
        const seed = x * 41 + y * 113;
        const sx = x * TILE - camera.x;
        const sy = y * TILE - camera.y;
        if (tile === 'forest' && rnd(seed) > 0.45) drawTree(sx + 34, sy + 42, 0.75 + rnd(seed + 1) * 0.35);
        if (tile === 'town' && rnd(seed) > 0.83) drawLamp(sx + 34, sy + 42);
        if (tile === 'path' && rnd(seed) > 0.87) drawCrate(sx + 22, sy + 38);
      }
    }
  }

  function drawTownBuildings() {
    for (const building of BUILDINGS) {
      const x = building.x - camera.x;
      const y = building.y - camera.y;
      if (x + building.w < -80 || x > W + 80 || y + building.h < -80 || y > H + 80) continue;
      drawShadow(x + building.w / 2, y + building.h - 8, building.w * 0.44, 18);

      const wall = ctx.createLinearGradient(x, y + 34, x, y + building.h);
      wall.addColorStop(0, '#9a9da0');
      wall.addColorStop(1, building.wall);
      ctx.fillStyle = wall;
      roundRect(x + 16, y + 54, building.w - 32, building.h - 56, 10);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.22)';
      ctx.stroke();

      const roof = ctx.createLinearGradient(x, y, x, y + 78);
      roof.addColorStop(0, '#d5ebef');
      roof.addColorStop(0.2, building.roof);
      roof.addColorStop(1, '#1f2730');
      ctx.fillStyle = roof;
      ctx.beginPath();
      ctx.moveTo(x + building.w / 2, y + 8);
      ctx.lineTo(x + building.w - 8, y + 70);
      ctx.lineTo(x + building.w - 28, y + 88);
      ctx.lineTo(x + 28, y + 88);
      ctx.lineTo(x + 8, y + 70);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.13)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = 'rgba(8, 12, 18, 0.54)';
      roundRect(x + building.w / 2 - 22, y + building.h - 54, 44, 54, 8);
      ctx.fill();
      ctx.fillStyle = building.sign;
      ctx.beginPath();
      ctx.arc(x + building.w / 2, y + building.h - 31, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(214, 242, 255, 0.72)';
      for (let i = 0; i < 2; i += 1) {
        roundRect(x + 36 + i * (building.w - 96), y + 105, 32, 26, 6);
        ctx.fill();
      }
    }
  }

  function drawDungeonGates() {
    for (const dungeon of DUNGEONS) {
      const x = dungeon.x - camera.x;
      const y = dungeon.y - camera.y;
      if (x < -100 || x > W + 100 || y < -100 || y > H + 100) continue;
      drawShadow(x, y + 24, 42, 9);
      drawRift(x, y, 62, elapsed * 1.3 + dungeon.level);
      ctx.strokeStyle = '#6af2ff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x - 22, y + 34);
      ctx.lineTo(x, y - 34);
      ctx.lineTo(x + 22, y + 34);
      ctx.stroke();
      if (dist(state.player.x, state.player.y, dungeon.x, dungeon.y) < 82) {
        drawBadge(x, y - 66, 'E', '#10151b', '#6af2ff');
      }
    }
  }

  function drawTree(x, y, s) {
    ctx.fillStyle = '#5b3d28';
    roundRect(x - 5 * s, y - 22 * s, 10 * s, 26 * s, 4 * s);
    ctx.fill();
    const g = ctx.createRadialGradient(x - 8 * s, y - 42 * s, 4 * s, x, y - 38 * s, 32 * s);
    g.addColorStop(0, '#5fa85f');
    g.addColorStop(1, '#183a28');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y - 38 * s, 27 * s, 24 * s, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(210, 255, 184, 0.12)';
    ctx.beginPath();
    ctx.ellipse(x - 9 * s, y - 48 * s, 10 * s, 6 * s, -0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawLamp(x, y) {
    ctx.strokeStyle = '#2a1d18';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - 34);
    ctx.stroke();
    const glow = ctx.createRadialGradient(x, y - 40, 2, x, y - 40, 24);
    glow.addColorStop(0, 'rgba(255, 223, 115, 0.75)');
    glow.addColorStop(1, 'rgba(255, 223, 115, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y - 40, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffe16f';
    ctx.fillRect(x - 5, y - 45, 10, 10);
  }

  function drawCrate(x, y) {
    ctx.fillStyle = '#835b37';
    roundRect(x, y, 24, 20, 3);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.strokeRect(x + 3, y + 3, 18, 14);
  }

  function drawCrystal(x, y, s) {
    ctx.fillStyle = 'rgba(106, 242, 255, 0.18)';
    ctx.beginPath();
    ctx.arc(x, y, 22 * s, 0, Math.PI * 2);
    ctx.fill();
    const g = ctx.createLinearGradient(x - 12 * s, y - 28 * s, x + 10 * s, y + 8 * s);
    g.addColorStop(0, '#d7fbff');
    g.addColorStop(0.5, '#61d9e8');
    g.addColorStop(1, '#276272');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x, y - 34 * s);
    ctx.lineTo(x + 15 * s, y - 6 * s);
    ctx.lineTo(x + 3 * s, y + 14 * s);
    ctx.lineTo(x - 15 * s, y - 4 * s);
    ctx.closePath();
    ctx.fill();
  }

  function drawNpc(npc) {
    const x = npc.x - camera.x;
    const y = npc.y - camera.y;
    drawShadow(x, y + 22, 24, 7);
    ctx.fillStyle = npc.color;
    ctx.beginPath();
    ctx.arc(x, y - 20, 14, 0, Math.PI * 2);
    ctx.fill();
    const g = ctx.createLinearGradient(x - 20, y - 4, x + 18, y + 32);
    g.addColorStop(0, npc.color);
    g.addColorStop(1, '#1d2632');
    ctx.fillStyle = g;
    roundRect(x - 16, y - 8, 32, 45, 12);
    ctx.fill();
    ctx.fillStyle = '#10151b';
    ctx.beginPath();
    ctx.arc(x - 5, y - 22, 2, 0, Math.PI * 2);
    ctx.arc(x + 5, y - 22, 2, 0, Math.PI * 2);
    ctx.fill();
    if (dist(state.player.x, state.player.y, npc.x, npc.y) < 76) {
      drawBadge(x, y - 62, 'E', '#f6fbff', npc.color);
    }
  }

  function drawWild(wild) {
    const x = wild.x - camera.x;
    const y = wild.y - camera.y;
    if (x < -100 || x > W + 100 || y < -100 || y > H + 100) return;
    const def = CREATURES[wild.id];
    drawShadow(x, y + 22, wild.boss ? 54 : 30, wild.boss ? 13 : 8);
    if (wild.rare) {
      ctx.strokeStyle = wild.boss ? 'rgba(196, 164, 255, 0.75)' : 'rgba(255, 225, 111, 0.75)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y + 2, wild.boss ? 52 : 34, 0, Math.PI * 2);
      ctx.stroke();
    }
    drawCreatureShape(def, x, y, wild.boss ? 1.32 : 0.72, elapsed + wild.phase, wild.boss);
  }

  function drawPlayer(player) {
    const x = player.x - camera.x;
    const y = player.y - camera.y;
    drawShadow(x, y + 27, 30, 8);
    const bob = Math.sin(player.anim) * 2.5;
    const coat = ctx.createLinearGradient(x - 16, y - 28 + bob, x + 16, y + 34 + bob);
    coat.addColorStop(0, '#d9f2ff');
    coat.addColorStop(0.35, '#3eb7c9');
    coat.addColorStop(1, '#1b4050');
    ctx.fillStyle = coat;
    roundRect(x - 17, y - 18 + bob, 34, 50, 14);
    ctx.fill();
    ctx.fillStyle = '#f2ca9f';
    ctx.beginPath();
    ctx.arc(x, y - 30 + bob, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1b2532';
    ctx.beginPath();
    ctx.ellipse(x, y - 40 + bob, 17, 9, 0, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = '#ffe16f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x + (player.facing === 'left' ? -18 : 18), y + 4 + bob, 9, 0.3, Math.PI * 1.7);
    ctx.stroke();
    const companion = state.party[0];
    if (companion) {
      const orbit = elapsed * 1.7;
      drawCreatureShape(CREATURES[companion.id], x - 42 + Math.cos(orbit) * 8, y + 18 + Math.sin(orbit) * 4, 0.38, elapsed, false);
    }
  }

  function drawCreatureShape(def, x, y, s, phase, boss) {
    const [light, mid, dark, accent] = def.palette;
    const bob = Math.sin(phase * 2.4) * 4 * s;
    const body = ctx.createRadialGradient(x - 12 * s, y - 18 * s + bob, 4 * s, x, y + bob, 46 * s);
    body.addColorStop(0, light);
    body.addColorStop(0.48, mid);
    body.addColorStop(1, dark);

    ctx.save();
    ctx.translate(x, y + bob);
    if (boss) {
      ctx.shadowColor = 'rgba(196, 164, 255, 0.65)';
      ctx.shadowBlur = 24;
    }

    if (def.type === 'tide') {
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.ellipse(0, 0, 42 * s, 20 * s, -0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-42 * s, 0);
      ctx.quadraticCurveTo(-62 * s, -22 * s, -78 * s, 2 * s);
      ctx.quadraticCurveTo(-58 * s, 14 * s, -42 * s, 0);
      ctx.fill();
      drawEye(18 * s, -6 * s, 3.5 * s, '#0b1017');
    } else if (def.type === 'stone') {
      ctx.fillStyle = body;
      roundRect(-35 * s, -20 * s, 70 * s, 45 * s, 18 * s);
      ctx.fill();
      ctx.fillStyle = accent;
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath();
        ctx.moveTo(i * 18 * s, -29 * s);
        ctx.lineTo((i * 18 + 10) * s, -12 * s);
        ctx.lineTo((i * 18 - 11) * s, -12 * s);
        ctx.closePath();
        ctx.fill();
      }
      drawEye(14 * s, -6 * s, 3.2 * s, '#0b1017');
      drawEye(-10 * s, -7 * s, 3.2 * s, '#0b1017');
    } else if (def.type === 'volt') {
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.ellipse(0, 4 * s, 32 * s, 26 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.moveTo(-17 * s, -22 * s);
      ctx.lineTo(-32 * s, -50 * s);
      ctx.lineTo(-4 * s, -30 * s);
      ctx.moveTo(15 * s, -22 * s);
      ctx.lineTo(30 * s, -50 * s);
      ctx.lineTo(5 * s, -29 * s);
      ctx.fill();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 5 * s;
      ctx.beginPath();
      ctx.moveTo(-30 * s, 10 * s);
      ctx.lineTo(-54 * s, 2 * s);
      ctx.lineTo(-42 * s, 20 * s);
      ctx.stroke();
      drawEye(9 * s, -4 * s, 3 * s, '#0b1017');
      drawEye(-10 * s, -4 * s, 3 * s, '#0b1017');
    } else if (def.type === 'ember') {
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.ellipse(0, 3 * s, 30 * s, 28 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.moveTo(22 * s, -8 * s);
      ctx.quadraticCurveTo(50 * s, -38 * s, 30 * s, 20 * s);
      ctx.quadraticCurveTo(22 * s, 6 * s, 22 * s, -8 * s);
      ctx.fill();
      drawEye(9 * s, -6 * s, 3 * s, '#0b1017');
      drawEye(-9 * s, -6 * s, 3 * s, '#0b1017');
    } else if (def.type === 'umbra') {
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.ellipse(0, 0, boss ? 45 * s : 37 * s, boss ? 35 * s : 23 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 3 * s;
      if (boss) {
        for (let side of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(side * 15 * s, -28 * s);
          ctx.lineTo(side * 26 * s, -58 * s);
          ctx.lineTo(side * 48 * s, -72 * s);
          ctx.moveTo(side * 28 * s, -52 * s);
          ctx.lineTo(side * 43 * s, -45 * s);
          ctx.stroke();
        }
      } else {
        ctx.beginPath();
        ctx.moveTo(-30 * s, -4 * s);
        ctx.quadraticCurveTo(-54 * s, -22 * s, -62 * s, 12 * s);
        ctx.moveTo(30 * s, -4 * s);
        ctx.quadraticCurveTo(54 * s, -22 * s, 62 * s, 12 * s);
        ctx.stroke();
      }
      drawEye(10 * s, -5 * s, 3.5 * s, accent);
      drawEye(-10 * s, -5 * s, 3.5 * s, accent);
    } else {
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.ellipse(0, 3 * s, 35 * s, 25 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = mid;
      ctx.beginPath();
      ctx.moveTo(-22 * s, -14 * s);
      ctx.lineTo(-35 * s, -43 * s);
      ctx.lineTo(-8 * s, -20 * s);
      ctx.moveTo(22 * s, -14 * s);
      ctx.lineTo(35 * s, -43 * s);
      ctx.lineTo(8 * s, -20 * s);
      ctx.fill();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 5 * s;
      ctx.beginPath();
      ctx.moveTo(-32 * s, 4 * s);
      ctx.quadraticCurveTo(-64 * s, -14 * s, -76 * s, 22 * s);
      ctx.stroke();
      drawEye(10 * s, -6 * s, 3 * s, '#0b1017');
      drawEye(-9 * s, -6 * s, 3 * s, '#0b1017');
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  function drawEye(x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(x - r * 0.3, y - r * 0.4, r * 0.32, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawShadow(x, y, w, h) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function renderOverworldUi() {
    drawPanel(18, 16, 338, 94, 16, 0.72);
    ctx.fillStyle = '#f6fbff';
    ctx.font = '900 19px Inter, system-ui, sans-serif';
    ctx.fillText('AETHER RIFT: WILDBOUND', 36, 45);
    ctx.font = '700 13px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#aac0d9';
    ctx.fillText(`${QUEST.title} - ${questLine()}`, 36, 70);
    ctx.fillStyle = '#ffe16f';
    ctx.fillText(`${state.inventory.prisms} prisms`, 36, 94);
    ctx.fillStyle = '#9ff0c2';
    ctx.fillText(`${state.inventory.coins} coins`, 132, 94);
    ctx.fillStyle = '#6af2ff';
    ctx.fillText(`${state.inventory.herbs} herbs  ${state.inventory.keys || 0} keys`, 220, 94);

    drawPartyHud();
    drawMinimap();

    const npc = nearestNpc();
    const building = nearestBuilding();
    const dungeon = nearestDungeon();
    if (npc && mode === 'overworld') drawPrompt(W / 2 - 155, H - 86, 'E / Tap', `Talk to ${npc.name}`);
    else if (building && mode === 'overworld') drawPrompt(W / 2 - 170, H - 86, 'E / Tap', building.action === 'heal' ? 'Heal at guild' : `Enter ${building.name}`);
    else if (dungeon && mode === 'overworld') drawPrompt(W / 2 - 170, H - 86, 'E / Tap', `Enter ${dungeon.name}`);
    else if (mode === 'overworld') drawPrompt(W / 2 - 170, H - 86, 'WASD', 'Move  |  Shift dash  |  M party');
  }

  function questLine() {
    if (!state.quest.talkedAryn) return QUEST.steps[0];
    if (state.quest.tamed < 3) return `${QUEST.steps[1]} (${state.quest.tamed}/3)`;
    if (!state.quest.defeatedStag) return QUEST.steps[2];
    return 'First rift sealed';
  }

  function drawPartyHud() {
    const x = W - 376;
    drawPanel(x, 16, 238, 94, 16, 0.72);
    ctx.fillStyle = '#dce8ff';
    ctx.font = '900 13px Inter, system-ui, sans-serif';
    ctx.fillText('PARTY', x + 18, 38);
    state.party.slice(0, 3).forEach((creature, i) => {
      const px = x + 21 + i * 70;
      const def = CREATURES[creature.id];
      drawCreatureShape(def, px + 20, 72, 0.27, elapsed + i, false);
      drawHp(px, 94, 50, 6, creature.hp, creature.maxHp);
      ctx.fillStyle = '#f6fbff';
      ctx.font = '800 10px Inter, system-ui, sans-serif';
      ctx.fillText(`Lv${creature.level}`, px + 2, 55);
    });
  }

  function drawMinimap() {
    const x = W - 124;
    const y = 18;
    drawPanel(x, y, 104, 92, 14, 0.68);
    ctx.fillStyle = '#172331';
    roundRect(x + 10, y + 10, 84, 72, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.stroke();
    const sx = 84 / (WORLD_W * TILE);
    const sy = 72 / (WORLD_H * TILE);
    ctx.fillStyle = '#6af2ff';
    ctx.beginPath();
    ctx.arc(x + 10 + state.player.x * sx, y + 10 + state.player.y * sy, 3.2, 0, Math.PI * 2);
    ctx.fill();
    for (const wild of wilds) {
      if (dist(state.player.x, state.player.y, wild.x, wild.y) > 720 && !wild.boss) continue;
      ctx.fillStyle = wild.boss ? '#c4a4ff' : '#ffe16f';
      ctx.fillRect(x + 10 + wild.x * sx - 1.5, y + 10 + wild.y * sy - 1.5, 3, 3);
    }
    for (const dungeon of DUNGEONS) {
      ctx.fillStyle = '#6af2ff';
      ctx.beginPath();
      ctx.moveTo(x + 10 + dungeon.x * sx, y + 7 + dungeon.y * sy);
      ctx.lineTo(x + 14 + dungeon.x * sx, y + 11 + dungeon.y * sy);
      ctx.lineTo(x + 10 + dungeon.x * sx, y + 15 + dungeon.y * sy);
      ctx.lineTo(x + 6 + dungeon.x * sx, y + 11 + dungeon.y * sy);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawPrompt(x, y, key, text) {
    drawPanel(x, y, 340, 48, 14, 0.76);
    drawBadge(x + 34, y + 25, key, '#10151b', '#ffe16f');
    ctx.fillStyle = '#f3f7ff';
    ctx.font = '800 14px Inter, system-ui, sans-serif';
    ctx.fillText(text, x + 68, y + 30);
  }

  function renderBattle() {
    const shakeX = (Math.random() - 0.5) * battle.shake * 12;
    ctx.save();
    ctx.translate(shakeX, 0);
    ctx.fillStyle = 'rgba(5, 8, 13, 0.62)';
    ctx.fillRect(0, 0, W, H);
    const arena = ctx.createLinearGradient(0, 120, 0, H);
    arena.addColorStop(0, 'rgba(26, 42, 60, 0.9)');
    arena.addColorStop(1, 'rgba(12, 16, 22, 0.96)');
    ctx.fillStyle = arena;
    roundRect(80, 100, W - 160, H - 154, 24);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.13)';
    ctx.lineWidth = 2;
    ctx.stroke();

    drawRift(W / 2, 262, 118, elapsed);
    const active = activeCreature();
    drawBattleCreature(active, 310, 405, 1.8, false);
    drawBattleCreature(battle.enemy, 940, 265, battle.enemy.id === 'riftstag' ? 2.2 : 1.85, true);
    ctx.restore();

    drawBattleCard(98, 112, active, false);
    drawBattleCard(W - 420, 112, battle.enemy, true);
    drawBattleLog();
    drawBattleButtons();
  }

  function drawBattleCreature(creature, x, y, scale, enemy) {
    drawShadow(x, y + 70 * scale, 70 * scale, 16 * scale);
    drawCreatureShape(CREATURES[creature.id], x, y, scale, elapsed + (enemy ? 1.5 : 0), creature.id === 'riftstag');
  }

  function drawBattleCard(x, y, creature, enemy) {
    drawPanel(x, y, 320, 86, 16, 0.84);
    const def = CREATURES[creature.id];
    ctx.fillStyle = '#f6fbff';
    ctx.font = '900 18px Inter, system-ui, sans-serif';
    ctx.fillText(enemy ? def.name : creature.nickname, x + 18, y + 30);
    ctx.fillStyle = TYPES[def.type].color;
    ctx.font = '900 12px Inter, system-ui, sans-serif';
    ctx.fillText(`${TYPES[def.type].name}  Lv ${creature.level}`, x + 18, y + 52);
    drawHp(x + 18, y + 65, 282, 10, creature.hp, creature.maxHp);
  }

  function drawBattleLog() {
    drawPanel(98, H - 144, 562, 106, 16, 0.84);
    ctx.fillStyle = '#dce8ff';
    ctx.font = '800 13px Inter, system-ui, sans-serif';
    battle.log.slice(0, 4).forEach((line, i) => {
      ctx.globalAlpha = 1 - i * 0.18;
      ctx.fillText(line, 120, H - 111 + i * 21);
    });
    ctx.globalAlpha = 1;
  }

  function drawBattleButtons() {
    buttons.length = 0;
    const x = W - 574;
    const y = H - 144;
    drawPanel(x, y, 476, 106, 16, 0.84);
    const base = [
      ['attack', 'Strike', '#8fc9ff'],
      ['special', 'Skill', '#ffe16f'],
      ['guard', 'Guard', '#9ff0c2'],
      ['tame', `Tame (${state.inventory.prisms})`, '#c4a4ff']
    ];
    base.forEach(([action, label, color], i) => {
      const bx = x + 18 + (i % 2) * 220;
      const by = y + 16 + Math.floor(i / 2) * 43;
      drawButton(bx, by, 204, 34, label, color, battle.turn !== 'player');
      buttons.push({ action, x: bx, y: by, w: 204, h: 34 });
    });

    state.party.forEach((creature, i) => {
      if (i === battle.activeIndex) return;
      buttons.push({ action: `swap-${i}`, x: 100 + i * 90, y: 204, w: 76, h: 28 });
    });
  }

  function renderShop() {
    buttons.length = 0;
    ctx.fillStyle = 'rgba(5, 8, 13, 0.76)';
    ctx.fillRect(0, 0, W, H);
    drawPanel(196, 92, W - 392, H - 184, 22, 0.94);
    ctx.fillStyle = '#f6fbff';
    ctx.font = '900 32px Inter, system-ui, sans-serif';
    ctx.fillText('Mira Market', 236, 146);
    ctx.fillStyle = '#ffe16f';
    ctx.font = '900 16px Inter, system-ui, sans-serif';
    ctx.fillText(`${state.inventory.coins} coins`, W - 360, 146);
    ctx.fillStyle = '#aac0d9';
    ctx.font = '800 14px Inter, system-ui, sans-serif';
    ctx.fillText('Buy supplies for captures and dungeon runs. M / Esc closes.', 236, 174);

    SHOP_ITEMS.forEach((item, i) => {
      const y = 220 + i * 102;
      drawPanel(236, y, W - 472, 76, 15, 0.62);
      ctx.fillStyle = '#f6fbff';
      ctx.font = '900 19px Inter, system-ui, sans-serif';
      ctx.fillText(item.name, 260, y + 30);
      ctx.fillStyle = '#aac0d9';
      ctx.font = '800 13px Inter, system-ui, sans-serif';
      ctx.fillText(item.desc, 260, y + 54);
      drawButton(W - 430, y + 19, 150, 38, `${item.cost} coins`, '#ffe16f', state.inventory.coins < item.cost);
      buttons.push({ action: `buy-${item.id}`, x: W - 430, y: y + 19, w: 150, h: 38 });
    });

    drawInventoryStrip(236, H - 162);
  }

  function renderStable() {
    buttons.length = 0;
    ctx.fillStyle = 'rgba(5, 8, 13, 0.76)';
    ctx.fillRect(0, 0, W, H);
    drawPanel(94, 70, W - 188, H - 140, 22, 0.94);
    ctx.fillStyle = '#f6fbff';
    ctx.font = '900 31px Inter, system-ui, sans-serif';
    ctx.fillText('Wildbound Stable', 132, 122);
    ctx.fillStyle = '#aac0d9';
    ctx.font = '800 14px Inter, system-ui, sans-serif';
    ctx.fillText('Restore, train and swap creatures. Select a party slot, then choose a stable creature.', 132, 150);

    drawButton(W - 430, 102, 134, 38, 'Heal all', '#9ff0c2', state.inventory.coins < 25 && !state.quest.defeatedStag);
    drawButton(W - 280, 102, 134, 38, 'Train', '#ffe16f', state.inventory.coins < 120);
    buttons.push({ action: 'heal', x: W - 430, y: 102, w: 134, h: 38 });
    buttons.push({ action: 'train', x: W - 280, y: 102, w: 134, h: 38 });

    ctx.fillStyle = '#dce8ff';
    ctx.font = '900 16px Inter, system-ui, sans-serif';
    ctx.fillText('Party', 132, 198);
    state.party.forEach((creature, i) => {
      const x = 132 + i * 206;
      const selected = i === state.ui.stableSelected;
      drawPanel(x, 218, 184, 168, 16, selected ? 0.78 : 0.56);
      if (selected) {
        ctx.strokeStyle = '#6af2ff';
        ctx.lineWidth = 2;
        roundRect(x, 218, 184, 168, 16);
        ctx.stroke();
      }
      drawCreatureShape(CREATURES[creature.id], x + 52, 294, 0.58, elapsed + i, false);
      ctx.fillStyle = '#f6fbff';
      ctx.font = '900 14px Inter, system-ui, sans-serif';
      ctx.fillText(creature.nickname, x + 92, 258);
      ctx.fillStyle = TYPES[CREATURES[creature.id].type].color;
      ctx.font = '900 12px Inter, system-ui, sans-serif';
      ctx.fillText(`Lv ${creature.level}`, x + 92, 280);
      drawHp(x + 22, 348, 138, 8, creature.hp, creature.maxHp);
      buttons.push({ action: `party-${i}`, x, y: 218, w: 184, h: 168 });
    });

    ctx.fillStyle = '#dce8ff';
    ctx.font = '900 16px Inter, system-ui, sans-serif';
    ctx.fillText('Stable', 132, 434);
    const stableList = state.stable.slice(0, 8);
    if (!stableList.length) {
      ctx.fillStyle = '#8ea4bd';
      ctx.font = '800 14px Inter, system-ui, sans-serif';
      ctx.fillText('Captured creatures beyond party size will wait here.', 132, 468);
    }
    stableList.forEach((creature, i) => {
      const x = 132 + (i % 4) * 246;
      const y = 456 + Math.floor(i / 4) * 92;
      drawPanel(x, y, 220, 68, 14, 0.58);
      drawCreatureShape(CREATURES[creature.id], x + 38, y + 40, 0.34, elapsed + i, false);
      ctx.fillStyle = '#f6fbff';
      ctx.font = '900 14px Inter, system-ui, sans-serif';
      ctx.fillText(creature.nickname, x + 76, y + 28);
      ctx.fillStyle = TYPES[CREATURES[creature.id].type].color;
      ctx.font = '900 11px Inter, system-ui, sans-serif';
      ctx.fillText(`${TYPES[CREATURES[creature.id].type].name} Lv ${creature.level}`, x + 76, y + 48);
      buttons.push({ action: `stable-${i}`, x, y, w: 220, h: 68 });
    });

    drawInventoryStrip(132, H - 102);
  }

  function renderDungeon() {
    buttons.length = 0;
    const dungeon = currentDungeonDef();
    ctx.fillStyle = 'rgba(5, 8, 13, 0.78)';
    ctx.fillRect(0, 0, W, H);
    drawPanel(180, 84, W - 360, H - 168, 24, 0.94);
    drawRift(W / 2, 250, 158, elapsed * 1.4);
    ctx.fillStyle = '#f6fbff';
    ctx.font = '900 34px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(dungeon.name, W / 2, 144);
    ctx.fillStyle = '#aac0d9';
    ctx.font = '800 15px Inter, system-ui, sans-serif';
    ctx.fillText(`Depth ${state.dungeon?.depth || 1}/${state.dungeon?.maxDepth || dungeon.maxDepth}  |  Loot ${state.dungeon?.loot || 0} coins`, W / 2, 174);
    ctx.textAlign = 'left';

    const nextLabel = (state.dungeon?.depth || 1) >= (state.dungeon?.maxDepth || 1) ? 'Fight guardian' : 'Fight next room';
    drawButton(W / 2 - 270, H - 190, 180, 44, nextLabel, '#8fc9ff');
    drawButton(W / 2 - 70, H - 190, 140, 44, `Camp (${state.inventory.herbs})`, '#9ff0c2', state.inventory.herbs <= 0);
    drawButton(W / 2 + 90, H - 190, 180, 44, 'Leave', '#ffb4a4');
    buttons.push({ action: 'fight', x: W / 2 - 270, y: H - 190, w: 180, h: 44 });
    buttons.push({ action: 'camp', x: W / 2 - 70, y: H - 190, w: 140, h: 44 });
    buttons.push({ action: 'leave', x: W / 2 + 90, y: H - 190, w: 180, h: 44 });

    state.party.forEach((creature, i) => {
      const x = W / 2 - 250 + i * 250;
      drawCreatureShape(CREATURES[creature.id], x, 390, 0.82, elapsed + i, false);
      drawHp(x - 60, 462, 120, 9, creature.hp, creature.maxHp);
      ctx.fillStyle = '#f6fbff';
      ctx.font = '900 13px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${creature.nickname} Lv${creature.level}`, x, 488);
      ctx.textAlign = 'left';
    });
  }

  function drawInventoryStrip(x, y) {
    drawPanel(x, y, 520, 54, 14, 0.54);
    ctx.fillStyle = '#f6fbff';
    ctx.font = '900 13px Inter, system-ui, sans-serif';
    ctx.fillText(`${state.inventory.prisms} prisms`, x + 22, y + 33);
    ctx.fillStyle = '#9ff0c2';
    ctx.fillText(`${state.inventory.herbs} herbs`, x + 142, y + 33);
    ctx.fillStyle = '#6af2ff';
    ctx.fillText(`${state.inventory.keys || 0} keys`, x + 246, y + 33);
    ctx.fillStyle = '#ffe16f';
    ctx.fillText(`${state.inventory.coins} coins`, x + 342, y + 33);
  }

  function renderMenu() {
    buttons.length = 0;
    ctx.fillStyle = 'rgba(5, 8, 13, 0.72)';
    ctx.fillRect(0, 0, W, H);
    drawPanel(88, 48, W - 176, H - 64, 22, 0.92);
    ctx.fillStyle = '#f6fbff';
    ctx.font = '900 31px Inter, system-ui, sans-serif';
    ctx.fillText('Party, Quest and Island Progress', 150, 126);
    ctx.font = '800 15px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#aac0d9';
    ctx.fillText('M / Esc closes. This build is designed as the first vertical slice for content batches.', 150, 154);
    ctx.fillStyle = '#ffe16f';
    ctx.font = '900 15px Inter, system-ui, sans-serif';
    ctx.fillText(`Score ${computeScore()}  |  Captures ${state.stats.captures}  |  Evolutions ${state.stats.evolutions}  |  Dungeons ${state.stats.dungeonsCleared}`, 150, 180);

    for (let i = 0; i < 3; i += 1) {
      const creature = state.party[i];
      const x = 150 + i * 320;
      const y = 204;
      drawPanel(x, y, 282, 228, 18, 0.62);
      if (creature) {
        drawCreatureShape(CREATURES[creature.id], x + 72, y + 92, 0.92, elapsed + i, false);
        const def = CREATURES[creature.id];
        ctx.fillStyle = '#f6fbff';
        ctx.font = '900 20px Inter, system-ui, sans-serif';
        ctx.fillText(creature.nickname, x + 130, y + 54);
        ctx.fillStyle = TYPES[def.type].color;
        ctx.font = '900 13px Inter, system-ui, sans-serif';
        ctx.fillText(`${TYPES[def.type].name} / Lv ${creature.level}`, x + 130, y + 78);
        ctx.fillStyle = '#aac0d9';
        ctx.font = '700 12px Inter, system-ui, sans-serif';
        wrapText(def.bio, x + 130, y + 104, 128, 16);
        drawHp(x + 24, y + 184, 234, 10, creature.hp, creature.maxHp);
        drawXp(x + 24, y + 202, 234, 8, creature.xp, xpToNext(creature));
      } else {
        ctx.strokeStyle = 'rgba(106, 242, 255, 0.32)';
        ctx.setLineDash([8, 8]);
        roundRect(x + 54, y + 42, 174, 112, 18);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(106, 242, 255, 0.22)';
        ctx.beginPath();
        ctx.arc(x + 142, y + 88, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f6fbff';
        ctx.font = '900 19px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Open slot', x + 142, y + 180);
        ctx.fillStyle = '#aac0d9';
        ctx.font = '800 12px Inter, system-ui, sans-serif';
        ctx.fillText('Tame a wild creature', x + 142, y + 202);
        ctx.textAlign = 'left';
      }
    }

    drawPanel(150, 456, 486, 156, 18, 0.58);
    ctx.fillStyle = '#ffe16f';
    ctx.font = '900 17px Inter, system-ui, sans-serif';
    ctx.fillText(QUEST.title, 176, 488);
    ctx.fillStyle = '#dce8ff';
    ctx.font = '800 14px Inter, system-ui, sans-serif';
    QUEST.steps.forEach((step, i) => {
      const done = (i === 0 && state.quest.talkedAryn) || (i === 1 && state.quest.tamed >= 3) || (i === 2 && state.quest.defeatedStag);
      ctx.fillStyle = done ? '#9ff0c2' : '#aac0d9';
      ctx.fillText(`${done ? 'DONE' : 'NEXT'}  ${step}`, 176, 516 + i * 24);
    });
    const latestEvent = state.history[0];
    if (latestEvent) {
      ctx.fillStyle = '#8fc9ff';
      ctx.font = '900 12px Inter, system-ui, sans-serif';
      ctx.fillText('Latest chronicle', 176, 588);
      ctx.fillStyle = '#dce8ff';
      ctx.font = '800 12px Inter, system-ui, sans-serif';
      const text = latestEvent.text.length > 54 ? `${latestEvent.text.slice(0, 51)}...` : latestEvent.text;
      ctx.fillText(text, 286, 588);
    }

    drawPanel(662, 456, 466, 156, 18, 0.58);
    ctx.fillStyle = '#6af2ff';
    ctx.font = '900 17px Inter, system-ui, sans-serif';
    ctx.fillText(`Codex ${Object.keys(state.codex.captured || {}).length}/${Object.keys(CREATURES).length}`, 688, 488);
    const codexIds = Object.keys(CREATURES).filter((id) => state.codex.seen[id] || state.codex.captured[id]).slice(0, 10);
    codexIds.forEach((id, i) => {
      const x = 690 + (i % 5) * 84;
      const y = 526 + Math.floor(i / 5) * 44;
      drawCreatureShape(CREATURES[id], x, y, 0.23, elapsed + i, false);
      ctx.fillStyle = state.codex.captured[id] ? '#9ff0c2' : '#8ea4bd';
      ctx.font = '800 10px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(state.codex.captured[id] ? 'owned' : 'seen', x, y + 27);
      ctx.textAlign = 'left';
    });

    drawContractsPanel(150, 626);
    drawAchievementsPanel(666, 626);
  }

  function drawContractsPanel(x, y) {
    drawPanel(x, y, 486, 76, 16, 0.58);
    ctx.fillStyle = '#ffe16f';
    ctx.font = '900 14px Inter, system-ui, sans-serif';
    ctx.fillText(`Daily Contracts ${state.contracts.day || dayKey()}`, x + 18, y + 24);
    activeContracts().forEach((contract, i) => {
      const progress = Math.min(contract.target, contractProgress(contract));
      const claimed = !!state.contracts.claimed?.[contract.id];
      const bx = x + 18 + i * 151;
      ctx.fillStyle = claimed ? '#9ff0c2' : progress >= contract.target ? '#f6fbff' : '#aac0d9';
      ctx.font = '800 11px Inter, system-ui, sans-serif';
      ctx.fillText(`${contract.name}`, bx, y + 45);
      drawButton(bx, y + 51, 128, 20, claimed ? 'Claimed' : `${progress}/${contract.target}`, progress >= contract.target && !claimed ? '#ffe16f' : '#4d6073', claimed);
      buttons.push({ action: `claim-${contract.id}`, x: bx, y: y + 51, w: 128, h: 20 });
    });
  }

  function drawAchievementsPanel(x, y) {
    drawPanel(x, y, 462, 76, 16, 0.58);
    ctx.fillStyle = '#6af2ff';
    ctx.font = '900 14px Inter, system-ui, sans-serif';
    const unlocked = ACHIEVEMENTS.filter((achievement) => state.achievements[achievement.id]).length;
    ctx.fillText(`Achievements ${unlocked}/${ACHIEVEMENTS.length}`, x + 18, y + 24);
    ACHIEVEMENTS.slice(0, 6).forEach((achievement, i) => {
      const bx = x + 20 + i * 72;
      const done = state.achievements[achievement.id];
      ctx.fillStyle = done ? '#9ff0c2' : 'rgba(142, 164, 189, 0.45)';
      ctx.beginPath();
      ctx.arc(bx + 18, y + 50, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = done ? '#081016' : '#aac0d9';
      ctx.font = '900 10px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(i + 1), bx + 18, y + 54);
      ctx.textAlign = 'left';
    });
  }

  function drawPanel(x, y, w, h, r = 12, alpha = 0.8) {
    ctx.fillStyle = `rgba(10, 15, 23, ${alpha})`;
    roundRect(x, y, w, h, r);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function drawButton(x, y, w, h, label, color, disabled = false) {
    const fontSize = h <= 22 ? 10 : 13;
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, disabled ? 'rgba(69, 80, 97, 0.5)' : color);
    g.addColorStop(1, disabled ? 'rgba(30, 36, 48, 0.75)' : 'rgba(18, 23, 33, 0.9)');
    ctx.fillStyle = g;
    roundRect(x, y, w, h, 10);
    ctx.fill();
    ctx.strokeStyle = disabled ? 'rgba(255, 255, 255, 0.07)' : 'rgba(255, 255, 255, 0.18)';
    ctx.stroke();
    ctx.fillStyle = disabled ? '#7f8ca1' : '#f6fbff';
    ctx.font = `900 ${fontSize}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(label, x + w / 2, y + h / 2 + fontSize * 0.36);
    ctx.textAlign = 'left';
  }

  function drawBadge(x, y, text, color, bg) {
    ctx.fillStyle = bg;
    roundRect(x - 19, y - 15, 38, 30, 10);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.font = '900 11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, x, y + 4);
    ctx.textAlign = 'left';
  }

  function drawHp(x, y, w, h, hp, maxHp) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    roundRect(x, y, w, h, h / 2);
    ctx.fill();
    const ratio = clamp(hp / maxHp, 0, 1);
    ctx.fillStyle = ratio > 0.5 ? '#9ff0c2' : ratio > 0.25 ? '#ffe16f' : '#ff7777';
    roundRect(x, y, Math.max(h, w * ratio), h, h / 2);
    ctx.fill();
  }

  function drawXp(x, y, w, h, xp, next) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    roundRect(x, y, w, h, h / 2);
    ctx.fill();
    ctx.fillStyle = '#8fc9ff';
    roundRect(x, y, Math.max(h, w * clamp(xp / next, 0, 1)), h, h / 2);
    ctx.fill();
  }

  function drawRift(x, y, r, phase) {
    for (let i = 0; i < 7; i += 1) {
      ctx.strokeStyle = `rgba(${120 + i * 18}, ${210 - i * 10}, 255, ${0.11 + i * 0.035})`;
      ctx.lineWidth = 2 + i;
      ctx.beginPath();
      ctx.ellipse(x, y, r * (0.45 + i * 0.075), r * (0.22 + i * 0.048), phase * 0.25 + i * 0.55, 0, Math.PI * 2);
      ctx.stroke();
    }
    const g = ctx.createRadialGradient(x, y, r * 0.04, x, y, r * 0.62);
    g.addColorStop(0, 'rgba(210, 248, 255, 0.52)');
    g.addColorStop(0.35, 'rgba(106, 242, 255, 0.18)');
    g.addColorStop(1, 'rgba(196, 164, 255, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.62, 0, Math.PI * 2);
    ctx.fill();
  }

  function renderFloaters() {
    ctx.textAlign = 'center';
    for (const f of floaters) {
      const alpha = clamp(f.life / f.max, 0, 1);
      const x = f.world ? f.x - camera.x : f.x;
      const y = f.world ? f.y - camera.y : f.y;
      const width = f.text.length > 55 ? 580 : Math.max(120, f.text.length * 8.3 + 28);
      if (f.world && f.text.length > 32) {
        drawPanel(x - width / 2, y - 28, width, 50, 12, 0.76 * alpha);
      }
      ctx.globalAlpha = alpha;
      ctx.fillStyle = f.color;
      ctx.font = f.text.length > 55 ? '800 12px Inter, system-ui, sans-serif' : '900 15px Inter, system-ui, sans-serif';
      ctx.fillText(f.text, x, y);
      ctx.globalAlpha = 1;
    }
    ctx.textAlign = 'left';
  }

  function wrapText(text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, x, y);
        y += lineHeight;
        line = word;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, x, y);
  }

  function roundRect(x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function pointerToCanvas(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * W,
      y: ((event.clientY - rect.top) / rect.height) * H
    };
  }

  function onCanvasPointerDown(event) {
    if (event.pointerType === 'touch') document.body.classList.add('show-touch');
    const point = pointerToCanvas(event);
    if (mode === 'title') {
      startGame();
      return;
    }
    if (mode === 'battle' || mode === 'menu' || mode === 'shop' || mode === 'stable' || mode === 'dungeon') {
      for (const button of buttons) {
        if (point.x >= button.x && point.x <= button.x + button.w && point.y >= button.y && point.y <= button.y + button.h) {
          if (mode === 'battle') playerBattleAction(button.action);
          else if (mode === 'menu' && button.action.startsWith('claim-')) claimContract(button.action.slice(6));
          else if (mode === 'shop') buyShopItem(button.action.replace('buy-', ''));
          else if (mode === 'stable') stableAction(button.action);
          else if (mode === 'dungeon') {
            if (button.action === 'fight') startDungeonBattle();
            if (button.action === 'camp') useDungeonHerb();
            if (button.action === 'leave') leaveDungeon();
          }
          return;
        }
      }
      return;
    }
    if (mode === 'overworld') input.interact = true;
  }

  function setupInput() {
    if (navigator.maxTouchPoints > 0) document.body.classList.add('show-touch');
    window.addEventListener('keydown', (event) => {
      const key = event.key.toLowerCase();
      keys.add(key);
      if (mode === 'title') startGame();
      if (key === 'e' || key === 'enter') input.interact = true;
      if (key === 'm' || key === 'i' || key === 'tab') {
        event.preventDefault();
        input.menu = true;
      }
      if (mode === 'battle') {
        if (key === '1') playerBattleAction('attack');
        if (key === '2') playerBattleAction('special');
        if (key === '3') playerBattleAction('guard');
        if (key === '4') playerBattleAction('tame');
      }
      if (key === 'f') toggleMute();
    });
    window.addEventListener('keyup', (event) => {
      keys.delete(event.key.toLowerCase());
    });
    canvas.addEventListener('pointerdown', onCanvasPointerDown);

    document.querySelectorAll('.touch-btn').forEach((button) => {
      button.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        const action = button.dataset.action;
        if (action === 'interact') input.interact = true;
        if (action === 'dash') keys.add('shift');
        if (action === 'menu') input.menu = true;
      });
      button.addEventListener('pointerup', () => {
        if (button.dataset.action === 'dash') keys.delete('shift');
      });
      button.addEventListener('pointercancel', () => {
        if (button.dataset.action === 'dash') keys.delete('shift');
      });
    });

    if (stick) {
      let activeId = null;
      const resetStick = () => {
        activeId = null;
        input.touchX = 0;
        input.touchY = 0;
        if (stickKnob) {
          stickKnob.style.left = '42px';
          stickKnob.style.top = '42px';
        }
      };
      stick.addEventListener('pointerdown', (event) => {
        activeId = event.pointerId;
        stick.setPointerCapture(activeId);
        moveStick(event);
        if (mode === 'title') startGame();
      });
      stick.addEventListener('pointermove', (event) => {
        if (event.pointerId === activeId) moveStick(event);
      });
      stick.addEventListener('pointerup', resetStick);
      stick.addEventListener('pointercancel', resetStick);
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        window.CrazyBridge?.gameplayStop?.();
        saveNow();
      } else if (mode === 'overworld') {
        window.CrazyBridge?.gameplayStart?.();
      }
    });
  }

  function moveStick(event) {
    const rect = stick.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = event.clientX - cx;
    const dy = event.clientY - cy;
    const len = Math.hypot(dx, dy);
    const max = rect.width * 0.32;
    const n = len > 0 ? Math.min(1, len / max) : 0;
    input.touchX = len > 0 ? (dx / len) * n : 0;
    input.touchY = len > 0 ? (dy / len) * n : 0;
    if (stickKnob) {
      const kx = 42 + input.touchX * max;
      const ky = 42 + input.touchY * max;
      stickKnob.style.left = `${kx}px`;
      stickKnob.style.top = `${ky}px`;
    }
  }

  function toggleMute() {
    muted = !muted;
    state.settings.muted = muted;
    window.CrazyBridge?.setSettings?.(state.settings);
    addFloater(muted ? 'Audio muted' : 'Audio on', W / 2, 88, 1.2, '#dce8ff');
  }

  function loop(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }

  async function main() {
    await window.CrazyBridge?.loadingStart?.();
    setupInput();
    await window.CrazyBridge?.onMuteChange?.((value) => {
      muted = value;
      state.settings.muted = value;
    });
    await loadGame();
    requestAnimationFrame(loop);
  }

  window.__AETHER_AD_START__ = () => {
    window.CrazyBridge?.gameplayStop?.();
  };
  window.__AETHER_AD_END__ = () => {
    if (mode === 'overworld') window.CrazyBridge?.gameplayStart?.();
  };

  main();
})();
