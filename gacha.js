"use strict";

let currentGachaPlayer = null;
let gachaRevealed = false;

// Un personaje solo puede aparecer una vez en toda la colección, sin variantes de rareza.
function getCharacterUniqueKey(player) {
  return String(player && player.name || "").trim().toLocaleLowerCase("es");
}

function getUnownedGachaCharacters() {
  const owned = new Set((Array.isArray(squad) ? squad : []).map(getCharacterUniqueKey));
  const seen = new Set();
  return DATABASE.filter(player => {
    const key = getCharacterUniqueKey(player);
    if (!key || owned.has(key) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function startGachaAnimation() {
  if (matchTickets < 1) {
    message("Necesitas un ticket. Termina un partido para conseguirlo.", 2200);
    return;
  }

  const candidates = getUnownedGachaCharacters();
  if (!candidates.length) {
    message("¡Ya has conseguido todos los personajes disponibles!", 2600);
    return;
  }

  const accepted = confirm("¿Quieres canjear 1 ticket para fichar un personaje nuevo?");
  if (!accepted) return;

  matchTickets -= 1;
  saveCareer();
  updateTickets();

  // Se mantiene una probabilidad ponderada por valoración, sin rarezas ni versiones alternativas.
  const weighted = [];
  candidates.forEach(player => {
    const rating = Number(player.rating) || 70;
    const weight = rating >= 90 ? 1 : rating >= 85 ? 3 : rating >= 80 ? 6 : rating >= 75 ? 10 : 14;
    for (let i = 0; i < weight; i++) weighted.push(player);
  });

  const chosen = JSON.parse(JSON.stringify(weighted[Math.floor(Math.random() * weighted.length)] || candidates[0]));
  delete chosen.rarity;
  delete chosen.rarityColor;
  delete chosen.variantLabel;
  delete chosen.characterBaseId;
  currentGachaPlayer = chosen;
  gachaRevealed = false;

  document.getElementById("packBox").classList.remove("reveal");
  document.getElementById("gachaCloseBtn").style.display = "none";
  document.getElementById("packCardContent").innerHTML = `
    <div style="font-size:48px">⚡</div>
    <b>¿QUIÉN SERÁ?</b>
    <small>¡Un nuevo jugador está a punto de llegar!</small>
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
    <div style="font-size:42px;margin-bottom:8px;filter:drop-shadow(0 0 8px #ffdf57)">${p.emoji || "⚽"}</div>
    <div style="color:#ffdf57;font-size:32px;font-weight:900">${p.rating || 70}</div>
    <b style="font-size:17px">${p.name}</b>
    <p style="margin:7px 0;color:#ffe16a">${p.role}${p.team ? ` · ${p.team}` : ""} · ${p.techType || "ESPECIAL"}</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;font-size:11px;text-align:left;margin-top:8px">
      <span>VELOCIDAD</span><b>${Math.round((p.speed || 1.5) * 40)}</b>
      <span>TIRO</span><b>${p.shot || 60}</b>
      <span>PT</span><b>${p.maxPt || p.pt || 90}</b>
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
      <small>${currentGachaPlayer.role} · GRL ${currentGachaPlayer.rating}${currentGachaPlayer.team ? ` · ${currentGachaPlayer.team}` : ""}</small>
    </div>
  `;
  currentGachaPlayer = null;
  gachaRevealed = false;
}
