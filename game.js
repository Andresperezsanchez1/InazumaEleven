
"use strict";

/* =====================================================
   CONFIGURACIÓN
===================================================== */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");


let W = 900;
let H = 560;
let scale = 1;

let coins = 500;
let scoreHome = 0;
let scoreAway = 0;
let timeLeft = 90;

const GAME_STATE = {
  MATCH_NOT_STARTED: 0,
  KICKOFF_WAITING: 1,
  PLAYING: 2,
  GOAL_PAUSE: 3,
  GAME_OVER: 4
};

let gameState = GAME_STATE.MATCH_NOT_STARTED;
let running = true;
let inDuel = false;
let duelData = null;

let controlled = null;
let players = [];
let effects = [];
let techniqueSequence = null;
let aiShotCooldown = 0;
let aiTechniqueCooldown = 0;
let aiDecisionCooldown = 0;
let aiPassCooldown = 0;
let aiStealCooldownUntil = 0;
let keeperSaveCooldown = 0;
let cameraShake = 0;

let joystick = { x: 0, y: 0, active: false, pointerId: null };
let lastActiveDir = { x: 1, y: 0 };

let sprinting = false;
let lastTime = 0;
let stealCooldownUntil = 0;
let duelCooldownUntil = 0;
let kickoffSide = 0;

let ball = {
  x: 450,
  y: 280,
  vx: 0,
  vy: 0,
  owner: null,
  pickupImmunityUntil: 0,
  isSpecialShot: false,
  isShot: false,
  iceBall: false
};

/* =====================================================
   BASE DE DATOS DE PERSONAJES
===================================================== */

const DATABASE = [
  {name:"Mark Evans",role:"POR",rating:85,color:"#e9b63c",hair:"#4b281c",speed:1.4,shot:55,emoji:"🧤",techName:"MANO CELESTIAL",techType:"PARADA",pt:110,maxPt:110,ptCost:35},
  {name:"Jack Wallside",role:"DEF",rating:79,color:"#3886b7",hair:"#493126",speed:1.4,shot:55,emoji:"🛡️",techName:"EL MURO",techType:"DEFENSA",pt:90,maxPt:90,ptCost:30},
  {name:"Jude Sharp",role:"MC",rating:86,color:"#624e9d",hair:"#33243b",speed:1.8,shot:78,emoji:"⚡",techName:"ESPEJISMO DE BALÓN",techType:"REGATE",pt:115,maxPt:115,ptCost:35},
  {name:"Shawn Froste",role:"DEL",rating:89,color:"#80b9d9",hair:"#d6e6ed",speed:2,shot:91,emoji:"❄️",techName:"VENTISCA ETERNA",techType:"TIRO",pt:120,maxPt:120,ptCost:45},
  {name:"Axel Blaze",role:"DEL",rating:88,color:"#d84b37",hair:"#e6d9b7",speed:1.9,shot:92,emoji:"🔥",techName:"TORNADO DE FUEGO",techType:"TIRO",pt:115,maxPt:115,ptCost:40},
  {name:"Nathan Swift",role:"DEF",rating:80,color:"#3b7db8",hair:"#2c3e50",speed:2.2,shot:68,emoji:"🌪️",techName:"REGATE EN ESPIRAL",techType:"REGATE",pt:95,maxPt:95,ptCost:30},
  {name:"Kevin Dragonfly",role:"DEL",rating:78,color:"#8e44ad",hair:"#2c3e50",speed:1.6,shot:82,emoji:"🐉",techName:"REMATE DRAGÓN",techType:"TIRO",pt:90,maxPt:90,ptCost:35},
  {name:"Hurley Kane",role:"DEF",rating:81,color:"#e67e22",hair:"#d35400",speed:1.7,shot:80,emoji:"🌊",techName:"TIRO DEL MEGAAULÓN",techType:"TIRO",pt:100,maxPt:100,ptCost:35},
  {name:"Darren LaChance",role:"POR",rating:82,color:"#27ae60",hair:"#16a085",speed:1.4,shot:50,emoji:"👐",techName:"MANO MÁGICA",techType:"PARADA",pt:105,maxPt:105,ptCost:35},
  {name:"Xavier Foster",role:"DEL",rating:90,color:"#e74c3c",hair:"#c0392b",speed:2.1,shot:94,emoji:"☄️",techName:"CAÑÓN METEORITO",techType:"TIRO",pt:130,maxPt:130,ptCost:50},
  {name:"Jordan Greenway",role:"MC",rating:83,color:"#2ecc71",hair:"#27ae60",speed:1.9,shot:76,emoji:"🌌",techName:"ASTRAL",techType:"REGATE",pt:105,maxPt:105,ptCost:35},
  {name:"David Samford",role:"DEL",rating:83,color:"#16a085",hair:"#117864",speed:1.8,shot:84,emoji:"🐧",techName:"PINGÜINO DIGITAL",techType:"TIRO",pt:100,maxPt:100,ptCost:40},
  {name:"Joseph King",role:"POR",rating:81,color:"#f39c12",hair:"#d68910",speed:1.4,shot:48,emoji:"🛡️",techName:"ESCUDO DE FUERZA",techType:"PARADA",pt:100,maxPt:100,ptCost:35},
  {name:"Caleb Stonewall",role:"MC",rating:84,color:"#7d3c98",hair:"#512e5f",speed:1.8,shot:79,emoji:"⚡",techName:"DESLIZAMIENTO CORTANTE",techType:"DEFENSA",pt:110,maxPt:110,ptCost:35},
  {name:"Byron Love",role:"DEL",rating:88,color:"#f1c40f",hair:"#b7950b",speed:1.9,shot:88,emoji:"👼",techName:"SABIDURÍA DIVINA",techType:"TIRO",pt:125,maxPt:125,ptCost:50},
  {name:"Gazel",role:"DEL",rating:88,color:"#aed6f1",hair:"#5d6d7e",speed:2.1,shot:90,emoji:"🧊",techName:"BALÓN DE HIELO",techType:"TIRO",pt:120,maxPt:120,ptCost:45},
  {name:"Torch",role:"DEL",rating:88,color:"#f1948a",hair:"#78281f",speed:2.1,shot:90,emoji:"🔥",techName:"LLAMARADA ATÓMICA",techType:"TIRO",pt:120,maxPt:120,ptCost:45},
  // Raimon
  {name:"Bobby Shearer",role:"DEF",rating:78,color:"#587a9e",hair:"#7b604b",speed:1.7,shot:62,emoji:"🛡️",techName:"BARRERA DEFENSIVA",techType:"DEFENSA",pt:90,maxPt:90,ptCost:30},
  {name:"Timmy Saunders",role:"MC",rating:75,color:"#e2b64f",hair:"#b77a38",speed:1.8,shot:65,emoji:"⚡",techName:"PASE RELÁMPAGO",techType:"REGATE",pt:85,maxPt:85,ptCost:30},
  {name:"Sam Kincaid",role:"DEF",rating:76,color:"#6c9b65",hair:"#65402e",speed:1.6,shot:60,emoji:"🛡️",techName:"BLOQUEO DOBLE",techType:"DEFENSA",pt:88,maxPt:88,ptCost:30},
  {name:"Steve Grim",role:"MC",rating:77,color:"#bd8b54",hair:"#7c4d32",speed:1.8,shot:70,emoji:"⚽",techName:"TIRO GIRATORIO",techType:"TIRO",pt:90,maxPt:90,ptCost:35},
  {name:"William Glass",role:"DEL",rating:74,color:"#8a9cb4",hair:"#c8c5bd",speed:1.9,shot:73,emoji:"💨",techName:"REGATE FANTASMA",techType:"REGATE",pt:85,maxPt:85,ptCost:30},
  {name:"Erik Eagle",role:"MC",rating:82,color:"#c75c42",hair:"#9c633c",speed:1.9,shot:79,emoji:"🦅",techName:"TIRO DEL ÁGUILA",techType:"TIRO",pt:100,maxPt:100,ptCost:38},
  {name:"Celia Hills",role:"MC",rating:76,color:"#7d9fc4",hair:"#60483d",speed:1.7,shot:64,emoji:"🌟",techName:"PASE PRECISO",techType:"REGATE",pt:90,maxPt:90,ptCost:30},
  {name:"Silvia Woods",role:"MC",rating:75,color:"#db8ba7",hair:"#8c563e",speed:1.7,shot:61,emoji:"💗",techName:"APOYO TOTAL",techType:"REGATE",pt:88,maxPt:88,ptCost:30},
  // Royal Academy
  {name:"Seymour Hillman",role:"POR",rating:84,color:"#8c8caa",hair:"#443b55",speed:1.4,shot:48,emoji:"🧤",techName:"MANO FANTASMA",techType:"PARADA",pt:110,maxPt:110,ptCost:35},
  {name:"King",role:"DEL",rating:86,color:"#7e57c2",hair:"#d8c7a5",speed:1.9,shot:88,emoji:"👑",techName:"LANZA DEL REY",techType:"TIRO",pt:115,maxPt:115,ptCost:45},
  {name:"Derek Swing",role:"MC",rating:82,color:"#546e7a",hair:"#47352d",speed:1.8,shot:76,emoji:"🌀",techName:"REGATE GIRATORIO",techType:"REGATE",pt:100,maxPt:100,ptCost:35},
  {name:"Alan Master",role:"DEF",rating:80,color:"#607d8b",hair:"#302b2b",speed:1.6,shot:68,emoji:"🛡️",techName:"MURO DE ACERO",techType:"DEFENSA",pt:95,maxPt:95,ptCost:32},
  {name:"Jimon Daiki",role:"DEF",rating:78,color:"#795548",hair:"#392b25",speed:1.6,shot:65,emoji:"🛡️",techName:"BLOQUEO REAL",techType:"DEFENSA",pt:90,maxPt:90,ptCost:30},
  // Zeus
  {name:"Poseidon",role:"POR",rating:86,color:"#a82e50",hair:"#271b2b",speed:1.4,shot:50,emoji:"🌊",techName:"MURALLA GIGANTE",techType:"PARADA",pt:115,maxPt:115,ptCost:40},
  {name:"Aphrodite",role:"DEL",rating:91,color:"#e5c7ed",hair:"#e6d8e9",speed:2.0,shot:94,emoji:"✨",techName:"SABIDURÍA DIVINA",techType:"TIRO",pt:130,maxPt:130,ptCost:50},
  {name:"Demeter",role:"MC",rating:83,color:"#8dba7c",hair:"#b58b54",speed:1.8,shot:78,emoji:"🌿",techName:"HOJA CELESTIAL",techType:"REGATE",pt:105,maxPt:105,ptCost:35},
  {name:"Apollo",role:"DEL",rating:85,color:"#f3b94f",hair:"#e7b65b",speed:1.9,shot:86,emoji:"☀️",techName:"FLECHA SOLAR",techType:"TIRO",pt:110,maxPt:110,ptCost:42},
  {name:"Ares",role:"DEF",rating:82,color:"#8051a5",hair:"#33243b",speed:1.7,shot:70,emoji:"🛡️",techName:"PISOTÓN DE ARES",techType:"DEFENSA",pt:100,maxPt:100,ptCost:35},
  // Kirkwood
  {name:"Bobby Shearer",role:"DEF",rating:79,color:"#4e789c",hair:"#6b503c",speed:1.7,shot:64,emoji:"🛡️",techName:"BARRERA DEFENSIVA",techType:"DEFENSA",pt:92,maxPt:92,ptCost:30},
  {name:"Jim Wraith",role:"DEL",rating:81,color:"#d7a14b",hair:"#8b633d",speed:1.8,shot:82,emoji:"👻",techName:"TIRO FANTASMA",techType:"TIRO",pt:98,maxPt:98,ptCost:38},
  {name:"Maxwell Carson",role:"MC",rating:80,color:"#6496b7",hair:"#4b3428",speed:1.9,shot:75,emoji:"🌪️",techName:"VÓRTICE",techType:"REGATE",pt:95,maxPt:95,ptCost:32},
  {name:"Darren LaChance",role:"POR",rating:82,color:"#27ae60",hair:"#16a085",speed:1.4,shot:50,emoji:"👐",techName:"MANO MÁGICA",techType:"PARADA",pt:105,maxPt:105,ptCost:35},
  // Brainwashing / Occult / Wild / Farm
  {name:"Brain",role:"MC",rating:81,color:"#5e7d9c",hair:"#c6d0d8",speed:1.8,shot:76,emoji:"🧠",techName:"CONTROL MENTAL",techType:"REGATE",pt:100,maxPt:100,ptCost:35},
  {name:"Miyasaka",role:"DEL",rating:79,color:"#6d9e78",hair:"#6a4c39",speed:2.0,shot:78,emoji:"💨",techName:"ACELERACIÓN",techType:"TIRO",pt:95,maxPt:95,ptCost:35},
  {name:"Manga",role:"DEF",rating:77,color:"#6a5c8d",hair:"#302c3b",speed:1.7,shot:64,emoji:"🛡️",techName:"SOMBRA DEFENSIVA",techType:"DEFENSA",pt:90,maxPt:90,ptCost:30},
  {name:"Scotty Banyan",role:"DEF",rating:78,color:"#4d8c62",hair:"#c68b4b",speed:1.8,shot:66,emoji:"🌳",techName:"BLOQUEO DEL BOSQUE",techType:"DEFENSA",pt:92,maxPt:92,ptCost:30},
  {name:"Thor Stoutberg",role:"MC",rating:80,color:"#9c7448",hair:"#8c542e",speed:1.7,shot:74,emoji:"⚡",techName:"TRUENO",techType:"TIRO",pt:95,maxPt:95,ptCost:35},
  {name:"Byron Love",role:"DEL",rating:88,color:"#f1c40f",hair:"#b7950b",speed:1.9,shot:88,emoji:"👼",techName:"SABIDURÍA DIVINA",techType:"TIRO",pt:125,maxPt:125,ptCost:50},
  // Alius Academy
  {name:"Janus",role:"MC",rating:86,color:"#7f6bc4",hair:"#b7a6d9",speed:1.9,shot:82,emoji:"🌌",techName:"GRAVEDAD",techType:"REGATE",pt:115,maxPt:115,ptCost:40},
  {name:"Bellatrix",role:"DEL",rating:87,color:"#a46bd1",hair:"#d5b9ee",speed:2.0,shot:89,emoji:"💜",techName:"TIRO GALÁCTICO",techType:"TIRO",pt:118,maxPt:118,ptCost:45},
  {name:"Icer",role:"DEF",rating:83,color:"#75cbe8",hair:"#d7f4ff",speed:1.8,shot:72,emoji:"❄️",techName:"PRISIÓN DE HIELO",techType:"DEFENSA",pt:105,maxPt:105,ptCost:38},
  {name:"Droll",role:"MC",rating:82,color:"#77a6d8",hair:"#d8e8f4",speed:1.9,shot:78,emoji:"🧊",techName:"ESPEJISMO HELADO",techType:"REGATE",pt:100,maxPt:100,ptCost:35},
  {name:"Wheeze",role:"DEL",rating:84,color:"#8e72c6",hair:"#c8b6e2",speed:1.9,shot:84,emoji:"🌠",techName:"COMETA OSCURO",techType:"TIRO",pt:108,maxPt:108,ptCost:40},
  {name:"Xavier Foster",role:"DEL",rating:90,color:"#e74c3c",hair:"#c0392b",speed:2.1,shot:94,emoji:"☄️",techName:"CAÑÓN METEORITO",techType:"TIRO",pt:130,maxPt:130,ptCost:50},
  // Otros equipos de la serie
  {name:"Scotty Banyan",role:"DEF",rating:78,color:"#4d8c62",hair:"#c68b4b",speed:1.8,shot:66,emoji:"🌳",techName:"BLOQUEO DEL BOSQUE",techType:"DEFENSA",pt:92,maxPt:92,ptCost:30},
  {name:"Fideo Ardena",role:"MC",rating:84,color:"#6a9fc7",hair:"#9a7959",speed:1.9,shot:80,emoji:"🎯",techName:"PASE MILIMÉTRICO",techType:"REGATE",pt:108,maxPt:108,ptCost:38},
  {name:"Harley Hathaway",role:"DEL",rating:82,color:"#e18b43",hair:"#b36a37",speed:2.0,shot:83,emoji:"🌊",techName:"OLA GIGANTE",techType:"TIRO",pt:102,maxPt:102,ptCost:38},
  {name:"Dvalin",role:"DEL",rating:86,color:"#a68bd7",hair:"#ded4f0",speed:2.0,shot:88,emoji:"🪐",techName:"CAÑÓN ESPACIAL",techType:"TIRO",pt:115,maxPt:115,ptCost:45},
  {name:"Zell",role:"MC",rating:83,color:"#e5a6c9",hair:"#e8d0dc",speed:1.9,shot:79,emoji:"🌸",techName:"DANZA ROSA",techType:"REGATE",pt:105,maxPt:105,ptCost:36},
  {name:"Nero",role:"POR",rating:85,color:"#8d7ca8",hair:"#44364d",speed:1.4,shot:48,emoji:"🧤",techName:"MANO DEL VACÍO",techType:"PARADA",pt:112,maxPt:112,ptCost:38},
  {name:"Dvalin",role:"DEL",rating:86,color:"#a68bd7",hair:"#ded4f0",speed:2.0,shot:88,emoji:"🪐",techName:"CAÑÓN ESPACIAL",techType:"TIRO",pt:115,maxPt:115,ptCost:45},
  {name:"Shadow Cimmerian",role:"DEF",rating:84,color:"#3e465f",hair:"#202538",speed:1.9,shot:74,emoji:"🌑",techName:"SOMBRA FANTASMA",techType:"DEFENSA",pt:108,maxPt:108,ptCost:38},
  {name:"Darren LaChance",role:"POR",rating:82,color:"#27ae60",hair:"#16a085",speed:1.4,shot:50,emoji:"👐",techName:"MANO MÁGICA",techType:"PARADA",pt:105,maxPt:105,ptCost:35}
];

let squad = JSON.parse(JSON.stringify(DATABASE.slice(0, 8)));

const ENEMY_DATABASE = [
  {name:"Poseidon",role:"POR",rating:78,color:"#a82e50",hair:"#271b2b",speed:1.4,shot:40,emoji:"🧤",techName:"MURALLA GIGANTE",techType:"PARADA",pt:100,maxPt:100,ptCost:35},
  {name:"Ares",role:"DEF",rating:79,color:"#8051a5",hair:"#33243b",speed:1.6,shot:58,emoji:"🛡️",techName:"PISOTÓN DE ARES",techType:"DEFENSA",pt:85,maxPt:85,ptCost:30},
  {name:"Hephaestus",role:"MC",rating:77,color:"#a18b36",hair:"#e74c3c",speed:1.7,shot:67,emoji:"🔥",techName:"REGATE CORTEZA",techType:"REGATE",pt:90,maxPt:90,ptCost:30},
  {name:"Dionysus",role:"DEL",rating:82,color:"#267f9e",hair:"#262c39",speed:1.8,shot:82,emoji:"🌊",techName:"REMATE CELESTE",techType:"TIRO",pt:105,maxPt:105,ptCost:40},
  {name:"Byron Love",role:"DEL",rating:88,color:"#bd6136",hair:"#f39c12",speed:1.9,shot:88,emoji:"👼",techName:"SABIDURÍA DIVINA",techType:"TIRO",pt:125,maxPt:125,ptCost:50},
  {name:"King",role:"POR",rating:84,color:"#7e57c2",hair:"#d8c7a5",speed:1.4,shot:48,emoji:"🧤",techName:"MANO MÁGICA",techType:"PARADA",pt:110,maxPt:110,ptCost:35},
  {name:"Edgar Partinus",role:"DEL",rating:86,color:"#d9e2f2",hair:"#e6e6e6",speed:1.9,shot:88,emoji:"⚔️",techName:"LANZA DEL REY",techType:"TIRO",pt:115,maxPt:115,ptCost:45},
  {name:"David Samford",role:"MC",rating:83,color:"#16a085",hair:"#117864",speed:1.8,shot:84,emoji:"🐧",techName:"PINGÜINO DIGITAL",techType:"TIRO",pt:100,maxPt:100,ptCost:40},
  {name:"Gazel",role:"DEL",rating:88,color:"#aed6f1",hair:"#5d6d7e",speed:2.1,shot:90,emoji:"🧊",techName:"BALÓN DE HIELO",techType:"TIRO",pt:120,maxPt:120,ptCost:45},
  {name:"Torch",role:"DEL",rating:88,color:"#f1948a",hair:"#78281f",speed:2.1,shot:90,emoji:"🔥",techName:"LLAMARADA ATÓMICA",techType:"TIRO",pt:120,maxPt:120,ptCost:45}
];

const HOME_TACTICS = [
  {role:"POR",x:.06,y:.50},
  {role:"DEF",x:.22,y:.30},
  {role:"MC",x:.38,y:.50},
  {role:"DEL",x:.44,y:.25},
  {role:"DEL",x:.44,y:.75}
];

const AWAY_TACTICS = [
  {role:"POR",x:.94,y:.50},
  {role:"DEF",x:.78,y:.30},
  {role:"MC",x:.62,y:.50},
  {role:"DEL",x:.56,y:.25},
  {role:"DEL",x:.56,y:.75}
];

/* =====================================================
   TAMAÑO DEL CAMPO
===================================================== */

function resize() {
  canvas.style.display = "block";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.maxWidth = "100%";
  canvas.style.maxHeight = "100%";
  canvas.style.aspectRatio = "auto";
  canvas.style.objectFit = "fill";
  canvas.style.touchAction = "none";

  const rect = canvas.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));

  W = canvas.width;
  H = canvas.height;
  scale = W / 900;
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  if (players.length) {
    players.forEach(p => {
      p.homeX = p.tacticalX * W;
      p.homeY = p.tacticalY * H;
      p.x = clamp(p.x, 24 * scale, W - 24 * scale);
      p.y = clamp(p.y, 28 * scale, H - 28 * scale);
    });
  }
  if (!ball.owner) {
    ball.x = clamp(ball.x, 20 * scale, W - 20 * scale);
    ball.y = clamp(ball.y, 20 * scale, H - 20 * scale);
  }
}

/* =====================================================
   CREACIÓN DE JUGADORES
===================================================== */

function createPlayer(data, side, tactic) {
  return {
    ...data,
    side,
    tacticalX: tactic.x,
    tacticalY: tactic.y,
    homeX: tactic.x * W,
    homeY: tactic.y * H,
    x: tactic.x * W,
    y: tactic.y * H,
    vx: 0,
    vy: 0,
    anim: Math.random() * 6,
    stunUntil: 0,
    techCooldown: 0,
    pt: data.maxPt || 100,
    radius: 13
  };
}

function makePlayers() {
  players = [];

  for (let i = 0; i < 5; i++) {
    const data = squad[i] || DATABASE[i];
    players.push(createPlayer(data, 0, HOME_TACTICS[i]));
  }

  const enemyPool = [...ENEMY_DATABASE, ...DATABASE.filter(p => p.role !== "POR")];
  const enemyKeeper = ENEMY_DATABASE.find(p => p.role === "POR") || ENEMY_DATABASE[0];
  const enemyOutfield = enemyPool.filter(p => p.role !== "POR");
  const shuffled = enemyOutfield.sort(() => Math.random() - .5);
  const enemyLineup = [enemyKeeper, ...shuffled.slice(0, 4)];
  for (let i = 0; i < 5; i++) {
    players.push(createPlayer(enemyLineup[i], 1, AWAY_TACTICS[i]));
  }

  controlled =
    players.find(p => p.side === 0 && p.role === "DEL") ||
    players[0];

  updateButtonLabel();
  prepareKickoff(0);
}

/* =====================================================
   CAMBIO DE PANTALLAS
===================================================== */

function showTab(tab, button) {
  const sections = {
    mainMenu: "mainMenuScreen",
    match: "matchScreen",
    team: "teamScreen",
    gacha: "gachaScreen"
  };

  Object.entries(sections).forEach(([key, id]) => {
    const el = document.getElementById(id);

    if (el) {
      el.style.display = key === tab
        ? (key === "match" ? "flex" : "block")
        : "none";
    }
  });

  document.querySelectorAll("nav button").forEach(b => {
    b.classList.remove("active");
  });

  if (button) button.classList.add("active");

  running = tab === "match";

  if (tab === "team" && typeof renderTeam === "function") {
    renderTeam();
  }

  if (tab === "match") {
    requestAnimationFrame(() => {
      resize();

      if (!players.length) {
        makePlayers();
      }
    });
  }
}

/* =====================================================
   MENSAJES Y HUD
===================================================== */

function message(text, duration = 1200) {
  const el = document.getElementById("message");
  if (!el) return;

  el.textContent = text;
  el.style.display = "block";

  clearTimeout(message._timer);

  message._timer = setTimeout(() => {
    el.style.display = "none";
  }, duration);
}

function updateButtonLabel() {
  if (!controlled) return;

  const name = document.getElementById("hudName");
  const ptText = document.getElementById("hudPtText");
  const fill = document.getElementById("hudPtFill");

  if (name) name.textContent = controlled.name;

  if (ptText) {
    ptText.textContent =
      `${Math.floor(controlled.pt)}/${controlled.maxPt}`;
  }

  if (fill) {
    fill.style.width =
      `${100 * controlled.pt / controlled.maxPt}%`;
  }
}

/* =====================================================
   SAQUE DE CENTRO
===================================================== */

function prepareKickoff(side) {
  techniqueSequence = null;
  gameState = GAME_STATE.KICKOFF_WAITING;

  ball.owner = null;
  ball.vx = 0;
  ball.vy = 0;
  ball.x = W / 2;
  ball.y = H / 2;
  ball.isSpecialShot = false;
  ball.isShot = false;

  kickoffSide = side;

  players.forEach(p => {
    p.x = p.homeX;
    p.y = p.homeY;
    p.vx = 0;
    p.vy = 0;
    p.stunUntil = 0;
  });

  const overlay = document.getElementById("kickoffOverlay");

  if (overlay) overlay.style.display = "flex";

  const title = document.getElementById("kickoffTitle");
  const desc = document.getElementById("kickoffDesc");

  if (title) {
    title.textContent =
      side === 0 ? "⚡ TURNO DE RAIMON" : "⚡ SACA EL RIVAL";
  }

  if (desc) {
    desc.textContent =
      side === 0
        ? "Pulsa para sacar de centro."
        : "El rival va a sacar de centro.";
  }
}

function triggerKickoff() {
  if (gameState !== GAME_STATE.KICKOFF_WAITING) return;

  const overlay = document.getElementById("kickoffOverlay");
  if (overlay) overlay.style.display = "none";

  gameState = GAME_STATE.PLAYING;

  const team = players.filter(
    p => p.side === kickoffSide && p.role !== "POR"
  );

  const kicker = team[team.length - 1];

  if (kickoffSide === 0) {
    controlled = kicker;
    ball.owner = kicker;
    updateButtonLabel();
  } else {
    ball.owner = kicker;
    message("El rival tiene el balón", 1000);
  }
}

/* =====================================================
   FÍSICAS DE MOVIMIENTO
===================================================== */

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function movePlayer(p, inputX, inputY, dt, sprint = false) {
  if (p.stunUntil > Date.now()) {
    p.vx *= .88;
    p.vy *= .88;
  } else {
    const ratingFactor = .82 + (p.rating / 100) * .28;

    const maxSpeed =
      (p.speed || 1.6) *
      ratingFactor *
      (sprint ? 1.35 : 1) *
      scale;

    const accel = .012 * dt * scale;

    const length = Math.hypot(inputX, inputY);

    if (length > 1) {
      inputX /= length;
      inputY /= length;
    }

    p.vx += inputX * accel;
    p.vy += inputY * accel;

    const currentSpeed = Math.hypot(p.vx, p.vy);

    if (currentSpeed > maxSpeed) {
      p.vx = p.vx / currentSpeed * maxSpeed;
      p.vy = p.vy / currentSpeed * maxSpeed;
    }

    if (length < .08) {
      const friction = Math.pow(.84, dt / 16.67);
      p.vx *= friction;
      p.vy *= friction;
    }
  }

  p.x += p.vx * dt * .06;
  p.y += p.vy * dt * .06;

  p.x = clamp(p.x, 24 * scale, W - 24 * scale);
  p.y = clamp(p.y, 28 * scale, H - 28 * scale);

  p.anim += dt * .012;
}

function moveToward(p, x, y, speed, dt) {
  const dx = x - p.x;
  const dy = y - p.y;
  const distance = Math.hypot(dx, dy);

  if (distance < 4 * scale) {
    movePlayer(p, 0, 0, dt);
    return;
  }

  const factor = Math.min(1, distance / (35 * scale));

  movePlayer(
    p,
    dx / distance * factor,
    dy / distance * factor,
    dt
  );

  const max = speed * scale;
  const velocity = Math.hypot(p.vx, p.vy);

  if (velocity > max) {
    p.vx = p.vx / velocity * max;
    p.vy = p.vy / velocity * max;
  }
}

function resolvePlayerCollisions() {
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const a = players[i];
      const b = players[j];

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distance = Math.hypot(dx, dy) || .01;

      const minDistance = 24 * scale;

      if (distance < minDistance) {
        const overlap = (minDistance - distance) * .5;
        const nx = dx / distance;
        const ny = dy / distance;

        if (a !== ball.owner) {
          a.x -= nx * overlap;
          a.y -= ny * overlap;
        }

        if (b !== ball.owner) {
          b.x += nx * overlap;
          b.y += ny * overlap;
        }
      }
    }
  }
}

/* =====================================================
   INTELIGENCIA ARTIFICIAL
===================================================== */

function updateAI(dt) {
  players.forEach(p => {
    if (p === controlled || p === ball.owner) return;
    if (p.side === 0) {
      let tx=p.homeX, ty=p.homeY;
      if(ball.owner && ball.owner.side===0) {
        tx+=clamp((ball.x-W/2)*.25,-45*scale,45*scale);
        ty+=(ball.y-H/2)*.18;
      } else if(!ball.owner) {
        tx+=(ball.x-W/2)*.12; ty+=(ball.y-H/2)*.12;
      }
      moveToward(p,tx,ty,p.speed*.7,dt); return;
    }
    if(p.role==="POR") {
      moveToward(p,W-58*scale,clamp(ball.y,H*.35,H*.65),1.55,dt); return;
    }
    let tx=p.homeX, ty=p.homeY;
    if(ball.owner && ball.owner.side===0) {
      const holder=ball.owner;
      const pressureRange = p.role === "DEF" ? 360 * scale : 300 * scale;
      if(Math.hypot(holder.x-p.x,holder.y-p.y)<pressureRange || p.role==="DEF") {
        tx = holder.x + (p.side === 1 ? -13 : 13) * scale;
        ty = holder.y + (p.y < holder.y ? -5 : 5) * scale;
      }
    } else if(!ball.owner) {
      tx=ball.x+(p.homeX-W/2)*.25; ty=ball.y+(p.homeY-H/2)*.25;
    } else {
      tx=p.homeX-35*scale; ty=p.homeY+(H/2-ball.y)*.08;
    }
    moveToward(p,tx,ty,p.speed*.78,dt);
  });

  // Los rivales atacan, avanzan con el balón y rematan hacia la portería izquierda.
  updateCPUAttack(dt);

  if(controlled && controlled!==ball.owner) {
    const nearest=players.filter(p=>p.side===0 && p!==controlled && p.role!=="POR")
      .sort((a,b)=>Math.hypot(a.x-ball.x,a.y-ball.y)-Math.hypot(b.x-ball.x,b.y-ball.y))[0];
    if(nearest && !ball.owner) moveToward(nearest,ball.x,ball.y,nearest.speed*.65,dt);
  }
}

/* =====================================================
   BALÓN
===================================================== */

function attachBallToOwner() {
  if (!ball.owner) return;

  const p = ball.owner;
  const direction = p.side === 0 ? 1 : -1;

  ball.x = p.x + direction * 13 * scale;
  ball.y = p.y + 5 * scale;
  ball.vx = p.vx;
  ball.vy = p.vy;
}

function releaseBall(vx, vy, special = false, isShot = false) {
  const shooter = ball.owner;
  const isGazel = !!shooter && (
    (shooter.name || "").toLowerCase() === "gazel" ||
    (shooter.techName || "").toUpperCase() === "BALÓN DE HIELO"
  );
  ball.owner = null;
  ball.vx = vx;
  ball.vy = vy;
  ball.isSpecialShot = special;
  ball.isShot = isShot;
  ball.iceBall = !!(isShot && isGazel);
  ball.pickupImmunityUntil = Date.now() + (isShot ? 520 : 180);
}

/* =====================================================
   PASE
===================================================== */

function passBall() {
  if (gameState !== GAME_STATE.PLAYING) return;

  if (!ball.owner || ball.owner.side !== 0) {
    message("¡Necesitas tener el balón para pasar!", 900);
    return;
  }

  const passer = ball.owner;

  const teammates = players.filter(p =>
    p.side === 0 &&
    p !== passer &&
    p.role !== "POR"
  );

  if (!teammates.length) return;

  let best = null;
  let bestScore = -Infinity;

  teammates.forEach(tm => {
    const dx = tm.x - passer.x;
    const dy = tm.y - passer.y;

    const distance = Math.hypot(dx, dy) || 1;

    const direction =
      (dx / distance) * lastActiveDir.x +
      (dy / distance) * lastActiveDir.y;

    const forwardBonus = dx * .002;
    const score = direction * 2 + forwardBonus - distance * .001;

    if (score > bestScore) {
      bestScore = score;
      best = tm;
    }
  });

  if (!best) return;

  const dx = best.x - passer.x;
  const dy = best.y - passer.y;
  const distance = Math.hypot(dx, dy) || 1;

  const power = 9.5 * scale;

  releaseBall(
    dx / distance * power,
    dy / distance * power
  );

  message(`Pase hacia ${best.name}`, 800);
}

/* =====================================================
   DISPARO
===================================================== */

function shoot() {
  if (gameState !== GAME_STATE.PLAYING || techniqueSequence) return;

  if (!ball.owner || ball.owner.side !== 0) {
    message("¡No tienes el balón!", 900);
    return;
  }

  const p = ball.owner;

  const targetX = W - 18 * scale;
  const targetY = H / 2;

  const dx = targetX - p.x;
  const dy = targetY - p.y;

  const distance = Math.hypot(dx, dy) || 1;

  const distanceToGoal = W - p.x;
  const penalty = distanceToGoal > W * .72 ? .72 : 1;

  const power = (24 + (p.shot || p.rating || 70) * .105) * penalty * scale;

  releaseBall(
    dx / distance * power,
    dy / distance * power,
    false,
    true
  );

  message(`¡Disparo de ${p.name}!`, 1000);
}

/* =====================================================
   ROBO DE BALÓN
===================================================== */

function stealBall() {
  if (gameState !== GAME_STATE.PLAYING) return;

  if (Date.now() < stealCooldownUntil) {
    message("¡Espera para volver a robar!", 700);
    return;
  }

  stealCooldownUntil = Date.now() + 650;

  const rival =
    ball.owner && ball.owner.side === 1
      ? ball.owner
      : null;

  if (!rival) {
    message("El rival no tiene el balón", 800);
    return;
  }

  const candidates = players.filter(p =>
    p.side === 0 && p.role !== "POR"
  );

  const tackler = candidates.sort((a, b) =>
    Math.hypot(a.x - rival.x, a.y - rival.y) -
    Math.hypot(b.x - rival.x, b.y - rival.y)
  )[0];

  if (!tackler) return;

  const distance = Math.hypot(
    tackler.x - rival.x,
    tackler.y - rival.y
  );

  const reach = 82 * scale;

  if (distance > reach) {
    message("¡Acércate al rival para robarle!", 900);
    return;
  }

  const skillDifference =
    (tackler.rating - rival.rating) * .012;

  const distanceBonus =
    (1 - distance / reach) * .25;

  const chance = clamp(
    .48 + skillDifference + distanceBonus,
    .18,
    .88
  );

  if (Math.random() < chance) {
    ball.owner = tackler;
    controlled = tackler;
    ball.vx = 0;
    ball.vy = 0;

    message(`¡${tackler.name} roba el balón!`, 1200);
    updateButtonLabel();
  } else {
    tackler.vx -= (tackler.x - rival.x) * .035;
    tackler.vy -= (tackler.y - rival.y) * .035;

    message("¡El rival protege el balón!", 900);
  }
}

/* =====================================================
   CAMBIAR DE JUGADOR
===================================================== */

function switchPlayer() {
  const options = players.filter(p =>
    p.side === 0 && p.role !== "POR"
  );

  if (!options.length) return;

  const idx = options.indexOf(controlled);

  controlled = options[
    (idx + 1) % options.length
  ];

  updateButtonLabel();
  message(`Jugador activo: ${controlled.name}`, 800);
}

/* =====================================================
   CORRER
===================================================== */

function sprint() {
  sprinting = !sprinting;

  const btn = document.getElementById("sprintBtn");

  if (btn) btn.classList.toggle("active", sprinting);

  message(
    sprinting ? "⚡ ¡Sprint activado!" : "Sprint desactivado",
    700
  );
}

/* =====================================================
   TÉCNICAS ESPECIALES
===================================================== */

function specialMove() {
  const p = controlled;
  if (!p || gameState !== GAME_STATE.PLAYING || techniqueSequence) return;
  const cost = p.ptCost || 35;
  if (p.pt < cost) return message("¡No tienes suficientes PT!", 1000);
  if (p.techCooldown > Date.now()) return message("¡La técnica todavía está recargando!", 1000);

  if (p.techType === "TIRO") {
    if (ball.owner !== p) return message("¡Necesitas el balón para preparar el tiro especial!", 1000);
    p.pt -= cost;
    p.techCooldown = Date.now() + 7500;
    startTechniqueSequence(p, "SHOT", false);
  } else if (p.techType === "DEFENSA") {
    const rival = ball.owner && ball.owner.side !== p.side ? ball.owner : null;
    if (!rival || Math.hypot(rival.x-p.x,rival.y-p.y) > 165*scale) {
      return message("¡Acércate al rival para usar la técnica defensiva!", 1000);
    }
    p.pt -= cost;
    p.techCooldown = Date.now()+7000;
    startTechniqueSequence(p,"TACKLE",false,rival);
  } else if (p.techType === "REGATE") {
    if (ball.owner !== p) return message("¡Necesitas el balón para regatear!",900);
    p.pt -= cost;
    p.techCooldown = Date.now()+7000;
    startTechniqueSequence(p,"DRIBBLE",false);
  } else if (p.techType === "PARADA") {
    if (ball.owner !== p && (ball.owner || Math.hypot(ball.x-p.x,ball.y-p.y)>210*scale)) {
      return message("¡Espera a que el balón se acerque para usar la parada!",1000);
    }
    p.pt -= cost;
    p.techCooldown = Date.now()+7500;
    startTechniqueSequence(p,"KEEPER",false);
  }
  updateButtonLabel();
}

/* =====================================================
   DUELOS
===================================================== */


/* =====================================================
   CINEMÁTICAS DE TÉCNICAS
===================================================== */
function techniquePalette(player) {
  const n=(player.techName||player.name||"").toUpperCase();
  const palettes={
    "REMATE DRAGÓN": ["#ff552b","#ffd447","#8e160e","dragon"],
    "MANO CELESTIAL": ["#ffd84d","#fff8bd","#a66b16","celestialhand"],
    "MURALLA GIGANTE": ["#9ca9b8","#f2f5f7","#35465b","giantwall"],
    "TORNADO DE FUEGO": ["#ff552b","#ffe16b","#a91416","firetornado"],
    "VENTISCA ETERNA": ["#55dfff","#f3ffff","#2876c8","blizzard"],
    "CAÑÓN METEORITO": ["#ff7b32","#fff0a0","#7e251e","meteor"],
    "PINGÜINO DIGITAL": ["#27bde5","#d7ffff","#174f9c","penguins"],
    "SABIDURÍA DIVINA": ["#ffe46c","#ffffff","#a66bdf","divinewings"],
    "EL MURO": ["#9aabbc","#f0f5ff","#3e4e65","brickwall"],
    "ESPEJISMO DE BALÓN": ["#a68bff","#ffffff","#4c38b0","mirage"],
    "REGATE EN ESPIRAL": ["#4cebd2","#ffffff","#2477d5","spiral"],
    "TIRO DEL MEGAAULÓN": ["#27bde5","#d7ffff","#174f9c","seaBeast"],
    "MANO MÁGICA": ["#62e6b1","#eafff5","#137b68","magicglove"],
    "ESCUDO DE FUERZA": ["#7b8cff","#e9edff","#303e9c","forceshield"],
    "DESLIZAMIENTO CORTANTE": ["#e9f3ff","#ffffff","#3675d8","slash"],
    "ASTRAL": ["#a78bfa","#fff4b8","#38216f","astral"],
    "BALÓN DE HIELO": ["#55dfff","#ffffff","#2876c8","iceball"],
    "LLAMARADA ATÓMICA": ["#ff4326","#fff078","#a91416","atomicfire"],
    "PISOTÓN DE ARES": ["#e85b43","#ffd0a1","#68221c","aresstomp"],
    "REGATE CORTEZA": ["#62b66b","#d7ff9c","#285d35","bark"],
    "REMATE CELESTE": ["#3fc9ef","#ffffff","#5c72ce","celestialshot"]
  };
  const v=palettes[n] || [player.color||"#8b72ff","#ffffff","#263b8f","energy"];
  return {main:v[0],light:v[1],dark:v[2],kind:v[3]};
}

function startTechniqueSequence(player, action, isCPU=false, target=null, incoming=null) {
  if (techniqueSequence) return false;
  const palette=techniquePalette(player);
  const duration=action==="SHOT"?2450:action==="KEEPER"?2050:1850;
  techniqueSequence={
    player, action, isCPU, target, incoming,
    palette, elapsed:0, duration,
    launched:false, phase:"charge",
    startX:player.x,startY:player.y,
    savedOwner:ball.owner,
    savedVx:ball.vx,savedVy:ball.vy
  };
  player.techPose=1;
  if (action==="KEEPER") {
    // El portero se adueña temporalmente del balón mientras prepara la parada.
    ball.owner=player;
    ball.vx=0; ball.vy=0;
  }
  message(`✦ ${player.name}: ${player.techName} ✦`,duration);
  cameraShake=4;
  return true;
}

function keeperPassToTeammate(keeper) {
  if (!keeper || ball.owner !== keeper || gameState !== GAME_STATE.PLAYING) return;

  const direction = keeper.side === 0 ? 1 : -1;
  const teammates = players.filter(p =>
    p.side === keeper.side && p !== keeper && p.role !== "POR"
  );
  if (!teammates.length) {
    releaseBall(direction * 7.5 * scale, (Math.random() - .5) * 2 * scale);
    return;
  }

  // Prioriza un compañero situado hacia el centro/campo contrario, sin
  // elegir un pase demasiado largo si hay otro receptor mejor colocado.
  teammates.sort((a, b) => {
    const score = p => {
      const distance = Math.hypot(p.x - keeper.x, p.y - keeper.y);
      const forward = (p.x - keeper.x) * direction;
      return distance + Math.max(0, 65 * scale - forward) * 1.35 - Math.max(0, forward) * .12;
    };
    return score(a) - score(b);
  });

  const receiver = teammates[0];
  const dx = receiver.x - keeper.x;
  const dy = receiver.y - keeper.y;
  const distance = Math.hypot(dx, dy) || 1;
  const speed = 8.8 * scale;
  releaseBall(dx / distance * speed, dy / distance * speed, false);
  ball.pickupImmunityUntil = Date.now() + 100;
  if (keeper.side === 0) {
    controlled = keeper;
    message(`${keeper.name} pasa a ${receiver.name}`, 1000);
  } else {
    message(`${keeper.name} saca para ${receiver.name}`, 850);
  }
}

function finishTechniqueSequence(seq) {
  const p=seq.player;
  const side=p.side;
  const dir=side===0?1:-1;
  const goalX=side===0?W-14*scale:14*scale;
  const goalY=clamp(H/2+(seq.startY-H/2)*.18,H*.43,H*.57);
  if (seq.action==="SHOT") {
    // El balón permanece pegado al jugador durante toda la carga y solo sale al final.
    const dx=goalX-p.x, dy=goalY-p.y, d=Math.hypot(dx,dy)||1;
    const power=(31+(p.shot||p.rating||70)*.12)*scale;
    ball.x=p.x+dir*16*scale; ball.y=p.y+2*scale;
    releaseBall(dx/d*power,dy/d*power,true,true);
    ball.isSpecialShot=true;
    ball.techColor=seq.palette.main;
    ball.techName=p.techName;
    createTechniqueBurst(p.x,p.y,seq.palette,34);
    message(`¡¡${p.techName}!!`,1500);
    cameraShake=13;
  } else if (seq.action==="KEEPER") {
    // La técnica aumenta las opciones de parada, pero no garantiza detener el tiro.
    const incoming=seq.incoming || {vx:seq.savedVx||0,vy:seq.savedVy||0};
    const shotSpeed=Math.hypot(incoming.vx||0,incoming.vy||0);
    const keeperSkill=((p.rating||65)*0.55+(p.defense||p.handling||65)*0.45);
    const specialBonus=ball.isSpecialShot ? 0.20 : 0;
    const distancePenalty=Math.min(0.22,shotSpeed/78);
    // Las técnicas de portero ayudan, pero ya no convierten la parada en algo habitual.
    const saveChance=clamp(0.25+(keeperSkill-70)*0.006-distancePenalty-specialBonus,0.08,0.62);
    const saved=Math.random()<saveChance;
    ball.owner=null;
    ball.isSpecialShot=false;
    ball.isShot=true;
    if(saved) {
      ball.owner=p; ball.vx=0; ball.vy=0;
      ball.x=p.x+(side===0?12:-12)*scale; ball.y=p.y;
      setTimeout(() => {
        if (ball.owner===p && gameState===GAME_STATE.PLAYING) keeperPassToTeammate(p);
      },220);
      createTechniqueBurst(p.x,p.y,seq.palette,30);
      message(`¡¡${p.techName}!! ¡PARADA!`,1500);
      cameraShake=10;
    } else {
      // El portero llega a tocarla, pero la fuerza del disparo puede superarlo.
      const speed=Math.max(shotSpeed*0.88,8*scale);
      const towardGoal=side===0?-1:1;
      ball.x=p.x+towardGoal*18*scale;
      ball.y=p.y+(incoming.vy||0)*0.10;
      ball.vx=(incoming.vx||towardGoal*speed)*0.88;
      ball.vy=(incoming.vy||0)*0.88+(Math.random()-.5)*1.8*scale;
      p.stunUntil=Date.now()+420;
      createTechniqueBurst(p.x,p.y,seq.palette,14);
      message(`¡${p.techName} no ha sido suficiente!`,1450);
      cameraShake=6;
    }
  } else if (seq.action==="TACKLE") {
    const rival=seq.target;
    if (rival && ball.owner===rival) {
      const chance=clamp(.58+(p.rating-rival.rating)*.012,.25,.9);
      if (Math.random()<chance) { ball.owner=p; if(p.side===0) controlled=p; }
      else rival.stunUntil=Date.now()+500;
    }
    p.vx=dir*2.2*scale;
    createTechniqueBurst(p.x,p.y,seq.palette,24);
  } else if (seq.action==="DRIBBLE") {
    const dx=seq.isCPU?-1:1;
    p.x=clamp(p.x+dx*75*scale,25*scale,W-25*scale);
    p.y=clamp(p.y+lastActiveDir.y*28*scale,25*scale,H-25*scale);
    players.filter(q=>q.side!==p.side).forEach(q=>{
      if(Math.hypot(q.x-p.x,q.y-p.y)<75*scale) q.stunUntil=Date.now()+1050;
    });
    createTechniqueBurst(p.x,p.y,seq.palette,28);
  }
  p.techPose=0;
}

function createTechniqueBurst(x,y,palette,count=24) {
  for(let i=0;i<count;i++) {
    const a=Math.PI*2*i/count+Math.random()*.18;
    const speed=(2+Math.random()*5)*scale;
    effects.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:650+Math.random()*650,max:1300,color:i%3===0?palette.light:palette.main,text:"",particle:true,size:(2+Math.random()*4)*scale});
  }
}

function updateTechniqueSequence(dt) {
  const seq=techniqueSequence;
  if(!seq) return false;
  seq.elapsed+=dt;
  const p=seq.player;
  const t=seq.elapsed/seq.duration;
  seq.phase=t<.28?"charge":t<.72?"power":"release";
  // Congela el partido y mantiene el balón junto al futbolista durante la cinemática.
  p.vx*=.75; p.vy*=.75;
  if(seq.action==="SHOT") {
    ball.owner=p;
    ball.x=p.x+(p.side===0?1:-1)*16*scale;
    ball.y=p.y+Math.sin(seq.elapsed*.018)*3*scale;
    ball.vx=0; ball.vy=0;
  } else if(seq.action==="KEEPER") {
    ball.owner=p; ball.x=p.x+(p.side===0?1:-1)*35*scale; ball.y=p.y+5*scale;
  }
  if(seq.elapsed>=seq.duration) {
    techniqueSequence=null;
    finishTechniqueSequence(seq);
  }
  return true;
}

function updateCPUAttack(dt) {
  const holder = ball.owner;
  if (!holder || holder.side !== 1 || holder.role === "POR" || techniqueSequence) return;

  const goalX = 18 * scale;
  const goalY = H / 2;
  const dx = goalX - holder.x;
  const dy = goalY - holder.y;
  const distance = Math.hypot(dx, dy);
  const nearGoal = holder.x < W * .31;
  const centralLane = Math.abs(holder.y - goalY) < H * .31;

  // La CPU prioriza avanzar y buscar compañeros. No decide chutar cada vez
  // que cruza medio campo: necesita acercarse al área y esperar su oportunidad.
  moveToward(holder, goalX + 115 * scale, goalY + (holder.y < goalY ? 30 : -30) * scale, holder.speed * .86, dt);

  const now = Date.now();
  if (now < aiDecisionCooldown) return;
  aiDecisionCooldown = now + 1150 + Math.random() * 900;

  const pressure = players.filter(p => p.side === 0 && p.role !== "POR")
    .some(p => Math.hypot(p.x - holder.x, p.y - holder.y) < 78 * scale);

  const teammates = players.filter(p => p.side === 1 && p !== holder && p.role !== "POR");
  const canShoot = nearGoal && centralLane && distance < W * .34 && now > aiShotCooldown;
  const shotChance = clamp(.18 + ((holder.shot || holder.rating || 70) - 70) * .009, .16, .43);

  if (canShoot && Math.random() < shotChance) {
    aiShotCooldown = now + 6500 + Math.random() * 3500;
    const canUseTechnique = holder.techType === "TIRO" && holder.pt >= (holder.ptCost || 35)
      && now > aiTechniqueCooldown && Math.random() < .42;
    if (canUseTechnique) {
      holder.pt -= holder.ptCost || 35;
      holder.techCooldown = now + 8500;
      aiTechniqueCooldown = now + 8500 + Math.random() * 3500;
      startTechniqueSequence(holder, "SHOT", true);
    } else {
      const shotSkill = holder.shot || holder.rating || 70;
      const targetY = clamp(goalY + (Math.random() - .5) * (H * (.12 + (90 - shotSkill) * .003)), H * .39, H * .61);
      const aimX = goalX - holder.x;
      const aimY = targetY - holder.y;
      const aimD = Math.hypot(aimX, aimY) || 1;
      const power = (17 + shotSkill * .065) * scale;
      releaseBall(aimX / aimD * power, aimY / aimD * power, false, true);
      message(`¡${holder.name} busca portería!`, 900);
    }
    return;
  }

  // Pase ocasional si hay presión o un compañero está mejor colocado.
  if (teammates.length && now > aiPassCooldown && (pressure || Math.random() < .22)) {
    const forwardOptions = teammates.filter(p => p.x < holder.x - 22 * scale);
    const pool = forwardOptions.length ? forwardOptions : teammates;
    const receiver = pool.sort((a, b) => (holder.x - a.x) - (holder.x - b.x))[0];
    if (receiver) {
      aiPassCooldown = now + 3200 + Math.random() * 1800;
      const px = receiver.x - holder.x;
      const py = receiver.y - holder.y;
      const pd = Math.hypot(px, py) || 1;
      releaseBall(px / pd * 9.2 * scale, py / pd * 9.2 * scale, false, false);
      message(`${holder.name} busca a ${receiver.name}`, 750);
    }
  }
}

function tryKeeperTechnique() {
  if(techniqueSequence || Date.now()<keeperSaveCooldown || ball.owner) return;
  if(Math.hypot(ball.vx,ball.vy)<2.2*scale) return;
  const keeper=players.find(p=>p.role==="POR" && ((p.side===0 && ball.vx<0)||(p.side===1 && ball.vx>0)));
  if(!keeper || keeper.pt<(keeper.ptCost||30)) return;
  const towardGoal=keeper.side===0 ? ball.x<keeper.x : ball.x>keeper.x;
  const close=Math.hypot(ball.x-keeper.x,ball.y-keeper.y)<115*scale;
  if(!towardGoal || !close) return;
  keeper.pt-=keeper.ptCost||30;
  keeper.techCooldown=Date.now()+8500;
  keeperSaveCooldown=Date.now()+4500;
  const incoming={vx:ball.vx,vy:ball.vy};
  // Inicia una animación real de parada; el balón no atraviesa al guardameta.
  startTechniqueSequence(keeper,"KEEPER",true,null,incoming);
}

function startDuel(holder, tackler) {
  if (inDuel || Date.now() < duelCooldownUntil) return;

  inDuel = true;
  duelData = { holder, tackler };

  const modal = document.getElementById("duelModal");
  if (modal) modal.style.display = "flex";

  document.getElementById("duelTitle").textContent =
    `${holder.name} contra ${tackler.name}`;
}

function resolveDuel(choice) {
  if (!duelData) return;

  const { holder, tackler } = duelData;

  const chance = clamp(
    .5 + (holder.rating - tackler.rating) * .015,
    .2,
    .85
  );

  document.getElementById("duelModal").style.display = "none";

  inDuel = false;
  duelCooldownUntil = Date.now() + 1800;

  if (
    choice === "special" &&
    holder.pt >= (holder.ptCost || 35)
  ) {
    holder.pt -= holder.ptCost || 35;

    holder.x +=
      (holder.side === 0 ? 1 : -1) * 40 * scale;

    message(
      `⚡ ¡${holder.name} supera el duelo con su técnica!`,
      1200
    );

  } else if (Math.random() < chance) {
    holder.x +=
      (holder.side === 0 ? 1 : -1) * 35 * scale;

    message(`¡${holder.name} consigue regatear!`, 1000);

  } else {
    ball.owner = tackler;

    if (tackler.side === 0) {
      controlled = tackler;
    }

    message(`¡${tackler.name} roba el balón!`, 1100);
  }

  duelData = null;
  updateButtonLabel();
}

/* =====================================================
   ACTUALIZAR BALÓN Y PORTEROS
===================================================== */

function tryKeeperSaveOnPath(fromX, fromY, toX, toY) {
  if (!ball.isShot || ball.owner || techniqueSequence) return false;
  const dx = toX - fromX, dy = toY - fromY;
  const lengthSq = dx*dx + dy*dy || 1;
  const keepers = players.filter(k => k.role === "POR" &&
    ((k.side === 0 && ball.vx < 0) || (k.side === 1 && ball.vx > 0)));
  for (const keeper of keepers) {
    const t = clamp(((keeper.x-fromX)*dx + (keeper.y-fromY)*dy) / lengthSq, 0, 1);
    const closestX = fromX + dx*t;
    const closestY = fromY + dy*t;
    const distance = Math.hypot(keeper.x-closestX, keeper.y-closestY);
    if (distance > 23*scale) continue;

    // Los porteros ya no paran casi todos los tiros: influyen su nivel,
    // la velocidad del disparo y si el balón lleva una técnica especial.
    const rating = keeper.rating || 70;
    const shotSpeed = Math.hypot(ball.vx, ball.vy);
    let chance = .34 + (rating-75)*.005 - Math.max(0,shotSpeed/scale-20)*.008;
    if (ball.isSpecialShot) chance -= .22;
    chance = clamp(chance, .12, .62);
    if (Math.random() > chance) continue;

    ball.owner = keeper;
    ball.x = keeper.x + (keeper.side===0 ? -10 : 10)*scale;
    ball.y = keeper.y;
    ball.vx = 0; ball.vy = 0;
    ball.isShot = false;
    ball.isSpecialShot = false;
    ball.iceBall = false;
    ball.pickupImmunityUntil = Date.now()+260;
    message(`¡${keeper.name} detiene el disparo!`,1100);
    setTimeout(() => {
      if (ball.owner === keeper && gameState === GAME_STATE.PLAYING && !techniqueSequence) {
        keeperPassToTeammate(keeper);
      }
    }, keeper.side===1 ? 420 : 300);
    return true;
  }
  return false;
}

function updateBall(dt) {
  if (ball.owner) {
    attachBallToOwner();

    const holder = ball.owner;

    const opponents = players.filter(
      p => p.side !== holder.side
    );

    // Los rivales presionan y pueden quitarle el balón al usuario cuando
    // llegan a distancia de entrada; no dependen de una coincidencia pixel-perfect.
    const nearby = opponents
      .filter(p => Math.hypot(p.x - holder.x, p.y - holder.y) < 38 * scale)
      .sort((a, b) => Math.hypot(a.x - holder.x, a.y - holder.y) - Math.hypot(b.x - holder.x, b.y - holder.y))[0];

    if (nearby && Date.now() > duelCooldownUntil && Date.now() > aiStealCooldownUntil) {
      aiStealCooldownUntil = Date.now() + 720;
      const distance = Math.hypot(nearby.x - holder.x, nearby.y - holder.y);
      const proximity = 1 - distance / (38 * scale);
      const skill = (nearby.rating - holder.rating) * .012;
      const chancePerFrame = clamp(.12 + proximity * .22 + skill, .07, .42);

      if (Math.random() < chancePerFrame * dt / 16.67) {
        ball.owner = nearby;
        ball.vx = 0;
        ball.vy = 0;
        nearby.vx += (holder.x - nearby.x) * .018;
        nearby.vy += (holder.y - nearby.y) * .018;
        if (nearby.side === 0) controlled = nearby;
        message(`¡${nearby.name} te roba el balón!`, 1000);
        updateButtonLabel();
      }
    }

    return;
  }

  const previousX = ball.x;
  const previousY = ball.y;
  ball.x += ball.vx * dt * .06;
  ball.y += ball.vy * dt * .06;

  const friction = Math.pow(ball.isShot ? .9978 : .985, dt / 16.67);

  ball.vx *= friction;
  ball.vy *= friction;

  if (
    ball.y < 20 * scale ||
    ball.y > H - 20 * scale
  ) {
    ball.y = clamp(ball.y, 20 * scale, H - 20 * scale);
    ball.vy *= -.72;
  }

  if (
    ball.x < 20 * scale &&
    (ball.y < H * .39 || ball.y > H * .61)
  ) {
    ball.x = 20 * scale;
    ball.vx *= -.72;
  }

  if (
    ball.x > W - 20 * scale &&
    (ball.y < H * .39 || ball.y > H * .61)
  ) {
    ball.x = W - 20 * scale;
    ball.vx *= -.72;
  }

  // Colisión continua: evita que los disparos rápidos atraviesen al portero
  // entre dos fotogramas sin que el juego compruebe la parada.
  if (tryKeeperSaveOnPath(previousX, previousY, ball.x, ball.y)) return;

  // El portero inicia su técnica antes de que la captura automática quite el balón.
  tryKeeperTechnique();
  if (techniqueSequence) return;

  if (Date.now() > ball.pickupImmunityUntil) {
    const keepers = players.filter(p => p.role === "POR");

    for (const keeper of keepers) {
      const close =
        Math.hypot(keeper.x - ball.x, keeper.y - ball.y) <
        35 * scale;

      if (
        close &&
        (
          (keeper.side === 0 && ball.vx < 0) ||
          (keeper.side === 1 && ball.vx > 0)
        )
      ) {
        ball.owner = keeper;
        ball.iceBall = false;
        ball.isSpecialShot = false;
        ball.isShot = false;
        ball.vx = 0;
        ball.vy = 0;

        message(`¡Parada de ${keeper.name}!`, 900);
        // El portero rival no se queda inmóvil con el balón: reinicia
        // el juego con un pase corto a un compañero.
        setTimeout(() => {
          if (ball.owner === keeper && gameState === GAME_STATE.PLAYING && !techniqueSequence) {
            keeperPassToTeammate(keeper);
          }
        }, keeper.side === 1 ? 420 : 300);
        break;
      }
    }
  }

  if (!ball.owner && Date.now() > ball.pickupImmunityUntil) {
    for (const p of players) {
      if (
        Math.hypot(p.x - ball.x, p.y - ball.y) <
        19 * scale
      ) {
        ball.owner = p;
        ball.iceBall = (p.name || "").toLowerCase() === "gazel" ||
          (p.techName || "").toUpperCase() === "BALÓN DE HIELO";

        if (p.side === 0) {
          controlled = p;
          updateButtonLabel();
        }

        break;
      }
    }
  }
}

/* =====================================================
   GOLES Y FINAL DEL PARTIDO
===================================================== */

function checkGoal() {
  // La boca de la portería ocupa una zona amplia; se comprueba el cruce
  // de la línea de gol para que los disparos rápidos no se salten el evento.
  const insideGoalMouth = ball.y >= H * .35 && ball.y <= H * .65;

  if (!insideGoalMouth) return;

  if (ball.x <= 18 * scale && ball.vx < 0) {
    scoreAway++;
    updateScore();
    ball.isShot = false;
    ball.isSpecialShot = false;
    ball.iceBall = false;
    goalPause("¡¡GOOOOOOL DEL RIVAL!!", 0);

  } else if (ball.x >= W - 18 * scale && ball.vx > 0) {
    scoreHome++;
    updateScore();
    ball.isShot = false;
    ball.isSpecialShot = false;
    ball.iceBall = false;
    goalPause("¡¡GOOOOOOL DE RAIMON!!", 1);
  }
}

function goalPause(text, nextKickoffSide) {
  gameState = GAME_STATE.GOAL_PAUSE;

  message(text, 1700);

  setTimeout(() => {
    if (gameState !== GAME_STATE.GOAL_PAUSE) return;

    prepareKickoff(nextKickoffSide);
  }, 1700);
}

function updateScore() {
  document.getElementById("score").textContent =
    `${scoreHome} - ${scoreAway}`;
}

function endMatch() {
  gameState = GAME_STATE.GAME_OVER;
  running = false;

  const reward =
    scoreHome > scoreAway ? 150 :
    scoreHome === scoreAway ? 75 : 40;

  coins += reward;

  if (typeof updateCoins === "function") {
    updateCoins();
  }

  message(
    `FIN DEL PARTIDO: ${scoreHome} - ${scoreAway}. +${reward} monedas`,
    5000
  );

  setTimeout(() => {
    prepareKickoff(0);

    gameState = GAME_STATE.MATCH_NOT_STARTED;

    showTab(
      "mainMenu",
      document.getElementById("navHome")
    );
  }, 3500);
}

/* =====================================================
   ACTUALIZACIÓN GENERAL
===================================================== */

function update(dt) {
  if (!running || gameState !== GAME_STATE.PLAYING || inDuel) return;
  if (techniqueSequence) {
    updateTechniqueSequence(dt);
    return;
  }

  timeLeft -= dt / 1000;

  if (timeLeft <= 0) {
    timeLeft = 0;
    document.getElementById("timer").textContent = "0";
    endMatch();
    return;
  }

  document.getElementById("timer").textContent =
    Math.ceil(timeLeft);

  players.forEach(p => {
    if (p.pt < p.maxPt) {
      p.pt = Math.min(
        p.maxPt,
        p.pt + dt * .002
      );
    }
  });

  if (controlled) {
    movePlayer(
      controlled,
      joystick.x,
      joystick.y,
      dt,
      sprinting
    );

    if (
      Math.abs(joystick.x) > .1 ||
      Math.abs(joystick.y) > .1
    ) {
      const length = Math.hypot(
        joystick.x,
        joystick.y
      );

      lastActiveDir = {
        x: joystick.x / length,
        y: joystick.y / length
      };
    }
  }

  updateAI(dt);
  resolvePlayerCollisions();
  updateBall(dt);
  checkGoal();

  updateButtonLabel();
}

/* =====================================================
   DIBUJAR CAMPO
===================================================== */

function drawField() {
  ctx.fillStyle = "#247447";
  ctx.fillRect(0, 0, W, H);

  const stripeWidth = W / 10;

  for (let i = 0; i < 10; i++) {
    ctx.fillStyle =
      i % 2 ? "#287d4d" : "#226e43";

    ctx.fillRect(
      i * stripeWidth,
      0,
      stripeWidth,
      H
    );
  }

  ctx.strokeStyle = "#e7f4e8";
  ctx.lineWidth = 2 * scale;

  ctx.strokeRect(
    12 * scale,
    12 * scale,
    W - 24 * scale,
    H - 24 * scale
  );

  ctx.beginPath();
  ctx.moveTo(W / 2, 12 * scale);
  ctx.lineTo(W / 2, H - 12 * scale);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(
    W / 2,
    H / 2,
    65 * scale,
    0,
    Math.PI * 2
  );
  ctx.stroke();

  ctx.fillStyle = "#e7f4e8";

  ctx.beginPath();
  ctx.arc(
    W / 2,
    H / 2,
    3 * scale,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.strokeRect(
    12 * scale,
    H * .28,
    115 * scale,
    H * .44
  );

  ctx.strokeRect(
    W - 127 * scale,
    H * .28,
    115 * scale,
    H * .44
  );

  ctx.strokeRect(
    12 * scale,
    H * .39,
    48 * scale,
    H * .22
  );

  ctx.strokeRect(
    W - 60 * scale,
    H * .39,
    48 * scale,
    H * .22
  );

  ctx.lineWidth = 4 * scale;

  ctx.strokeRect(
    1 * scale,
    H * .41,
    12 * scale,
    H * .18
  );

  ctx.strokeRect(
    W - 13 * scale,
    H * .41,
    12 * scale,
    H * .18
  );
}

/* =====================================================
   DIBUJAR JUGADORES
===================================================== */

function drawPlayer(p) {
  const x = p.x;
  const y = p.y;
  const r = 12 * scale;

  ctx.save();

  // Sombra.
  ctx.fillStyle = "#06150c88";

  ctx.beginPath();

  ctx.ellipse(
    x + 2 * scale,
    y + 11 * scale,
    r * 1.15,
    r * .55,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();

  // Indicador de jugador seleccionado.
  if (p === controlled) {
    ctx.strokeStyle = "#ffe34d";
    ctx.lineWidth = 3 * scale;

    ctx.beginPath();

    ctx.arc(
      x,
      y,
      r + 7 * scale,
      0,
      Math.PI * 2
    );

    ctx.stroke();
  }

  // Cuerpo.
  ctx.fillStyle = p.color;
  ctx.strokeStyle = "#172033";
  ctx.lineWidth = 2 * scale;

  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Piezas estilo Hama Beads.
  const bead = 3.1 * scale;

  for (let row = -2; row <= 2; row++) {
    for (let col = -2; col <= 2; col++) {
      if (col * col + row * row > 5) continue;

      ctx.fillStyle =
        (row + col) % 2 === 0
          ? "#ffffff55"
          : "#00000022";

      ctx.beginPath();

      ctx.arc(
        x + col * 4 * scale,
        y + row * 4 * scale,
        bead,
        0,
        Math.PI * 2
      );

      ctx.fill();
    }
  }

  // Pelo y cabeza.
  ctx.fillStyle = p.hair || "#38271f";

  ctx.beginPath();
  ctx.arc(
    x,
    y - 10 * scale,
    6 * scale,
    0,
    Math.PI * 2
  );

  ctx.fill();

  // Número de camiseta.
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${8 * scale}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillText(
    String(players.indexOf(p) + 1),
    x,
    y + 1 * scale
  );

  // Nombre.
  ctx.font = `bold ${9 * scale}px Arial`;
  ctx.lineWidth = 3 * scale;
  ctx.strokeStyle = "#061326";

  ctx.strokeText(
    p.name.split(" ")[0],
    x,
    y - 23 * scale
  );

  ctx.fillStyle = "#ffffff";

  ctx.fillText(
    p.name.split(" ")[0],
    x,
    y - 23 * scale
  );

  ctx.restore();
}

/* =====================================================
   DIBUJAR BALÓN
===================================================== */

function drawFrozenBall(x, y, radius = 7 * scale) {
  const r = radius;
  const t = performance.now() * 0.001;
  ctx.save();
  // Halo frío y sombra azulada.
  ctx.shadowColor = "#65eaff";
  ctx.shadowBlur = 17 * scale;
  const halo = ctx.createRadialGradient(x-r*.25,y-r*.35,r*.15,x,y,r*2.1);
  halo.addColorStop(0,"#ffffff");
  halo.addColorStop(.35,"#bdf7ff");
  halo.addColorStop(.72,"#43bce8");
  halo.addColorStop(1,"#17649f");
  ctx.fillStyle = halo;
  ctx.beginPath(); ctx.arc(x,y,r*1.18,0,Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0;

  // Superficie de hielo translúcido.
  const ice = ctx.createRadialGradient(x-r*.38,y-r*.45,r*.1,x+r*.1,y+r*.15,r);
  ice.addColorStop(0,"#ffffff");
  ice.addColorStop(.28,"#d9fcff");
  ice.addColorStop(.62,"#75dcf5");
  ice.addColorStop(1,"#287eb8");
  ctx.fillStyle=ice; ctx.strokeStyle="#eaffff"; ctx.lineWidth=1.5*scale;
  ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill(); ctx.stroke();

  // Facetas y grietas visibles dentro del balón.
  ctx.save(); ctx.beginPath(); ctx.arc(x,y,r*.91,0,Math.PI*2); ctx.clip();
  ctx.globalAlpha=.8; ctx.strokeStyle="#efffff"; ctx.lineWidth=1.05*scale;
  ctx.beginPath();
  ctx.moveTo(x-r*.72,y-r*.18); ctx.lineTo(x-r*.22,y-r*.48); ctx.lineTo(x+r*.05,y-r*.12);
  ctx.lineTo(x+r*.52,y-r*.42); ctx.moveTo(x-r*.22,y-r*.48); ctx.lineTo(x-r*.12,y+r*.05);
  ctx.lineTo(x-r*.55,y+r*.48); ctx.moveTo(x-r*.12,y+r*.05); ctx.lineTo(x+r*.28,y+r*.5);
  ctx.lineTo(x+r*.68,y+r*.2); ctx.moveTo(x+r*.05,y-r*.12); ctx.lineTo(x+r*.28,y+r*.5);
  ctx.stroke();
  ctx.globalAlpha=.55; ctx.fillStyle="#ffffff";
  for(let i=0;i<5;i++) {
    const a=t*-.7+i*Math.PI*2/5, px=x+Math.cos(a)*r*.67, py=y+Math.sin(a)*r*.67;
    ctx.beginPath(); ctx.arc(px,py,.8*scale,0,Math.PI*2); ctx.fill();
  }
  ctx.restore();

  // Brillo especular y pequeños pinchos de escarcha.
  ctx.fillStyle="#ffffff"; ctx.globalAlpha=.9;
  ctx.beginPath(); ctx.ellipse(x-r*.32,y-r*.42,r*.25,r*.12,-.6,0,Math.PI*2); ctx.fill();
  ctx.globalAlpha=.95; ctx.strokeStyle="#d8fbff"; ctx.lineWidth=1.4*scale;
  for(let i=0;i<4;i++) {
    const a=t*1.4+i*Math.PI/2, px=x+Math.cos(a)*r*1.35, py=y+Math.sin(a)*r*1.35;
    ctx.beginPath(); ctx.moveTo(px-2.2*scale,py); ctx.lineTo(px+2.2*scale,py);
    ctx.moveTo(px,py-2.2*scale); ctx.lineTo(px,py+2.2*scale); ctx.stroke();
  }
  ctx.restore();
}

function drawBall() {
  ctx.save();
  ctx.fillStyle = "#07132655";
  ctx.beginPath();
  ctx.ellipse(ball.x + 2 * scale, ball.y + 5 * scale, 8 * scale, 4 * scale, 0, 0, Math.PI * 2);
  ctx.fill();

  const ownerHasIceBall = ball.owner &&
    ((ball.owner.techName || "").toUpperCase() === "BALÓN DE HIELO" ||
     (ball.owner.name || "").toLowerCase() === "gazel");
  const sequenceHasIceBall = techniqueSequence &&
    (((techniqueSequence.player.techName || "").toUpperCase() === "BALÓN DE HIELO") ||
     ((techniqueSequence.player.name || "").toLowerCase() === "gazel"));

  if (ownerHasIceBall || sequenceHasIceBall || ball.iceBall) {
    drawFrozenBall(ball.x, ball.y, 7 * scale);
  } else {
    ctx.fillStyle = ball.isSpecialShot ? "#ff8b20" : "#ffffff";
    ctx.strokeStyle = "#111827"; ctx.lineWidth = 1.5 * scale;
    ctx.beginPath(); ctx.arc(ball.x, ball.y, 6 * scale, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#1b2638";
    ctx.beginPath(); ctx.arc(ball.x, ball.y, 2 * scale, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

/* =====================================================
   DIBUJO INDIVIDUAL DE CADA TÉCNICA
===================================================== */
function drawTechniqueSpecific(seq, progress) {
  const name=(seq.player.techName||"").toUpperCase();
  const x=seq.player.x, y=seq.player.y;
  const t=seq.elapsed*.001, s=scale;
  const k=(1+Math.sin(t*9))*.5;
  const ballX=ball.x, ballY=ball.y;
  const stroke=(color,width=5)=>{ctx.strokeStyle=color;ctx.lineWidth=width*s;ctx.lineCap="round";ctx.lineJoin="round";};
  const glow=(color,blur=18)=>{ctx.shadowColor=color;ctx.shadowBlur=blur*s;};
  ctx.save();
  ctx.globalAlpha=.95;
  switch(name) {
    case "REMATE DRAGÓN": {
      // Dragón de fuego que rodea al balón y se lanza hacia delante.
      const dir=seq.player.side===0?1:-1;
      ctx.save(); ctx.translate(ballX,ballY); ctx.scale(dir,1); glow("#ff4b16",25);
      for(let j=0;j<3;j++) { const a=t*4+j*2.1; ctx.save();ctx.rotate(a);stroke(j===0?"#fff08a":j===1?"#ff7a24":"#b91f16",7-j);ctx.beginPath();ctx.ellipse(-18*s,0,44*s,15*s,0,-.2,Math.PI*1.7);ctx.stroke();ctx.restore(); }
      ctx.fillStyle="#ffb02e";ctx.beginPath();ctx.moveTo(4*s,-8*s);ctx.lineTo(31*s,-19*s);ctx.lineTo(22*s,-5*s);ctx.lineTo(43*s,0);ctx.lineTo(20*s,8*s);ctx.lineTo(7*s,5*s);ctx.closePath();ctx.fill();
      ctx.fillStyle="#fff3a1";ctx.beginPath();ctx.arc(27*s,-7*s,2.5*s,0,Math.PI*2);ctx.fill();ctx.restore(); break;
    }
    case "MANO CELESTIAL": {
      // Palma abierta siempre mirando hacia el terreno de juego.
      const dir=seq.player.side===0?1:-1; const hx=x+dir*47*s, hy=y-5*s;
      ctx.save();ctx.translate(hx,hy);ctx.scale(dir,1);glow("#ffe36a",30);
      ctx.fillStyle="#fff0a0";ctx.strokeStyle="#fff";ctx.lineWidth=3*s;
      ctx.beginPath();ctx.roundRect(-17*s,-5*s,35*s,34*s,13*s);ctx.fill();ctx.stroke();
      for(let i=0;i<5;i++){const xx=(-15+i*7.5)*s;ctx.beginPath();ctx.roundRect(xx,-31*s+(i===2?-8*s:0),6*s,32*s,4*s);ctx.fill();ctx.stroke();}
      ctx.restore();break;
    }
    case "MURALLA GIGANTE": case "EL MURO": {
      const wide=name==="MURALLA GIGANTE"?150:105, h=name==="MURALLA GIGANTE"?116:82;
      const wx=x+(seq.player.side===0?1:-1)*wide*.35*s;
      glow("#c9d7e8",18);ctx.fillStyle=name==="EL MURO"?"#75879d":"#8e9eaf";ctx.strokeStyle="#f1f6ff";ctx.lineWidth=3*s;
      ctx.fillRect(wx-wide/2*s,y-h/2*s,wide*s,h*s);ctx.strokeRect(wx-wide/2*s,y-h/2*s,wide*s,h*s);
      for(let r=0;r<3;r++)for(let c=0;c<4;c++){ctx.strokeRect(wx-wide/2*s+c*wide/4*s,y-h/2*s+r*h/3*s,wide/4*s,h/3*s);}
      break;
    }
    case "TORNADO DE FUEGO": case "LLAMARADA ATÓMICA": {
      const dir=seq.player.side===0?1:-1;ctx.save();ctx.translate(ballX,ballY);ctx.scale(dir,1);glow("#ff4a18",25);
      for(let i=0;i<7;i++){ctx.save();ctx.rotate(t*5+i*Math.PI*2/7);stroke(i%2?"#ffcf4a":"#ff5722",7);ctx.beginPath();ctx.moveTo(-10*s,0);ctx.quadraticCurveTo(-48*s,-30*s,8*s,-62*s);ctx.stroke();ctx.restore();}
      if(name==="LLAMARADA ATÓMICA"){ctx.strokeStyle="#fff3a1";ctx.lineWidth=5*s;ctx.beginPath();ctx.arc(0,0,(30+progress*65)*s,0,Math.PI*2);ctx.stroke();}ctx.restore();break;
    }
    case "VENTISCA ETERNA": case "BALÓN DE HIELO": {
      glow("#7deaff",22);for(let i=0;i<12;i++){const a=i*Math.PI/6+t*(name==="BALÓN DE HIELO"?-.8:1.8),r=(35+progress*55)*s;const px=ballX+Math.cos(a)*r,py=ballY+Math.sin(a)*r;stroke(i%2?"#fff":"#55dfff",3);ctx.beginPath();ctx.moveTo(px-8*s,py);ctx.lineTo(px+8*s,py);ctx.moveTo(px,py-8*s);ctx.lineTo(px,py+8*s);ctx.moveTo(px-5*s,py-5*s);ctx.lineTo(px+5*s,py+5*s);ctx.stroke();}break;
    }
    case "CAÑÓN METEORITO": {
      const mx=ballX+Math.sin(t*2)*15*s,my=ballY-100*s+progress*75*s;glow("#ff762e",28);ctx.fillStyle="#ff8a36";ctx.beginPath();ctx.arc(mx,my,18*s,0,Math.PI*2);ctx.fill();stroke("#fff1a0",5);ctx.beginPath();ctx.moveTo(mx-7*s,my-15*s);ctx.lineTo(mx-42*s,my-57*s);ctx.stroke();ctx.strokeStyle="#ff4b26";ctx.beginPath();ctx.arc(ballX,ballY,35*s,0,Math.PI*2);ctx.stroke();break;
    }
    case "PINGÜINO DIGITAL": {
      for(let i=0;i<3;i++){const a=t*3+i*Math.PI*2/3,px=ballX+Math.cos(a)*55*s,py=ballY+Math.sin(a)*32*s;ctx.save();ctx.translate(px,py);ctx.fillStyle="#172c50";ctx.beginPath();ctx.ellipse(0,0,11*s,15*s,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#fff";ctx.beginPath();ctx.ellipse(0,3*s,7*s,9*s,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#ffb52f";ctx.beginPath();ctx.moveTo(8*s,0);ctx.lineTo(16*s,3*s);ctx.lineTo(8*s,5*s);ctx.fill();ctx.restore();}break;
    }
    case "SABIDURÍA DIVINA": {
      glow("#fff0a0",20);for(let d of [-1,1]){ctx.save();ctx.translate(x,y-8*s);ctx.scale(d,1);ctx.fillStyle="#fff0a0";ctx.strokeStyle="#fff";ctx.lineWidth=3*s;ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(30*s,-55*s,78*s,-43*s);ctx.quadraticCurveTo(52*s,-18*s,0,8*s);ctx.fill();ctx.stroke();for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(10*s+i*12*s,-4*s-i*4*s);ctx.lineTo(40*s+i*9*s,-30*s-i*3*s);ctx.stroke();}ctx.restore();}break;
    }
    case "ESPEJISMO DE BALÓN": {
      for(let i=0;i<4;i++){const a=t*2+i*Math.PI/2;ctx.globalAlpha=.22+i*.13;stroke(i%2?"#fff":"#a78bfa",3);ctx.beginPath();ctx.arc(x+Math.cos(a)*42*s,y+Math.sin(a)*25*s,15*s,0,Math.PI*2);ctx.stroke();}break;
    }
    case "REGATE EN ESPIRAL": {
      glow("#4cebd2",20);for(let i=0;i<4;i++){stroke(i%2?"#fff":"#4cebd2",4);ctx.beginPath();ctx.ellipse(x,y,25*s+i*9*s,12*s+i*5*s,t*2+i,0,Math.PI*1.8);ctx.stroke();}break;
    }
    case "TIRO DEL MEGAAULÓN": case "REMATE CELESTE": {
      const dir=seq.player.side===0?1:-1;ctx.save();ctx.translate(ballX,ballY);ctx.scale(dir,1);glow("#35d9ff",25);for(let i=0;i<5;i++){ctx.save();ctx.rotate(t*2+i*.6);stroke(i%2?"#d7ffff":"#168dd0",6);ctx.beginPath();ctx.arc(0,0,(22+i*9)*s,-1.3,1.4);ctx.stroke();ctx.restore();}ctx.fillStyle="#8df4ff";ctx.beginPath();ctx.moveTo(0,-8*s);ctx.quadraticCurveTo(28*s,-36*s,50*s,0);ctx.quadraticCurveTo(26*s,34*s,0,8*s);ctx.fill();ctx.restore();break;
    }
    case "MANO MÁGICA": {
      const dir=seq.player.side===0?1:-1;ctx.save();ctx.translate(x+dir*40*s,y);ctx.scale(dir,1);glow("#57efb7",24);ctx.fillStyle="#6de8bc";ctx.strokeStyle="#eafff5";ctx.lineWidth=3*s;ctx.beginPath();ctx.arc(0,0,27*s,0,Math.PI*2);ctx.fill();ctx.stroke();for(let i=0;i<5;i++){ctx.beginPath();ctx.roundRect(-17*s+i*8*s,-36*s,6*s,31*s,4*s);ctx.fill();ctx.stroke();}ctx.restore();break;
    }
    case "ESCUDO DE FUERZA": {
      const dir=seq.player.side===0?1:-1;ctx.save();ctx.translate(x+dir*34*s,y);ctx.scale(dir,1);glow("#8297ff",22);ctx.fillStyle="#667dff55";stroke("#e9edff",4);ctx.beginPath();ctx.moveTo(0,-50*s);ctx.lineTo(42*s,-30*s);ctx.lineTo(34*s,25*s);ctx.lineTo(0,49*s);ctx.lineTo(-34*s,25*s);ctx.lineTo(-42*s,-30*s);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();break;
    }
    case "DESLIZAMIENTO CORTANTE": {
      glow("#b8e2ff",18);for(let i=0;i<4;i++){ctx.save();ctx.translate(x,y);ctx.rotate(t*2+i*Math.PI/4);stroke(i%2?"#fff":"#68aaff",5);ctx.beginPath();ctx.moveTo(-65*s,0);ctx.lineTo(65*s,0);ctx.stroke();ctx.restore();}break;
    }
    case "ASTRAL": {
      glow("#bba4ff",20);for(let i=0;i<9;i++){const a=t*1.5+i*Math.PI*2/9,rr=(35+i%3*13)*s,px=x+Math.cos(a)*rr,py=y+Math.sin(a)*rr;ctx.fillStyle=i%2?"#fff":"#ffe78a";ctx.beginPath();ctx.arc(px,py,(2+i%3)*s,0,Math.PI*2);ctx.fill();}stroke("#bba4ff",3);ctx.beginPath();ctx.ellipse(x,y,58*s,27*s,t,0,Math.PI*2);ctx.stroke();break;
    }
    case "PISOTÓN DE ARES": {
      glow("#ff714f",15);stroke("#ffb28a",4);for(let i=0;i<7;i++){ctx.beginPath();ctx.moveTo(x+(i-3)*8*s,y+10*s);ctx.lineTo(x+(i-3)*24*s,y+40*s+Math.abs(i-3)*5*s);ctx.stroke();}ctx.beginPath();ctx.arc(x,y+8*s,(progress*95+15)*s,0,Math.PI*2);ctx.stroke();break;
    }
    case "REGATE CORTEZA": {
      glow("#8cce69",18);stroke("#b9e58a",6);for(let i=0;i<8;i++){const a=i*Math.PI/4+t;ctx.beginPath();ctx.arc(x,y,25*s+i%2*9*s,a,a+1.1);ctx.stroke();ctx.beginPath();ctx.moveTo(x+Math.cos(a)*25*s,y+Math.sin(a)*25*s);ctx.lineTo(x+Math.cos(a)*52*s,y+Math.sin(a)*52*s);ctx.stroke();}break;
    }
  }
  ctx.restore();
}

/* =====================================================
   EFECTOS VISUALES
===================================================== */

function drawEffects(dt) {
  // Efectos de partículas normales.
  effects.forEach(e=>{
    e.life-=dt;
    if(e.particle) {
      e.x+=e.vx*dt*.045; e.y+=e.vy*dt*.045;
      e.vx*=.975; e.vy*=.975;
      ctx.save(); ctx.globalAlpha=Math.max(0,e.life/e.max);
      ctx.fillStyle=e.color; ctx.beginPath(); ctx.arc(e.x,e.y,e.size||3*scale,0,Math.PI*2); ctx.fill(); ctx.restore();
      return;
    }
    ctx.save(); ctx.globalAlpha=Math.max(0,e.life/e.max);
    ctx.strokeStyle=e.color||"#ffffff"; ctx.lineWidth=4*scale;
    ctx.beginPath(); ctx.arc(e.x,e.y,(1-e.life/e.max)*55*scale,0,Math.PI*2); ctx.stroke();
    if(e.text){ctx.fillStyle="#fff";ctx.font=`bold ${13*scale}px Arial`;ctx.textAlign="center";ctx.fillText(e.text,e.x,e.y-42*scale);}
    ctx.restore();
  });
  effects=effects.filter(e=>e.life>0);

  const seq=techniqueSequence;
  if(!seq) return;
  const p=seq.player, pal=seq.palette;
  const x=p.x, y=p.y;
  const progress=clamp(seq.elapsed/seq.duration,0,1);
  const pulse=1+Math.sin(seq.elapsed*.018)*.12;
  const radius=(24+progress*72)*scale;
  ctx.save();
  // Fondo de impacto y anillos específicos para cada técnica.
  ctx.globalAlpha=.13+Math.sin(seq.elapsed*.012)*.05;
  ctx.fillStyle=pal.main; ctx.fillRect(0,0,W,H);
  ctx.globalAlpha=.9;
  for(let i=0;i<4;i++) {
    const r=(radius+i*13*scale)*pulse;
    ctx.strokeStyle=i%2?pal.light:pal.main;
    ctx.lineWidth=(5-i)*scale;
    ctx.beginPath();
    if(pal.kind==="ice") {
      ctx.moveTo(x-r,y);ctx.lineTo(x+r,y);ctx.moveTo(x,y-r);ctx.lineTo(x,y+r);
      ctx.moveTo(x-r*.7,y-r*.7);ctx.lineTo(x+r*.7,y+r*.7);ctx.moveTo(x-r*.7,y+r*.7);ctx.lineTo(x+r*.7,y-r*.7);
    } else if(pal.kind==="fire") {
      ctx.ellipse(x,y,r,r*.58,seq.elapsed*.002+i,0,Math.PI*2);
    } else {
      ctx.arc(x,y,r,seq.elapsed*.003,seq.elapsed*.003+Math.PI*1.75);
    }
    ctx.stroke();
  }
  // Partículas elementales diferentes según el jugador/técnica.
  for(let i=0;i<18;i++) {
    const a=i*Math.PI/9+seq.elapsed*.003*(i%2?1:-1);
    const rr=(32+Math.sin(seq.elapsed*.01+i)*14+progress*25)*scale;
    const px=x+Math.cos(a)*rr, py=y+Math.sin(a)*rr;
    ctx.fillStyle=i%3===0?pal.light:pal.main;
    ctx.beginPath();
    if(pal.kind==="ice") {ctx.moveTo(px,py-5*scale);ctx.lineTo(px+4*scale,py);ctx.lineTo(px,py+5*scale);ctx.lineTo(px-4*scale,py);ctx.closePath();}
    else {ctx.arc(px,py,(2.5+Math.sin(i+seq.elapsed*.01))*scale,0,Math.PI*2);}
    ctx.fill();
  }
  // Ilustración exclusiva: cada técnica tiene su propia silueta y animación.
  drawTechniqueSpecific(seq, progress);
  // Silueta/pose de preparación y texto cinematográfico.
  ctx.globalAlpha=1;
  ctx.fillStyle="#081326dd";
  const boxW=Math.min(W*.72,430*scale);
  ctx.fillRect(W/2-boxW/2,22*scale,boxW,48*scale);
  ctx.strokeStyle=pal.main;ctx.lineWidth=2*scale;
  ctx.strokeRect(W/2-boxW/2,22*scale,boxW,48*scale);
  ctx.textAlign="center";ctx.textBaseline="middle";
  ctx.fillStyle=pal.light;ctx.font=`900 ${Math.max(13,19*scale)}px Arial`;
  ctx.fillText(seq.action==="KEEPER"?"¡TÉCNICA DE PORTERO!":seq.action==="SHOT"?"¡PREPARANDO EL DISPARO!":"¡TÉCNICA ESPECIAL!",W/2,38*scale);
  ctx.fillStyle="#ffffff";ctx.font=`bold ${Math.max(12,15*scale)}px Arial`;
  ctx.fillText(p.techName,W/2,56*scale);
  // Barra de carga cinematográfica.
  ctx.fillStyle="#101827";ctx.fillRect(W*.2,H-22*scale,W*.6,8*scale);
  ctx.fillStyle=pal.main;ctx.fillRect(W*.2,H-22*scale,W*.6*progress,8*scale);
  ctx.restore();
}

/* =====================================================
   JOYSTICK
===================================================== */

function setStick(event) {
  const rect =
    document.getElementById("stick").getBoundingClientRect();

  const touch = event.touches
    ? event.touches[0]
    : event;

  let dx =
    touch.clientX - (rect.left + rect.width / 2);

  let dy =
    touch.clientY - (rect.top + rect.height / 2);

  const maxR = rect.width * .36;
  const distance = Math.hypot(dx, dy);

  if (distance > maxR) {
    dx = dx / distance * maxR;
    dy = dy / distance * maxR;
  }

  document.getElementById("knob").style.transform =
    `translate(${dx}px,${dy}px)`;

  joystick.x = dx / maxR;
  joystick.y = dy / maxR;
}

function resetStick() {
  joystick.active = false;
  joystick.pointerId = null;
  joystick.x = 0;
  joystick.y = 0;

  const knob = document.getElementById("knob");

  if (knob) {
    knob.style.transform = "translate(0,0)";
  }
}

const stickEl = document.getElementById("stick");

if (stickEl) {
  stickEl.addEventListener("pointerdown", event => {
    if (joystick.active) return;
    event.preventDefault();
    joystick.active = true;
    joystick.pointerId = event.pointerId;
    stickEl.setPointerCapture(event.pointerId);
    setStick(event);
  });

  stickEl.addEventListener("pointermove", event => {
    if (joystick.active && event.pointerId === joystick.pointerId) {
      event.preventDefault();
      setStick(event);
    }
  });

  stickEl.addEventListener("pointerup", event => {
    if (event.pointerId === joystick.pointerId) resetStick();
  });
  stickEl.addEventListener("pointercancel", event => {
    if (event.pointerId === joystick.pointerId) resetStick();
  });
}

/* =====================================================
   TECLADO
===================================================== */

window.addEventListener("keydown", event => {
  const key = event.key.toLowerCase();

  if (
    event.key === "ArrowLeft" || key === "a"
  ) joystick.x = -1;

  if (
    event.key === "ArrowRight" || key === "d"
  ) joystick.x = 1;

  if (
    event.key === "ArrowUp" || key === "w"
  ) joystick.y = -1;

  if (
    event.key === "ArrowDown" || key === "s"
  ) joystick.y = 1;

  if (key === "c") switchPlayer();
  if (key === "e") passBall();
  if (key === "r") stealBall();

  if (event.key === " ") {
    event.preventDefault();
    shoot();
  }

  if (key === "q") specialMove();
});

window.addEventListener("keyup", event => {
  const key = event.key.toLowerCase();

  if (
    ["arrowleft", "a", "arrowright", "d"].includes(key)
  ) joystick.x = 0;

  if (
    ["arrowup", "w", "arrowdown", "s"].includes(key)
  ) joystick.y = 0;
});

/* =====================================================
   BUCLE DE JUEGO
===================================================== */

function loop(timestamp) {
  const dt = Math.min(
    timestamp - (lastTime || timestamp),
    40
  );

  lastTime = timestamp;

  update(dt);

  // No dibujar sobre un canvas sin tamaño.
  if (W > 0 && H > 0) {
    ctx.clearRect(0, 0, W, H);

    drawField();
    drawBall();

    players.forEach(drawPlayer);
    drawEffects(dt);
  }

  requestAnimationFrame(loop);
}

/* =====================================================
   INICIALIZACIÓN
===================================================== */

window.addEventListener("load", () => {
  // Primero se muestra y dimensiona el campo.
  resize();

  // Después se crean los jugadores.
  makePlayers();

  // Se actualiza la interfaz.
  if (typeof updateCoins === "function") {
    updateCoins();
  }

  // Se inicia el bucle gráfico.
  requestAnimationFrame(loop);
});

window.addEventListener("resize", () => {
  resize();
});
