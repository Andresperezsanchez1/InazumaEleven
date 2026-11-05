
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
let keeperSaveCooldown = 0;
let cameraShake = 0;

let joystick = { x: 0, y: 0, active: false };
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
  isSpecialShot: false
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
  {name:"Torch",role:"DEL",rating:88,color:"#f1948a",hair:"#78281f",speed:2.1,shot:90,emoji:"🔥",techName:"LLAMARADA ATÓMICA",techType:"TIRO",pt:120,maxPt:120,ptCost:45}
];

let squad = JSON.parse(JSON.stringify(DATABASE.slice(0, 8)));

const ENEMY_DATABASE = [
  {name:"Poseidon",role:"POR",rating:78,color:"#a82e50",hair:"#271b2b",speed:1.4,shot:40,emoji:"🧤",techName:"MURALLA GIGANTE",techType:"PARADA",pt:100,maxPt:100,ptCost:35},
  {name:"Ares",role:"DEF",rating:79,color:"#8051a5",hair:"#33243b",speed:1.6,shot:58,emoji:"🛡️",techName:"PISOTÓN DE ARES",techType:"DEFENSA",pt:85,maxPt:85,ptCost:30},
  {name:"Hephaestus",role:"MC",rating:77,color:"#a18b36",hair:"#e74c3c",speed:1.7,shot:67,emoji:"🔥",techName:"REGATE CORTEZA",techType:"REGATE",pt:90,maxPt:90,ptCost:30},
  {name:"Dionysus",role:"DEL",rating:82,color:"#267f9e",hair:"#262c39",speed:1.8,shot:82,emoji:"🌊",techName:"REMATE CELESTE",techType:"TIRO",pt:105,maxPt:105,ptCost:40},
  {name:"Byron Love",role:"DEL",rating:88,color:"#bd6136",hair:"#f39c12",speed:1.9,shot:88,emoji:"👼",techName:"SABIDURÍA DIVINA",techType:"TIRO",pt:125,maxPt:125,ptCost:50}
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
  const rect = canvas.getBoundingClientRect();

  if (rect.width <= 0 || rect.height <= 0) {
    return;
  }

  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);

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

  for (let i = 0; i < 5; i++) {
    players.push(createPlayer(ENEMY_DATABASE[i], 1, AWAY_TACTICS[i]));
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
      if(Math.hypot(holder.x-p.x,holder.y-p.y)<280*scale || p.role==="DEF") { tx=holder.x+18*scale; ty=holder.y; }
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

function releaseBall(vx, vy, special = false) {
  ball.owner = null;
  ball.vx = vx;
  ball.vy = vy;
  ball.isSpecialShot = special;
  ball.pickupImmunityUntil = Date.now() + 180;
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

  const power = 13 * scale * penalty;

  releaseBall(
    dx / distance * power,
    dy / distance * power
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

function finishTechniqueSequence(seq) {
  const p=seq.player;
  const side=p.side;
  const dir=side===0?1:-1;
  const goalX=side===0?W-14*scale:14*scale;
  const goalY=clamp(H/2+(seq.startY-H/2)*.18,H*.43,H*.57);
  if (seq.action==="SHOT") {
    // El balón permanece pegado al jugador durante toda la carga y solo sale al final.
    const dx=goalX-p.x, dy=goalY-p.y, d=Math.hypot(dx,dy)||1;
    const power=(15.5+(p.shot||70)*.035)*scale;
    ball.x=p.x+dir*16*scale; ball.y=p.y+2*scale;
    releaseBall(dx/d*power,dy/d*power,true);
    ball.isSpecialShot=true;
    ball.techColor=seq.palette.main;
    ball.techName=p.techName;
    createTechniqueBurst(p.x,p.y,seq.palette,34);
    message(`¡¡${p.techName}!!`,1500);
    cameraShake=13;
  } else if (seq.action==="KEEPER") {
    // Parada culmina atrapando y despejando el balón hacia el centro.
    ball.owner=p; ball.vx=0; ball.vy=0; ball.isSpecialShot=false;
    const clearX=side===0?1:-1;
    setTimeout(()=>{
      if (ball.owner===p && gameState===GAME_STATE.PLAYING) {
        releaseBall(clearX*8.5*scale,(Math.random()-.5)*3*scale,false);
        if (side===0) controlled=p;
      }
    },180);
    createTechniqueBurst(p.x,p.y,seq.palette,30);
    message(`¡¡${p.techName}!! ¡PARADA!`,1500);
    cameraShake=10;
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
  const holder=ball.owner;
  if(!holder || holder.side!==1 || holder.role==="POR" || techniqueSequence) return;
  const goalX=18*scale;
  const goalY=H/2;
  const dx=goalX-holder.x, dy=goalY-holder.y;
  const distance=Math.hypot(dx,dy);
  moveToward(holder,goalX+105*scale,goalY,holder.speed*.92,dt);
  if(Date.now()>aiShotCooldown && (distance<W*.63 || holder.x<W*.42)) {
    aiShotCooldown=Date.now()+2600;
    if(holder.techType==="TIRO" && holder.pt>=(holder.ptCost||35) && Date.now()>aiTechniqueCooldown) {
      holder.pt-=holder.ptCost||35;
      holder.techCooldown=Date.now()+8500;
      aiTechniqueCooldown=Date.now()+5000;
      startTechniqueSequence(holder,"SHOT",true);
    } else {
      const d=Math.hypot(dx,dy)||1;
      releaseBall(dx/d*12.5*scale,dy/d*12.5*scale,false);
      message(`¡${holder.name} dispara!`,900);
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

function updateBall(dt) {
  if (ball.owner) {
    attachBallToOwner();

    const holder = ball.owner;

    const opponents = players.filter(
      p => p.side !== holder.side
    );

    const nearby = opponents.find(p =>
      Math.hypot(p.x - holder.x, p.y - holder.y) <
      18 * scale
    );

    if (nearby && Date.now() > duelCooldownUntil) {
      const chance = clamp(
        .18 + (nearby.rating - holder.rating) * .01,
        .08,
        .48
      );

      if (Math.random() < chance * dt / 16.67) {
        ball.owner = nearby;

        if (nearby.side === 0) {
          controlled = nearby;
        }

        message(`¡${nearby.name} intercepta el balón!`, 900);
        updateButtonLabel();
      }
    }

    return;
  }

  ball.x += ball.vx * dt * .06;
  ball.y += ball.vy * dt * .06;

  const friction = Math.pow(.985, dt / 16.67);

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
        ball.isSpecialShot = false;
        ball.vx = 0;
        ball.vy = 0;

        message(`¡Parada de ${keeper.name}!`, 900);
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
  if (ball.y < H * .39 || ball.y > H * .61) return;

  if (ball.x <= 10 * scale) {
    scoreAway++;
    updateScore();
    goalPause("¡GOL DEL RIVAL!", 0);

  } else if (ball.x >= W - 10 * scale) {
    scoreHome++;
    updateScore();
    goalPause("¡GOOOOOOL DE RAIMON!", 1);
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

function drawBall() {
  ctx.save();

  ctx.fillStyle = "#07132655";

  ctx.beginPath();

  ctx.ellipse(
    ball.x + 2 * scale,
    ball.y + 5 * scale,
    8 * scale,
    4 * scale,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.fillStyle =
    ball.isSpecialShot ? "#ff8b20" : "#ffffff";

  ctx.strokeStyle = "#111827";
  ctx.lineWidth = 1.5 * scale;

  ctx.beginPath();
  ctx.arc(
    ball.x,
    ball.y,
    6 * scale,
    0,
    Math.PI * 2
  );

  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#1b2638";

  ctx.beginPath();
  ctx.arc(
    ball.x,
    ball.y,
    2 * scale,
    0,
    Math.PI * 2
  );

  ctx.fill();

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
    joystick.active = true;
    stickEl.setPointerCapture(event.pointerId);
    setStick(event);
  });

  stickEl.addEventListener("pointermove", event => {
    if (joystick.active) {
      setStick(event);
    }
  });

  stickEl.addEventListener("pointerup", resetStick);
  stickEl.addEventListener("pointercancel", resetStick);
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
