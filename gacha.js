"use strict";

let currentGachaPlayer = null;
let gachaRevealed = false;

const RARITY_TIERS = [
  { name: "COMÚN", chance: 55, color: "#b8c2cc", boost: 0, multiplier: 1 },
  { name: "RARO", chance: 25, color: "#45a7ff", boost: 2, multiplier: 2 },
  { name: "ÉPICO", chance: 13, color: "#bd70ff", boost: 5, multiplier: 3 },
  { name: "LEGENDARIO", chance: 6, color: "#ffb52e", boost: 9, multiplier: 4 },
  { name: "MÍTICO", chance: 1, color: "#ff5d75", boost: 13, multiplier: 5 }
];

function chooseRarity(minTierIndex = 0) {
  const eligible = RARITY_TIERS.slice(minTierIndex);
  const total = eligible.reduce((sum, tier) => sum + tier.chance, 0);
  let roll = Math.random() * total;
  for (const tier of eligible) {
    roll -= tier.chance;
    if (roll < 0) return tier;
  }
  return eligible[0] || RARITY_TIERS[0];
}

function makeRarityCard(base, tier) {
  const rarityTechs = (typeof CHARACTER_RARITY_TECHNIQUES !== "undefined" && CHARACTER_RARITY_TECHNIQUES[base.name]) || null;
  let techniques = rarityTechs && rarityTechs[tier.name]
    ? rarityTechs[tier.name].map(t => ({ ...t }))
    : (base.techniques || []).map(t => ({ ...t }));
  // En personajes con varias técnicas registradas, cada rareza va desbloqueando
  // una técnica adicional; así las rarezas altas amplían la elección en Equipo.
  if (!(rarityTechs && rarityTechs[tier.name]) && techniques.length > 1) {
    const tierIndex = RARITY_TIERS.findIndex(t => t.name === tier.name);
    techniques = techniques.slice(0, Math.min(techniques.length, tierIndex + 1));
  }
  if (!techniques.length && base.techName && base.techType && base.techType !== "NORMAL") {
    techniques = [{ name: base.techName, type: base.techType }];
  }
  const first = techniques[0] || {};
  const baseId = base.id || `${base.name.toLowerCase()}-${(base.role || "MC").toLowerCase()}`;
  const boost = tier.boost;
  return {
    ...JSON.parse(JSON.stringify(base)),
    id: `${baseId}::${tier.name.toLowerCase()}`,
    characterBaseId: baseId,
    rarity: tier.name,
    rarityColor: tier.color,
    variantLabel: `${tier.name.charAt(0)}${tier.name.slice(1).toLowerCase()}`,
    rating: Math.min(99, (Number(base.rating) || 70) + boost),
    shot: Math.min(99, (Number(base.shot) || 60) + Math.round(boost * 0.8)),
    speed: Math.min(2.5, (Number(base.speed) || 1.5) + boost * 0.008),
    maxPt: (Number(base.maxPt || base.pt) || 90) + boost * 2,
    pt: (Number(base.maxPt || base.pt) || 90) + boost * 2,
    ptCost: Math.max(25, (Number(base.ptCost) || 35) - Math.floor(boost / 5)),
    techniques,
    techName: first.name || base.techName,
    techType: first.type || base.techType,
    selectedTechniqueName: first.name || base.techName
  };
}


// Identidad de carta: mismo personaje + misma rareza.
function getCharacterBaseKey(player) {
  if (!player) return "";
  if (player.characterBaseId) return String(player.characterBaseId);
  const id = String(player.id || `${(player.name || "").toLowerCase()}-${(player.role || "MC").toLowerCase()}`);
  return id.split("::")[0];
}

function getCharacterCardKey(player) {
  const rarity = String(player && player.rarity || "COMÚN").toUpperCase();
  return `${getCharacterBaseKey(player)}::${rarity}`;
}

function getUnownedGachaCharacters(tier) {
  const owned = new Set(squad.map(getCharacterCardKey));
  return DATABASE.filter(player => !owned.has(`${getCharacterBaseKey(player)}::${tier.name}`));
}

function startGachaAnimation() {
  if (matchTickets < 1) {
    message("Necesitas un ticket. Termina un partido para conseguirlo.", 2200);
    return;
  }

  let ticketCost = 1;
  let guaranteedEpic = false;
  if (matchTickets >= 5) {
    guaranteedEpic = confirm("¡Tienes 5 tickets! Pulsa Aceptar para gastar 5 tickets y garantizar un personaje ÉPICO o mejor. Pulsa Cancelar para hacer una tirada normal por 1 ticket.");
    ticketCost = guaranteedEpic ? 5 : 1;
  } else {
    const accepted = confirm("¿Quieres canjear 1 ticket para realizar una tirada?");
    if (!accepted) return;
  }

  matchTickets -= ticketCost;
  saveCareer();
  updateTickets();

  // Solo se excluye la combinación exacta personaje + rareza que ya posees.
  // Si tienes a Mark común, sus versiones raras/épicas/etc. siguen disponibles.
  const minTierIndex = guaranteedEpic ? 2 : 0;
  const availableTiers = RARITY_TIERS.slice(minTierIndex).map(tier => ({
    tier, candidates: getUnownedGachaCharacters(tier)
  })).filter(entry => entry.candidates.length > 0);
  if (!availableTiers.length) {
    matchTickets += ticketCost;
    saveCareer();
    updateTickets();
    message("¡Ya tienes todas las cartas disponibles de estas rarezas! Se han devuelto tus tickets.", 2600);
    return;
  }
  const totalChance = availableTiers.reduce((sum, entry) => sum + entry.tier.chance, 0);
  let rarityRoll = Math.random() * totalChance;
  let selectedTier = availableTiers[0];
  for (const entry of availableTiers) {
    rarityRoll -= entry.tier.chance;
    if (rarityRoll < 0) { selectedTier = entry; break; }
  }
  const tier = selectedTier.tier;
  const candidates = selectedTier.candidates;
  const weighted = [];
  candidates.forEach(player => {
    const rating = Number(player.rating) || 70;
    const weight = rating >= 90 ? 1 : rating >= 85 ? 3 : rating >= 80 ? 6 : rating >= 75 ? 10 : 14;
    for (let i = 0; i < weight; i++) weighted.push(player);
  });
  const baseChosen = weighted[Math.floor(Math.random() * weighted.length)] || candidates[0];
  const chosen = makeRarityCard(baseChosen, tier);
  currentGachaPlayer = JSON.parse(JSON.stringify(chosen));
  gachaRevealed = false;

  document.getElementById("packBox").classList.remove("reveal");
  document.getElementById("gachaCloseBtn").style.display = "none";
  document.getElementById("packCardContent").innerHTML = `
    <div style="font-size:48px">⚡</div>
    <b>¿QUIÉN SERÁ?</b>
    <small>${guaranteedEpic ? "¡Personaje ÉPICO o superior garantizado!" : "Tu nuevo fichaje está a punto de llegar..."}</small>
  `;
  document.getElementById("gachaModal").style.display = "flex";
}

function revealGachaCard() {
  if (!currentGachaPlayer || gachaRevealed) return;

  gachaRevealed = true;

  const p = currentGachaPlayer;
  const box = document.getElementById("packBox");
  const flash = document.getElementById("gachaFlash");

  flash.style.opacity = "1";
  setTimeout(() => flash.style.opacity = "0", 250);

  box.classList.add("reveal");

  document.getElementById("packCardContent").innerHTML = `
    <div style="
      font-size:42px;
      margin-bottom:8px;
      filter:drop-shadow(0 0 8px #ffdf57)
    ">${p.emoji || "⚽"}</div>

    <div style="
      display:inline-block;padding:5px 13px;border-radius:20px;
      border:2px solid ${p.rarityColor};color:${p.rarityColor};
      font-size:13px;font-weight:900;letter-spacing:1px;margin-bottom:7px
    ">${p.rarity}</div>
    <div style="
      color:#ffdf57;
      font-size:32px;
      font-weight:900
    ">${p.rating}</div>

    <b style="font-size:17px">${p.name}</b>
    <p style="margin:7px 0;color:#ffe16a">
      ${p.role} · ${p.rarity}${p.team ? ` · ${p.team}` : ""} · ${p.techType}
    </p>

    <div style="
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:5px;
      font-size:11px;
      text-align:left;
      margin-top:8px
    ">
      <span>VELOCIDAD</span><b>${Math.round(p.speed * 40)}</b>
      <span>TIRO</span><b>${p.shot}</b>
      <span>PT</span><b>${p.maxPt}</b>
      <span>TÉCNICAS</span><b>${(p.techniques || (p.techName ? [{name:p.techName,type:p.techType}] : [])).map(t => t.name).join(", ") || "Sin supertécnicas registradas"}</b>
    </div>
  `;

  document.getElementById("gachaCloseBtn").style.display = "block";
}

function closeGachaModal() {
  if (!currentGachaPlayer || !gachaRevealed) return;

  addPlayerToSquad(currentGachaPlayer);

  document.getElementById("gachaModal").style.display = "none";
  document.getElementById("packResult").innerHTML = `
    <div class="card" style="margin-top:15px">
      <div class="portrait">${currentGachaPlayer.emoji || "⚽"}</div>
      <b>${currentGachaPlayer.name}</b>
      <small style="color:${currentGachaPlayer.rarityColor || "#fff"}">${currentGachaPlayer.rarity || "COMÚN"} · ${currentGachaPlayer.role} · GRL ${currentGachaPlayer.rating}${currentGachaPlayer.team ? ` · ${currentGachaPlayer.team}` : ""}</small>
    </div>
  `;

  currentGachaPlayer = null;
  gachaRevealed = false;
}