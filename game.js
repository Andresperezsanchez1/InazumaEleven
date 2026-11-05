
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



let squad = JSON.parse(JSON.stringify(DATABASE.slice(0, 8)));

const ENEMY_DATABASE = DATABASE;

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

  const enemyPool = ENEMY_DATABASE.filter(p => p.role !== "POR");
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
  const primaryTechnique = (p.techniques || []).find(t => t.name === p.techName) || (p.techName ? {name:p.techName,type:p.techType} : null);
  const cost = p.ptCost || 35;
  if (p.pt < cost) return message("¡No tienes suficientes PT!", 1000);
  if (p.techCooldown > Date.now()) return message("¡La técnica todavía está recargando!", 1000);

  if ((primaryTechnique?.type || p.techType) === "TIRO") {
    if (ball.owner !== p) return message("¡Necesitas el balón para preparar el tiro especial!", 1000);
    p.pt -= cost;
    p.techCooldown = Date.now() + 7500;
    startTechniqueSequence(p, "SHOT", false);
  } else if (["DEFENSA","BLOQUEO"].includes(primaryTechnique?.type || p.techType)) {
    const rival = ball.owner && ball.owner.side !== p.side ? ball.owner : null;
    if (!rival || Math.hypot(rival.x-p.x,rival.y-p.y) > 165*scale) {
      return message("¡Acércate al rival para usar la técnica defensiva!", 1000);
    }
    p.pt -= cost;
    p.techCooldown = Date.now()+7000;
    startTechniqueSequence(p,"TACKLE",false,rival);
  } else if ((primaryTechnique?.type || p.techType) === "REGATE") {
    if (ball.owner !== p) return message("¡Necesitas el balón para regatear!",900);
    p.pt -= cost;
    p.techCooldown = Date.now()+7000;
    startTechniqueSequence(p,"DRIBBLE",false);
  } else if (["PARADA","ATAJO"].includes(primaryTechnique?.type || p.techType)) {
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
function techniquePalette(player, techniqueName = null) {
  const n=(techniqueName || player.techName || player.name || "").toUpperCase();
  const palettes={
    "REMATE DRAGÓN": ["#ff552b","#ffd447","#8e160e","dragon"],
    "LANZA DE ODÍN": ["#a56cff","#f3dcff","#402078","odinspear"],
    "AGUJERO DE GUSANO": ["#35d66f","#caffd8","#087b3d","wormhole"],
    "DESTROZATALADROS": ["#e8a43b","#fff0b2","#74400d","drillsmasher"],
    "GOLPE DE VACÍO": ["#52bfff","#e6f8ff","#145caa","vacuum"],
    "RAYO DE GANÍMEDES": ["#6c8dff","#e3e8ff","#2634a5","ganymede"],
    "RE MATE DE GAIA": ["#78c86a","#e9ffd7","#275b30","gaia"],
    "MANO CELESTIAL": ["#ffd84d","#fff8bd","#a66b16","celestialhand"],
    "MURALLA GIGANTE": ["#9ca9b8","#f2f5f7","#35465b","giantwall"],
    "TORNADO DE FUEGO": ["#ff552b","#ffe16b","#a91416","firetornado"],
    "VENTISCA ETERNA": ["#a7edff","#ffffff","#2465b5","eternalblizzard"],
    "CAÑÓN METEORITO": ["#ff7b32","#fff0a0","#7e251e","meteor"],
    "PINGÜINO DIGITAL": ["#27bde5","#d7ffff","#174f9c","penguins"],
    "SABIDURÍA DIVINA": ["#ffe46c","#ffffff","#a66bdf","divinewings"],
    "EL MURO": ["#9aabbc","#f0f5ff","#3e4e65","brickwall"],
    "ESPEJISMO DE BALÓN": ["#a68bff","#ffffff","#4c38b0","mirage"],
    "REGATE EN ESPIRAL": ["#4cebd2","#ffffff","#2477d5","spiral"],
    "TIRO DEL MEGAAULÓN": ["#27bde5","#d7ffff","#174f9c","seaBeast"],
    "MANO MÁGICA": ["#247bff","#c8e5ff","#071b63","bluedemonhand"],
    "ESCUDO DE FUERZA": ["#7b8cff","#e9edff","#303e9c","forceshield"],
    "DESLIZAMIENTO CORTANTE": ["#e9f3ff","#ffffff","#3675d8","slash"],
    "ASTRAL": ["#a78bfa","#fff4b8","#38216f","astral"],
    "BALÓN DE HIELO": ["#39cfff","#e9fcff","#075b9d","iceball"],
    "LLAMARADA ATÓMICA": ["#ff4326","#fff078","#a91416","atomicfire"],
    "PISOTÓN DE ARES": ["#e85b43","#ffd0a1","#68221c","aresstomp"],
    "REGATE CORTEZA": ["#62b66b","#d7ff9c","#285d35","bark"],
    "REMATE CELESTE": ["#3fc9ef","#ffffff","#5c72ce","celestialshot"],
    "ACELERACIÓN": ["#70e6ff","#ffffff","#176bba","acceleration"],
    "APOYO TOTAL": ["#ff8fc5","#fff0f8","#923e78","support"],
    "BARRERA DEFENSIVA": ["#8db6d8","#f1f8ff","#355b80","defbarrier"],
    "BLOQUEO DEL BOSQUE": ["#6dbb55","#e4ffc8","#285b32","forestblock"],
    "BLOQUEO DOBLE": ["#a5c9e8","#ffffff","#476b98","doubleblock"],
    "BLOQUEO REAL": ["#e9c65b","#fff4bd","#80601b","royalblock"],
    "COMETA OSCURO": ["#7052bd","#e6d8ff","#21144d","darkcomet"],
    "CONTROL MENTAL": ["#b18cff","#f5edff","#4c2b91","mindcontrol"],
    "ESPEJISMO HELADO": ["#9eeaff","#ffffff","#3674b2","iceillusion"],
    "FLECHA SOLAR": ["#ffbd36","#fff5a8","#a84b12","solararrow"],
    "GRAVEDAD": ["#9a83ff","#e8e0ff","#35216f","gravity"],
    "LANZA DEL REY": ["#f2c45d","#fff5c9","#7d4a18","kingspear"],
    "MANO DEL VACÍO": ["#5e65b9","#e0e1ff","#161a52","voidhand"],
    "MANO FANTASMA": ["#a5b8d7","#f3f7ff","#4c5879","ghosthand"],
    "MURO DE ACERO": ["#91a7bb","#f3f8ff","#34485e","steelwall"],
    "ODIN SWORD": ["#b58aff","#f5eaff","#50318c","odinsword"],
    "OLA GIGANTE": ["#35c9e8","#d8fbff","#075b83","giantwave"],
    "PASE PRECISO": ["#7ce6d1","#eafffb","#247e78","precisepass"],
    "PASE RELÁMPAGO": ["#ffe36c","#ffffff","#8d6b16","lightningpass"],
    "PRISIÓN DE HIELO": ["#8de5ff","#f4ffff","#27669e","iceprison"],
    "REGATE FANTASMA": ["#a9b7d5","#f4f6ff","#46516e","ghostdribble"],
    "REGATE GIRATORIO": ["#75d7ff","#eaffff","#2462a0","spinmove"],
    "SOMBRA DEFENSIVA": ["#777caa","#e2e5ff","#282b55","shadowdefense"],
    "SOMBRA FANTASMA": ["#7375a8","#e9eaff","#252747","phantomshadow"],
    "TIRO DEL ÁGUILA": ["#b5a0e8","#ffffff","#554080","eagleshot"],
    "TIRO FANTASMA": ["#a9c6df","#ffffff","#4a6688","ghostshot"],
    "TIRO GALÁCTICO": ["#9b75e8","#f4eaff","#36206f","galaxyshot"],
    "TIRO GIRATORIO": ["#69d9d2","#eaffff","#176b75","spinshot"],
    "TRUENO": ["#ffe35b","#ffffff","#8d6415","thunder"],
    "VÓRTICE": ["#65d8d0","#e9ffff","#195f7a","vortex"],
    "DISPARO CON REBOTES": ["#c7a978","#fff0bd","#69543a","ricochetshot"]
  };
  const v=palettes[n] || [player.color||"#8b72ff","#ffffff","#263b8f","energy"];
  return {main:v[0],light:v[1],dark:v[2],kind:v[3]};
}

function techniqueForAction(player, action) {
  const list = player.techniques || [];
  const wanted = action === "SHOT" ? ["TIRO"] : action === "KEEPER" ? ["PARADA","ATAJO"] : action === "TACKLE" ? ["DEFENSA","BLOQUEO"] : ["REGATE"];
  const options = list.filter(t => wanted.includes(t.type));
  // Dvalin portero alterna sus dos técnicas de parada para que ambas se puedan ver en partido.
  if (action === "KEEPER" && options.length > 1) {
    const index = player._keeperTechniqueIndex || 0;
    player._keeperTechniqueIndex = (index + 1) % options.length;
    return options[index % options.length];
  }
  return options[0] || (player.techName ? {name:player.techName,type:player.techType} : {name:"TÉCNICA ESPECIAL",type:"NORMAL"});
}

function startTechniqueSequence(player, action, isCPU=false, target=null, incoming=null) {
  if (techniqueSequence) return false;
  const selectedTechnique = techniqueForAction(player, action);
  const techniqueName = selectedTechnique.name || player.techName || "TÉCNICA ESPECIAL";
  const palette=techniquePalette(player, techniqueName);
  const duration=action==="SHOT"?2450:action==="KEEPER"?2050:1850;
  techniqueSequence={
    player, action, isCPU, target, incoming,
    techniqueName, techniqueType:selectedTechnique.type, palette, elapsed:0, duration,
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
  message(`✦ ${player.name}: ${techniqueName} ✦`,duration);
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
    // Despeje de emergencia corto y controlado: nunca debe cruzar el campo
    // con fuerza suficiente para acabar entrando accidentalmente en portería.
    const safeSide = keeper.y < H / 2 ? 1 : -1;
    releaseBall(direction * 3.2 * scale, safeSide * 1.4 * scale, false, false);
    ball.isShot = false;
    ball.isSpecialShot = false;
    ball.iceBall = false;
    ball.pickupImmunityUntil = Date.now() + 650;
    return;
  }

  // Elegir un compañero cercano y, si es posible, situado hacia el ataque.
  teammates.sort((a, b) => {
    const score = p => {
      const distance = Math.hypot(p.x - keeper.x, p.y - keeper.y);
      const forward = (p.x - keeper.x) * direction;
      return distance + Math.max(0, 55 * scale - forward) * 0.8 - Math.max(0, forward) * 0.10;
    };
    return score(a) - score(b);
  });

  const receiver = teammates[0];

  // Entrega la posesión directamente al receptor. Antes se soltaba el balón
  // junto al portero y este podía volver a recogerlo inmediatamente, quedándose
  // bloqueado con él y deteniendo el ataque de la CPU.
  ball.owner = receiver;
  ball.x = receiver.x + (receiver.side === 0 ? 13 : -13) * scale;
  ball.y = receiver.y + 5 * scale;
  ball.vx = receiver.vx || 0;
  ball.vy = receiver.vy || 0;
  ball.isShot = false;
  ball.isSpecialShot = false;
  ball.iceBall = false;
  ball.pickupImmunityUntil = Date.now() + 350;

  if (keeper.side === 0) {
    controlled = receiver;
    message(`${keeper.name} pasa a ${receiver.name}`, 1000);
    updateButtonLabel();
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
    ball.techName=seq.techniqueName;
    createTechniqueBurst(p.x,p.y,seq.palette,34);
    message(`¡¡${seq.techniqueName}!!`,1500);
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
      message(`¡¡${seq.techniqueName}!! ¡PARADA!`,1500);
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
      message(`¡${seq.techniqueName} no ha sido suficiente!`,1450);
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
  const nearGoal = holder.x < W * .52;
  const centralLane = Math.abs(holder.y - goalY) < H * .45;

  // La CPU conduce hacia el área rival, pero busca el hueco para chutar.
  // El área de decisión es más amplia para que no se quede circulando sin rematar.
  const attackTargetY = clamp(goalY + (holder.y < goalY ? 34 : -34) * scale, H * .22, H * .78);
  moveToward(holder, goalX + 95 * scale, attackTargetY, holder.speed * 1.02, dt);

  const now = Date.now();
  if (now < aiDecisionCooldown) return;
  aiDecisionCooldown = now + 420 + Math.random() * 420;

  const pressure = players.filter(p => p.side === 0 && p.role !== "POR")
    .some(p => Math.hypot(p.x - holder.x, p.y - holder.y) < 92 * scale);

  const teammates = players.filter(p => p.side === 1 && p !== holder && p.role !== "POR");
  const shootingRange = distance < W * .58;
  const canShoot = nearGoal && centralLane && shootingRange && now > aiShotCooldown;
  const shotChance = clamp(.72 + ((holder.shot || holder.rating || 70) - 70) * .009, .68, .96);

  if (canShoot && Math.random() < shotChance) {
    aiShotCooldown = now + 3000 + Math.random() * 1800;
    const canUseTechnique = holder.techType === "TIRO" && holder.pt >= (holder.ptCost || 35)
      && now > aiTechniqueCooldown && now > (holder.techCooldown || 0)
      && Math.random() < .90;
    if (canUseTechnique) {
      holder.pt -= holder.ptCost || 35;
      holder.techCooldown = now + 6500;
      aiTechniqueCooldown = now + 1800 + Math.random() * 1400;
      if (!startTechniqueSequence(holder, "SHOT", true)) {
        holder.pt += holder.ptCost || 35;
        aiShotCooldown = now + 900;
      }
    } else {
      const shotSkill = holder.shot || holder.rating || 70;
      const targetY = clamp(goalY + (Math.random() - .5) * (H * (.08 + (90 - shotSkill) * .002)), H * .40, H * .60);
      const aimX = goalX - holder.x;
      const aimY = targetY - holder.y;
      const aimD = Math.hypot(aimX, aimY) || 1;
      const power = (20 + shotSkill * .075) * scale;
      releaseBall(aimX / aimD * power, aimY / aimD * power, false, true);
      message(`¡${holder.name} chuta a puerta!`, 1000);
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
  const name=(seq.techniqueName || seq.player.techName || "").toUpperCase();
  const x=seq.player.x, y=seq.player.y;
  const t=seq.elapsed*.001, s=scale;
  const k=(1+Math.sin(t*9))*.5;
  const ballX=ball.x, ballY=ball.y;
  const stroke=(color,width=5)=>{ctx.strokeStyle=color;ctx.lineWidth=width*s;ctx.lineCap="round";ctx.lineJoin="round";};
  const glow=(color,blur=18)=>{ctx.shadowColor=color;ctx.shadowBlur=blur*s;};
  ctx.save();
  ctx.globalAlpha=.95;
  switch(name) {
    case "LANZA DE ODÍN": {
      // Portal dimensional morado y lanza que sale de él hacia la portería.
      const dir=seq.player.side===0?1:-1;
      const px=ballX-dir*(22+progress*18)*s, py=ballY-54*s;
      glow("#b56cff",30); ctx.save(); ctx.translate(px,py); ctx.scale(1,.72);
      for(let i=0;i<4;i++){ctx.save();ctx.rotate(t*1.8+i*Math.PI/2);stroke(i%2?"#f4dcff":"#8b43e8",4);ctx.beginPath();ctx.arc(0,0,(22+i*7)*s,-1.0,1.35);ctx.stroke();ctx.restore();}
      ctx.restore();
      ctx.save();ctx.translate(ballX+dir*(18+progress*70)*s,ballY-25*s);ctx.rotate(dir*.12);
      stroke("#d8c1ff",7);ctx.beginPath();ctx.moveTo(-42*s,0);ctx.lineTo(36*s,0);ctx.stroke();
      ctx.fillStyle="#f1e4ff";ctx.strokeStyle="#8f42df";ctx.lineWidth=2*s;ctx.beginPath();ctx.moveTo(48*s,0);ctx.lineTo(28*s,-10*s);ctx.lineTo(32*s,0);ctx.lineTo(28*s,10*s);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.restore(); break;
    }
    case "AGUJERO DE GUSANO": {
      // Espiral verde que absorbe el balón y lo devuelve a los pies del portero.
      const cx=x+(seq.player.side===0?1:-1)*30*s, cy=y-4*s;
      glow("#32e878",32); stroke("#baffce",5);
      for(let ring=0;ring<4;ring++){ctx.beginPath();ctx.ellipse(cx,cy,22*s+ring*9*s,15*s+ring*6*s,t*(ring%2?-.9:1.1)+ring*.65,0,Math.PI*2);ctx.stroke();}
      ctx.beginPath();for(let a=0;a<Math.PI*5;a+=.12){const r=(a/(Math.PI*5))*48*s;const px=cx+Math.cos(a-t*4)*r,py=cy+Math.sin(a-t*4)*r*.68;if(a===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);}ctx.stroke();
      ctx.fillStyle="#d8ffe4";ctx.beginPath();ctx.arc(cx,cy,5*s,0,Math.PI*2);ctx.fill();break;
    }
    case "DESTROZATALADROS": {
      // Taladro de energía girando delante del guardameta para despejar el balón.
      const dir=seq.player.side===0?1:-1, cx=x+dir*48*s, cy=y-2*s;
      ctx.save();ctx.translate(cx,cy);ctx.rotate(t*13);glow("#ffb33d",28);
      for(let i=0;i<5;i++){ctx.save();ctx.rotate(i*Math.PI*2/5);ctx.fillStyle=i%2?"#e8a43b":"#fff0a8";ctx.strokeStyle="#8a4c12";ctx.lineWidth=2*s;ctx.beginPath();ctx.moveTo(0,-8*s);ctx.lineTo(45*s,0);ctx.lineTo(0,8*s);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}
      ctx.fillStyle="#fff4c4";ctx.beginPath();ctx.arc(0,0,9*s,0,Math.PI*2);ctx.fill();ctx.restore();break;
    }
    case "GOLPE DE VACÍO": {
      // Corte de vacío azul que succiona el balón hacia una burbuja.
      const dir=seq.player.side===0?1:-1, cx=x+dir*38*s, cy=y-8*s;
      glow("#48baff",28);stroke("#d8f5ff",5);ctx.beginPath();ctx.moveTo(cx-dir*22*s,cy+45*s);ctx.quadraticCurveTo(cx+dir*20*s,cy,cx-dir*22*s,cy-45*s);ctx.stroke();
      ctx.strokeStyle="#4ebdff";ctx.lineWidth=3*s;ctx.beginPath();ctx.ellipse(cx,cy,24*s,42*s,t*.5,0,Math.PI*2);ctx.stroke();
      for(let i=0;i<9;i++){const a=t*4+i*Math.PI*2/9,rr=(55-progress*27)*s;ctx.fillStyle=i%2?"#e5f8ff":"#55c5ff";ctx.beginPath();ctx.arc(ballX+Math.cos(a)*rr,ballY+Math.sin(a)*rr*.65,2.5*s,0,Math.PI*2);ctx.fill();}
      ctx.fillStyle="#e6f8ff";ctx.beginPath();ctx.arc(cx,cy,8*s,0,Math.PI*2);ctx.fill();break;
    }
    case "RAYO DE GANÍMEDES": {
      const dir=seq.player.side===0?1:-1;glow("#8298ff",30);stroke("#e7ebff",6);
      ctx.beginPath();ctx.moveTo(ballX-dir*25*s,ballY-5*s);ctx.lineTo(ballX+dir*25*s,ballY-42*s);ctx.lineTo(ballX+dir*8*s,ballY-17*s);ctx.lineTo(ballX+dir*72*s,ballY-70*s);ctx.stroke();
      stroke("#586fff",9);ctx.beginPath();ctx.moveTo(ballX+dir*12*s,ballY+8*s);ctx.lineTo(ballX+dir*(35+progress*80)*s,ballY-22*s);ctx.stroke();break;
    }
    case "MURO DIMENSIONAL": {
      const dir=seq.player.side===0?1:-1, bx=x+dir*48*s;
      glow("#54e7dc",26);ctx.fillStyle="rgba(50,205,205,.20)";ctx.strokeStyle="#c5fffa";ctx.lineWidth=4*s;
      ctx.beginPath();ctx.moveTo(bx-dir*24*s,y-62*s);ctx.lineTo(bx+dir*24*s,y-48*s);ctx.lineTo(bx+dir*24*s,y+48*s);ctx.lineTo(bx-dir*24*s,y+62*s);ctx.closePath();ctx.fill();ctx.stroke();
      for(let i=0;i<4;i++){ctx.beginPath();ctx.ellipse(bx,y,(18+i*7)*s,(28+i*8)*s,t*.5+i*.4,0,Math.PI*2);ctx.stroke();}break;
    }
    case "RE MATE DE GAIA": case "REMATE DE GAIA": {
      glow("#79d66e",24);for(let i=0;i<3;i++){const a=t*2+i*Math.PI*2/3,px=ballX+Math.cos(a)*42*s,py=ballY+Math.sin(a)*28*s;ctx.fillStyle=i%2?"#c9ff9c":"#67c85d";ctx.beginPath();ctx.arc(px,py,10*s,0,Math.PI*2);ctx.fill();stroke("#eaffd8",2);ctx.stroke();}stroke("#b8ff91",5);ctx.beginPath();ctx.arc(ballX,ballY,48*s,t,t+Math.PI*1.4);ctx.stroke();break;
    }
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
    case "MURALLA GIGANTE": {
      // Muralla Gigante: un muro monumental de bloques se levanta desde el césped.
      const dir=seq.player.side===0?1:-1, wx=x+dir*58*s, top=y-72*s, wide=150*s, high=118*s;
      glow("#d9e7f5",28);ctx.fillStyle="#899eB5";ctx.strokeStyle="#f5fbff";ctx.lineWidth=4*s;
      ctx.beginPath();ctx.moveTo(wx-wide/2,top+15*s);ctx.lineTo(wx-wide/2+18*s,top);ctx.lineTo(wx+wide/2-18*s,top);ctx.lineTo(wx+wide/2,top+15*s);ctx.lineTo(wx+wide/2,y+high/2);ctx.lineTo(wx-wide/2,y+high/2);ctx.closePath();ctx.fill();ctx.stroke();
      for(let r=0;r<3;r++)for(let c=0;c<4;c++){const xx=wx-wide/2+c*wide/4+(r%2?0:0);ctx.strokeRect(xx,top+15*s+r*high/3,wide/4,high/3);}break;
    }
    case "EL MURO": {
      // El Muro: una barrera compacta de energía gris-azulada, formada por placas hexagonales.
      const dir=seq.player.side===0?1:-1, cx=x+dir*43*s, cy=y;
      glow("#a9c8e8",23);ctx.fillStyle="rgba(94,126,163,.55)";ctx.strokeStyle="#eaf5ff";ctx.lineWidth=3*s;
      ctx.beginPath();ctx.moveTo(cx-35*s,cy-48*s);ctx.lineTo(cx+35*s,cy-48*s);ctx.lineTo(cx+48*s,cy);ctx.lineTo(cx+35*s,cy+48*s);ctx.lineTo(cx-35*s,cy+48*s);ctx.lineTo(cx-48*s,cy);ctx.closePath();ctx.fill();ctx.stroke();
      for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(cx+i*22*s,cy-28*s);ctx.lineTo(cx+(i+1)*22*s,cy);ctx.lineTo(cx+i*22*s,cy+28*s);ctx.stroke();}break;
    }
    case "TORNADO DE FUEGO": {
      const dir=seq.player.side===0?1:-1;ctx.save();ctx.translate(ballX,ballY);ctx.scale(dir,1);glow("#ff4a18",30);
      for(let i=0;i<9;i++){ctx.save();ctx.rotate(t*5+i*Math.PI*2/9);stroke(i%2?"#ffcf4a":"#ff5722",7);ctx.beginPath();ctx.moveTo(-8*s,8*s);ctx.bezierCurveTo(-48*s,-12*s,-30*s,-55*s,12*s,-76*s);ctx.stroke();ctx.restore();}
      ctx.restore();break;
    }
    case "LLAMARADA ATÓMICA": {
      // La llamarada atómica concentra energía en un núcleo y libera anillos explosivos.
      const dir=seq.player.side===0?1:-1;ctx.save();ctx.translate(ballX,ballY);ctx.scale(dir,1);glow("#ff6a1c",34);
      ctx.fillStyle="#ff4b20";ctx.beginPath();ctx.arc(0,0,(18+progress*10)*s,0,Math.PI*2);ctx.fill();
      for(let i=0;i<3;i++){ctx.strokeStyle=i===0?"#fff6a5":i===1?"#ffcf45":"#ff5b22";ctx.lineWidth=(7-i*1.5)*s;ctx.beginPath();ctx.ellipse(0,0,(34+progress*65+i*12)*s,(19+progress*37+i*8)*s,t*1.5+i,0,Math.PI*2);ctx.stroke();}
      for(let i=0;i<10;i++){const a=i*Math.PI/5+t*2,rr=(55+progress*55)*s;ctx.strokeStyle="#ffe88a";ctx.lineWidth=3*s;ctx.beginPath();ctx.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);ctx.lineTo(Math.cos(a)*(rr+15*s),Math.sin(a)*(rr+15*s));ctx.stroke();}ctx.restore();break;
    }
    case "VENTISCA ETERNA": {
      // Ventisca Eterna: una gran tormenta polar gira alrededor del jugador y arrastra el balón en un remolino de nieve.
      const dir=seq.player.side===0?1:-1;
      glow("#b8f4ff",34);
      for(let ring=0;ring<5;ring++){
        ctx.save();ctx.translate(ballX,ballY);ctx.rotate(t*(ring%2?-.95:1.15)+ring*.48);
        ctx.strokeStyle=ring%2?"#ffffff":"#8cecff";ctx.lineWidth=(5-ring*.55)*s;
        ctx.beginPath();ctx.ellipse(0,0,(30+ring*13+progress*24)*s,(18+ring*7)*s,0,-.35,Math.PI*1.55);ctx.stroke();ctx.restore();
      }
      // Ráfagas de viento largas y copos de nieve de seis puntas.
      for(let i=0;i<15;i++){
        const a=t*2.8+i*Math.PI*2/15,rr=(42+((i*17)%45)+progress*28)*s;
        const px=ballX+Math.cos(a)*rr,py=ballY+Math.sin(a)*rr*.62;
        stroke(i%3===0?"#ffffff":"#8cecff",i%3===0?4:2.5);
        ctx.beginPath();ctx.moveTo(px-11*s,py-4*s);ctx.quadraticCurveTo(px,py-9*s,px+13*s,py-2*s);ctx.moveTo(px,py-7*s);ctx.lineTo(px,py+7*s);ctx.moveTo(px-5*s,py-5*s);ctx.lineTo(px+5*s,py+5*s);ctx.stroke();
      }
      // Una ráfaga final empuja la técnica hacia la portería.
      ctx.save();ctx.translate(ballX,ballY);ctx.scale(dir,1);stroke("#eaffff",7);ctx.beginPath();ctx.moveTo(-25*s,0);ctx.quadraticCurveTo(25*s,-30*s,78*s,-8*s);ctx.quadraticCurveTo(38*s,8*s,-25*s,14*s);ctx.stroke();ctx.restore();break;
    }
    case "BALÓN DE HIELO": {
      // Balón de Hielo: la pelota queda encerrada en una esfera compacta de hielo con placas cristalinas.
      const r=(23+progress*17)*s;glow("#55dfff",30);
      ctx.fillStyle="rgba(90,220,255,.22)";ctx.strokeStyle="#e9fcff";ctx.lineWidth=4*s;
      ctx.beginPath();ctx.arc(ballX,ballY,r,0,Math.PI*2);ctx.fill();ctx.stroke();
      for(let i=0;i<8;i++){
        const a=i*Math.PI/4+t*.45,inner=r*.62,outer=r+9*s;
        ctx.fillStyle=i%2?"#a8f0ff":"#e8fcff";ctx.strokeStyle="#39bfe9";ctx.lineWidth=1.8*s;
        ctx.beginPath();ctx.moveTo(ballX+Math.cos(a)*inner,ballY+Math.sin(a)*inner);ctx.lineTo(ballX+Math.cos(a-.19)*outer,ballY+Math.sin(a-.19)*outer);ctx.lineTo(ballX+Math.cos(a+.19)*outer,ballY+Math.sin(a+.19)*outer);ctx.closePath();ctx.fill();ctx.stroke();
      }
      for(let i=0;i<3;i++){ctx.strokeStyle="#ffffff";ctx.lineWidth=2*s;ctx.beginPath();ctx.arc(ballX,ballY,(r+8*s+i*7*s),t*1.8+i*2, t*1.8+i*2+Math.PI*.72);ctx.stroke();}
      ctx.fillStyle="#ffffff";ctx.beginPath();ctx.arc(ballX,ballY,5*s,0,Math.PI*2);ctx.fill();break;
    }
    case "DISPARO CON REBOTES": {
      // La pelota rebota entre plataformas de roca, como la técnica característica de Demeter.
      const dir=seq.player.side===0?1:-1;
      glow("#d8c18a",22);
      for(let i=0;i<4;i++){
        const px=ballX+dir*(28+i*34)*s;
        const py=ballY+Math.sin(t*3+i*1.35)*((18+i*3)*s)+((i%2)?-22:22)*s;
        ctx.save();ctx.translate(px,py);ctx.rotate((i%2?1:-1)*.18);
        ctx.fillStyle=i%2?"#b8a078":"#8e795c";ctx.strokeStyle="#f3dfb5";ctx.lineWidth=2*s;
        ctx.beginPath();ctx.moveTo(-16*s,5*s);ctx.lineTo(-9*s,-8*s);ctx.lineTo(8*s,-11*s);ctx.lineTo(17*s,2*s);ctx.lineTo(8*s,9*s);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
      }
      stroke("#fff0bd",3);ctx.beginPath();ctx.moveTo(ballX-dir*22*s,ballY+18*s);ctx.quadraticCurveTo(ballX+dir*28*s,ballY-34*s,ballX+dir*78*s,ballY+4*s);ctx.stroke();
      break;
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
    case "TIRO DEL MEGAAULÓN": {
      // Un monstruo marino de energía rodea la pelota con mandíbulas y aletas.
      const dir=seq.player.side===0?1:-1;ctx.save();ctx.translate(ballX,ballY);ctx.scale(dir,1);glow("#35d9ff",28);
      ctx.strokeStyle="#8df4ff";ctx.lineWidth=7*s;ctx.beginPath();ctx.ellipse(0,0,55*s,29*s,t,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle="#087da9";ctx.strokeStyle="#c9fbff";ctx.lineWidth=3*s;ctx.beginPath();ctx.moveTo(-18*s,-10*s);ctx.quadraticCurveTo(15*s,-48*s,54*s,-17*s);ctx.lineTo(35*s,-2*s);ctx.lineTo(57*s,17*s);ctx.quadraticCurveTo(14*s,45*s,-18*s,10*s);ctx.closePath();ctx.fill();ctx.stroke();
      for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo((-10+i*13)*s,-16*s);ctx.lineTo((-18+i*13)*s,-34*s);ctx.lineTo((-1+i*13)*s,-20*s);ctx.stroke();}ctx.restore();break;
    }
    case "REMATE CELESTE": {
      // Un halo celestial de luz azul-blanca se abre como alas detrás del balón.
      const dir=seq.player.side===0?1:-1;ctx.save();ctx.translate(ballX,ballY);ctx.scale(dir,1);glow("#b9f6ff",32);
      for(let side of [-1,1]){ctx.fillStyle="rgba(120,225,255,.32)";ctx.strokeStyle="#f0ffff";ctx.lineWidth=3*s;ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(25*s,side*48*s,82*s,side*55*s);ctx.quadraticCurveTo(54*s,side*18*s,0,0);ctx.fill();ctx.stroke();for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(8*s,side*5*s);ctx.lineTo((28+i*12)*s,side*(15+i*10)*s);ctx.stroke();}}
      ctx.strokeStyle="#7ceaff";ctx.lineWidth=4*s;ctx.beginPath();ctx.arc(0,0,(28+progress*55)*s,-Math.PI*.8,Math.PI*.8);ctx.stroke();ctx.restore();break;
    }
    case "MANO MÁGICA": {
      // Mano Mágica de Darren: una criatura/demonio azul emerge detrás del portero y abre una garra sobrenatural.
      const dir=seq.player.side===0?1:-1, hx=x+dir*(38+progress*10)*s, hy=y-5*s;
      ctx.save();ctx.translate(hx,hy);ctx.scale(dir,1);glow("#287bff",34);
      // Cuernos y silueta de la cabeza demoníaca.
      ctx.fillStyle="#1454c7";ctx.strokeStyle="#c8e5ff";ctx.lineWidth=3*s;
      ctx.beginPath();ctx.moveTo(-27*s,-12*s);ctx.lineTo(-36*s,-42*s);ctx.lineTo(-12*s,-28*s);ctx.quadraticCurveTo(0,-43*s,12*s,-28*s);ctx.lineTo(36*s,-42*s);ctx.lineTo(27*s,-10*s);ctx.quadraticCurveTo(43*s,15*s,25*s,37*s);ctx.quadraticCurveTo(0,53*s,-25*s,36*s);ctx.quadraticCurveTo(-43*s,13*s,-27*s,-12*s);ctx.closePath();ctx.fill();ctx.stroke();
      // Ojos luminosos y boca oscura.
      ctx.fillStyle="#e9f7ff";ctx.beginPath();ctx.ellipse(-13*s,2*s,6*s,3.5*s,-.25,0,Math.PI*2);ctx.ellipse(13*s,2*s,6*s,3.5*s,.25,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#071b63";ctx.beginPath();ctx.moveTo(-12*s,20*s);ctx.lineTo(12*s,20*s);ctx.lineTo(0,32*s);ctx.closePath();ctx.fill();
      // Garra de cinco dedos que se abre hacia el balón.
      ctx.strokeStyle="#8fcaff";ctx.lineWidth=7*s;ctx.lineCap="round";
      ctx.beginPath();ctx.moveTo(8*s,28*s);ctx.quadraticCurveTo(28*s,47*s,38*s,28*s);ctx.moveTo(24*s,32*s);ctx.lineTo(35*s,2*s);ctx.lineTo(31*s,-20*s);ctx.moveTo(34*s,8*s);ctx.lineTo(49*s,-9*s);ctx.lineTo(52*s,-27*s);ctx.moveTo(38*s,21*s);ctx.lineTo(59*s,9*s);ctx.lineTo(66*s,-8*s);ctx.moveTo(28*s,35*s);ctx.lineTo(17*s,55*s);ctx.stroke();
      ctx.restore();break;
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
    case "ACELERACIÓN": {
      const dir=seq.player.side===0?1:-1;glow("#70e6ff",20);for(let i=0;i<8;i++){const yy=y+(i-3.5)*9*s;stroke(i%2?"#ffffff":"#70e6ff",3);ctx.beginPath();ctx.moveTo(x-dir*(20+i*4)*s,yy);ctx.lineTo(x-dir*(85+i*7)*s,yy+(i-3.5)*2*s);ctx.stroke();}break;
    }
    case "APOYO TOTAL": {
      glow("#ff8fc5",20);for(let i=0;i<3;i++){ctx.strokeStyle=i%2?"#fff0f8":"#ff8fc5";ctx.lineWidth=4*s;ctx.beginPath();ctx.arc(x,y,28*s+i*17*s,t+i*2,t+i*2+Math.PI*1.7);ctx.stroke();}break;
    }
    case "BARRERA DEFENSIVA": case "BLOQUEO DOBLE": case "BLOQUEO REAL": case "BLOQUEO DEL BOSQUE": case "MURO DE ACERO": {
      const dir=seq.player.side===0?1:-1,cx=x+dir*43*s,cy=y;
      if(name==="BLOQUEO DEL BOSQUE"){glow("#6dbb55",23);stroke("#caff9c",5);for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(cx-dir*28*s,cy+(i-2)*13*s);ctx.bezierCurveTo(cx,cy+(i-2)*35*s,cx+dir*35*s,cy-(i-2)*18*s,cx+dir*57*s,cy+(i-2)*7*s);ctx.stroke();}}
      else if(name==="BARRERA DEFENSIVA"){glow("#8db6d8",24);ctx.fillStyle="rgba(120,170,210,.4)";ctx.strokeStyle="#f1f8ff";ctx.lineWidth=4*s;ctx.fillRect(cx-8*s,cy-55*s,16*s,110*s);ctx.strokeRect(cx-8*s,cy-55*s,16*s,110*s);for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(cx-28*s,cy+i*18*s);ctx.lineTo(cx+28*s,cy+i*18*s);ctx.stroke();}}
      else if(name==="MURO DE ACERO"){glow("#91a7bb",26);ctx.fillStyle="#596f85";ctx.strokeStyle="#f3f8ff";ctx.lineWidth=4*s;ctx.fillRect(cx-48*s,cy-42*s,96*s,84*s);ctx.strokeRect(cx-48*s,cy-42*s,96*s,84*s);for(let xx of [-35,35])for(let yy of [-29,29]){ctx.beginPath();ctx.arc(cx+xx*s,cy+yy*s,4*s,0,Math.PI*2);ctx.fillStyle="#e5f0fa";ctx.fill();ctx.stroke();}}
      else {const count=name==="BLOQUEO DOBLE"?2:3;glow(name==="BLOQUEO REAL"?"#e9c65b":"#a5c9e8",24);for(let i=0;i<count;i++){const ox=(i-(count-1)/2)*34*s;ctx.fillStyle=name==="BLOQUEO REAL"?"#c9a344":"#7895b5";ctx.strokeStyle="#f5fbff";ctx.lineWidth=3*s;ctx.beginPath();ctx.moveTo(cx+ox,cy-45*s);ctx.lineTo(cx+ox+27*s,cy-27*s);ctx.lineTo(cx+ox+23*s,cy+30*s);ctx.lineTo(cx+ox,cy+48*s);ctx.lineTo(cx+ox-23*s,cy+30*s);ctx.lineTo(cx+ox-27*s,cy-27*s);ctx.closePath();ctx.fill();ctx.stroke();if(name==="BLOQUEO REAL"){ctx.beginPath();ctx.moveTo(cx+ox-12*s,cy-45*s);ctx.lineTo(cx+ox-7*s,cy-60*s);ctx.lineTo(cx+ox,cy-48*s);ctx.lineTo(cx+ox+8*s,cy-60*s);ctx.lineTo(cx+ox+13*s,cy-45*s);ctx.stroke();}}}break;
    }
    case "COMETA OSCURO": case "TIRO FANTASMA": case "TIRO DEL ÁGUILA": case "TIRO GALÁCTICO": case "ODIN SWORD": case "LANZA DEL REY": {
      const dir=seq.player.side===0?1:-1;ctx.save();ctx.translate(ballX,ballY);ctx.scale(dir,1);glow(seq.palette.main,27);
      if(name==="TIRO FANTASMA"){ctx.globalAlpha=.5;for(let i=0;i<3;i++){ctx.strokeStyle="#e8f5ff";ctx.lineWidth=4*s;ctx.beginPath();ctx.arc(-i*18*s,0,(18+i*9)*s,-1.4,1.4);ctx.stroke();}ctx.globalAlpha=.95;}
      else if(name==="TIRO DEL ÁGUILA"){for(let side of [-1,1]){stroke("#ffffff",5);ctx.beginPath();ctx.moveTo(-15*s,0);ctx.quadraticCurveTo(15*s,side*42*s,65*s,side*55*s);ctx.stroke();}}
      else if(name==="TIRO GALÁCTICO"||name==="COMETA OSCURO"){for(let i=0;i<6;i++){const a=t*2+i*Math.PI/3;ctx.fillStyle=i%2?seq.palette.light:seq.palette.main;ctx.beginPath();ctx.arc(Math.cos(a)*35*s,Math.sin(a)*23*s,5*s,0,Math.PI*2);ctx.fill();}ctx.strokeStyle=seq.palette.light;ctx.lineWidth=4*s;ctx.beginPath();ctx.arc(0,0,38*s,t,t+Math.PI*1.5);ctx.stroke();}
      else {stroke(seq.palette.light,7);ctx.beginPath();ctx.moveTo(-55*s,0);ctx.lineTo(35*s,0);ctx.stroke();ctx.fillStyle=seq.palette.main;ctx.beginPath();ctx.moveTo(58*s,0);ctx.lineTo(28*s,-13*s);ctx.lineTo(35*s,0);ctx.lineTo(28*s,13*s);ctx.closePath();ctx.fill();}
      ctx.restore();break;
    }
    case "CONTROL MENTAL": case "GRAVEDAD": {
      glow(seq.palette.main,25);for(let i=0;i<5;i++){const a=t*(name==="GRAVEDAD"?-.8:1.3)+i*Math.PI*2/5,rr=(22+i*11)*s;ctx.strokeStyle=i%2?seq.palette.light:seq.palette.main;ctx.lineWidth=3*s;ctx.beginPath();ctx.ellipse(x+Math.cos(a)*rr*.45,y+Math.sin(a)*rr*.35,rr,rr*.45,a,0,Math.PI*2);ctx.stroke();}ctx.fillStyle=seq.palette.light;ctx.beginPath();ctx.arc(x,y,7*s,0,Math.PI*2);ctx.fill();break;
    }
    case "ESPEJISMO HELADO": case "REGATE FANTASMA": case "SOMBRA FANTASMA": case "SOMBRA DEFENSIVA": {
      if(name==="ESPEJISMO HELADO"){for(let i=0;i<3;i++){const ox=(i-1)*35*s;ctx.globalAlpha=.3+i*.18;ctx.fillStyle="rgba(120,225,255,.25)";ctx.strokeStyle="#eaffff";ctx.lineWidth=3*s;ctx.beginPath();ctx.moveTo(x+ox,y-34*s);ctx.lineTo(x+ox+18*s,y);ctx.lineTo(x+ox,y+34*s);ctx.lineTo(x+ox-18*s,y);ctx.closePath();ctx.fill();ctx.stroke();}}
      else if(name==="REGATE FANTASMA"){for(let i=0;i<4;i++){ctx.globalAlpha=.16+i*.16;ctx.strokeStyle="#f4f6ff";ctx.lineWidth=5*s;ctx.beginPath();ctx.ellipse(x-i*20*s,y,13*s,27*s,0,0,Math.PI*2);ctx.stroke();}}
      else if(name==="SOMBRA FANTASMA"){ctx.globalAlpha=.65;ctx.fillStyle="#171a3b";ctx.strokeStyle="#c5c7ff";ctx.lineWidth=3*s;ctx.beginPath();ctx.moveTo(x,y-40*s);ctx.quadraticCurveTo(x+35*s,y-12*s,x+20*s,y+35*s);ctx.lineTo(x,y+20*s);ctx.lineTo(x-20*s,y+35*s);ctx.quadraticCurveTo(x-35*s,y-12*s,x,y-40*s);ctx.fill();ctx.stroke();}
      else {ctx.globalAlpha=.65;ctx.strokeStyle="#bfc5ff";ctx.lineWidth=7*s;ctx.beginPath();ctx.arc(x,y,43*s,-1.2,1.2);ctx.stroke();ctx.beginPath();ctx.arc(x,y,32*s,Math.PI-.9,Math.PI+.9);ctx.stroke();}ctx.globalAlpha=.95;break;
    }
    case "FLECHA SOLAR": {
      const dir=seq.player.side===0?1:-1;glow("#ffbd36",27);ctx.save();ctx.translate(ballX,ballY);ctx.scale(dir,1);stroke("#fff5a8",8);ctx.beginPath();ctx.moveTo(-45*s,0);ctx.lineTo(42*s,0);ctx.stroke();ctx.fillStyle="#ffbd36";ctx.beginPath();ctx.moveTo(65*s,0);ctx.lineTo(35*s,-18*s);ctx.lineTo(42*s,0);ctx.lineTo(35*s,18*s);ctx.closePath();ctx.fill();for(let i=0;i<7;i++){const a=i*Math.PI*2/7;ctx.strokeStyle="#fff5a8";ctx.beginPath();ctx.moveTo(Math.cos(a)*25*s,Math.sin(a)*25*s);ctx.lineTo(Math.cos(a)*43*s,Math.sin(a)*43*s);ctx.stroke();}ctx.restore();break;
    }
    case "MANO DEL VACÍO": case "MANO FANTASMA": {
      const dir=seq.player.side===0?1:-1;ctx.save();ctx.translate(x+dir*42*s,y);ctx.scale(dir,1);glow(seq.palette.main,28);
      if(name==="MANO DEL VACÍO"){for(let i=0;i<4;i++){ctx.strokeStyle=i%2?"#e0e1ff":"#5e65b9";ctx.lineWidth=4*s;ctx.beginPath();ctx.arc(0,0,(14+i*10)*s,t*2+i,t*2+i+Math.PI*1.55);ctx.stroke();}ctx.fillStyle="#10143e";ctx.beginPath();ctx.arc(0,0,12*s,0,Math.PI*2);ctx.fill();}
      else {ctx.fillStyle="#a5b8d7";ctx.strokeStyle="#f3f7ff";ctx.lineWidth=3*s;ctx.beginPath();ctx.ellipse(0,4*s,20*s,24*s,0,0,Math.PI*2);ctx.fill();ctx.stroke();for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo((-15+i*7.5)*s,-10*s);ctx.quadraticCurveTo((-20+i*10)*s,-38*s,(-17+i*9)*s,-49*s);ctx.stroke();}}
      ctx.restore();break;
    }
    case "OLA GIGANTE": {
      glow("#35c9e8",27);for(let i=0;i<4;i++){ctx.strokeStyle=i%2?"#d8fbff":"#35c9e8";ctx.lineWidth=(8-i)*s;ctx.beginPath();ctx.moveTo(ballX-65*s,ballY+25*s+i*5*s);ctx.bezierCurveTo(ballX-35*s,ballY-70*s,ballX+35*s,ballY-70*s,ballX+70*s,ballY+12*s);ctx.stroke();}break;
    }
    case "PASE PRECISO": case "PASE RELÁMPAGO": {
      const cx=ballX,cy=ballY;glow(seq.palette.main,20);for(let i=0;i<3;i++){ctx.strokeStyle=i%2?seq.palette.light:seq.palette.main;ctx.lineWidth=3*s;ctx.beginPath();ctx.arc(cx,cy,(18+i*15)*s,t,t+Math.PI*1.7);ctx.stroke();}if(name==="PASE RELÁMPAGO"){stroke("#ffffff",4);ctx.beginPath();ctx.moveTo(cx-30*s,cy+22*s);ctx.lineTo(cx-5*s,cy-12*s);ctx.lineTo(cx+3*s,cy+5*s);ctx.lineTo(cx+34*s,cy-32*s);ctx.stroke();}break;
    }
    case "PRISIÓN DE HIELO": {
      glow("#8de5ff",27);ctx.strokeStyle="#f4ffff";ctx.lineWidth=4*s;for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.beginPath();ctx.moveTo(ballX+Math.cos(a)*28*s,ballY+Math.sin(a)*28*s);ctx.lineTo(ballX+Math.cos(a)*55*s,ballY+Math.sin(a)*55*s);ctx.stroke();}ctx.strokeRect(ballX-34*s,ballY-42*s,68*s,84*s);break;
    }
    case "REGATE GIRATORIO": case "VÓRTICE": case "TIRO GIRATORIO": {
      const cx=name==="TIRO GIRATORIO"?ballX:x,cy=name==="TIRO GIRATORIO"?ballY:y;glow(seq.palette.main,25);
      if(name==="VÓRTICE"){for(let i=0;i<6;i++){ctx.strokeStyle=i%2?seq.palette.light:seq.palette.main;ctx.lineWidth=4*s;ctx.beginPath();ctx.arc(cx,cy,18*s+i*9*s,t+i,t+i+Math.PI*1.45);ctx.stroke();}}
      else if(name==="TIRO GIRATORIO"){ctx.save();ctx.translate(cx,cy);ctx.rotate(t*5);for(let i=0;i<4;i++){ctx.strokeStyle=i%2?"#eaffff":seq.palette.main;ctx.lineWidth=5*s;ctx.beginPath();ctx.ellipse(0,0,58*s-i*8*s,17*s+i*5*s,i*.3,0,Math.PI*2);ctx.stroke();}ctx.restore();}
      else {for(let i=0;i<5;i++){ctx.strokeStyle=i%2?seq.palette.light:seq.palette.main;ctx.lineWidth=4*s;ctx.beginPath();ctx.ellipse(cx,cy,22*s+i*10*s,12*s+i*6*s,t*(i%2?1:-1)+i,0,Math.PI*1.65);ctx.stroke();}}break;
    }
    case "TRUENO": {
      glow("#ffe35b",25);for(let i=0;i<5;i++){const xx=ballX+(i-2)*18*s;stroke(i%2?"#ffffff":"#ffe35b",4);ctx.beginPath();ctx.moveTo(xx-8*s,ballY-45*s);ctx.lineTo(xx+5*s,ballY-12*s);ctx.lineTo(xx-7*s,ballY-2*s);ctx.lineTo(xx+10*s,ballY+38*s);ctx.stroke();}break;
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
