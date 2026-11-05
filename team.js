"use strict";

let selectedStarter = null;

function updateCoins() {
  const el = document.getElementById("coins");
  if (el) el.textContent = coins;
  if (typeof saveCareer === "function") saveCareer();
}

function updateTickets() {
  const el = document.getElementById("tickets");
  const info = document.getElementById("ticketShopInfo");
  if (el) el.textContent = matchTickets;
  if (info) info.textContent = `Tickets disponibles: ${matchTickets}`;
  const btn = document.getElementById("openPackBtn");
  if (btn) btn.disabled = matchTickets < 1;
}

// La tienda entrega exactamente un ticket gratis por cada pulsación.
function claimShopTicket() {
  matchTickets += 1;
  saveCareer();
  updateTickets();
  message("¡La tienda te ha regalado 1 ticket!", 1800);
}

function renderTeam() {
  const container = document.getElementById("teamCards");
  if (!container) return;

  let html = `
    <div class="squad-section">
      <h3 style="color:#ffdc53">⭐ TITULARES</h3>
      <div class="cards">
  `;

  const techniquesOf = p => p.techniques || (p.techName ? [{name:p.techName,type:p.techType}] : []);
  const techniqueText = p => techniquesOf(p)
    .map(t => `${t.name}${t.type ? ` · ${t.type}` : ""}`).join("<br>");
  const techniqueConfig = (p, playerIndex) => {
    const list = techniquesOf(p);
    if (!list.length) return '<p class="tech-config-empty">Sin técnicas para configurar</p>';
    const selected = p.selectedTechniqueName || list[0].name;
    return `<div class="team-tech-config" onclick="event.stopPropagation()">
      <label class="team-tech-label" for="teamTechnique${playerIndex}">⚡ SUPERTÉCNICA EQUIPADA</label>
      <small>Elige aquí la técnica que utilizará este jugador durante el partido.</small>
      <select class="team-tech-select" id="teamTechnique${playerIndex}"
        onchange='setPlayerTechnique(${playerIndex}, this.value)'>
        ${list.map(t => `<option value="${t.name.replace(/&/g,"&amp;").replace(/"/g,"&quot;")}" ${t.name === selected ? "selected" : ""}>${t.name} · ${t.type || "ESPECIAL"}</option>`).join("")}
      </select>
    </div>`;
  };

  squad.slice(0, 5).forEach((p, i) => {
    html += `
      <div class="card" onclick="selectStarter(${i})"
           style="${selectedStarter === i ? "border-color:#00eaff;box-shadow:0 0 12px #00eaff" : ""}">
        <div class="portrait">${p.emoji || "⚽"}</div>
        <b>${p.name}</b>
        <small><span class="rarity-label" style="color:${p.rarityColor || "#b8c2cc"};border-color:${p.rarityColor || "#b8c2cc"}">${p.rarity || "COMÚN"}</span> ${p.role} · GRL ${p.rating}${p.team ? ` · ${p.team}` : ""}</small>
        <p style="font-size:11px">PT: ${p.maxPt} · ${p.techType}</p>
        <p class="player-tech-list"><b>TÉCNICAS DISPONIBLES</b><br>${techniqueText(p) || "Sin supertécnicas registradas"}</p>
        ${techniqueConfig(p, i)}
        <button class="actionBtn" style="padding:6px;font-size:10px">
          ${selectedStarter === i ? "SELECCIONADO" : "SELECCIONAR"}
        </button>
      </div>
    `;
  });

  html += `
      </div>
    </div>
    <div class="squad-section">
      <h3 style="color:#78b8ff">🔄 CAMBIAR JUGADOR</h3>
      <div class="cards">
  `;

  if (selectedStarter === null) {
    html += `<p class="bench-empty">Tu equipo titular aparece arriba. Selecciona un titular para ver únicamente los suplentes de su misma posición.</p>`;
  } else {
    const selectedPlayer = squad[selectedStarter];
    const compatibleBench = squad
      .map((player, index) => ({ player, index }))
      .filter(item => item.index >= 5 && item.player.role === selectedPlayer.role);

    html += `<p class="bench-filter-info">Cambiando a <b>${selectedPlayer.name}</b> (${selectedPlayer.role}). Solo se muestran jugadores de la misma posición.</p>`;

    if (!compatibleBench.length) {
      html += `<p class="bench-empty">No tienes suplentes disponibles para la posición ${selectedPlayer.role}.</p>`;
    } else {
      compatibleBench.forEach(({ player: p, index }) => {
        html += `
          <div class="bench-card" onclick="swapWithBench(${index})">
            <div style="font-size:30px">${p.emoji || "⚽"}</div>
            <b>${p.name}</b>
            <span><span class="rarity-label" style="color:${p.rarityColor || "#b8c2cc"};border-color:${p.rarityColor || "#b8c2cc"}">${p.rarity || "COMÚN"}</span> ${p.role} · GRL ${p.rating}${p.team ? ` · ${p.team}` : ""}</span>
            <p class="player-tech-list">${techniqueText(p) || "Sin supertécnicas registradas"}</p>
            ${techniqueConfig(p, index)}
            <p style="color:#9fc7f3;font-size:10px">PULSA PARA CAMBIAR POR ${selectedPlayer.name.toUpperCase()}</p>
          </div>
        `;
      });
    }
  }

  html += `</div></div>`;
  container.innerHTML = html;
}


function setPlayerTechnique(playerIndex, techniqueName) {
  const player = squad[playerIndex];
  if (!player) return;
  const techniques = player.techniques || (player.techName ? [{name:player.techName,type:player.techType}] : []);
  const selected = techniques.find(t => t.name === techniqueName);
  if (!selected) return;
  player.selectedTechniqueName = selected.name;
  saveCareer();
  renderTeam();
  message(`${selected.name} equipada para ${player.name}`, 1200);
}

function selectStarter(index) {
  selectedStarter = index;
  renderTeam();
}

function swapWithBench(benchIndex) {
  if (selectedStarter === null) {
    message("Primero selecciona un titular", 1000);
    return;
  }

  if (benchIndex < 5 || benchIndex >= squad.length) return;

  const starter = squad[selectedStarter];
  const substitute = squad[benchIndex];

  // No se permiten cambios entre posiciones diferentes.
  if (starter.role !== substitute.role) {
    message(`Solo puedes cambiar ${starter.role} por otro ${starter.role}`, 1400);
    return;
  }

  const temp = squad[selectedStarter];
  squad[selectedStarter] = squad[benchIndex];
  squad[benchIndex] = temp;
  saveCareer();

  selectedStarter = null;

  makePlayers();
  renderTeam();

  message("¡Alineación actualizada!", 1000);
}

function addPlayerToSquad(player) {
  if (!player) return;

  const baseKey = p => p.characterBaseId || String(p.id || `${(p.name || "").toLowerCase()}-${(p.role || "MC").toLowerCase()}`).split("::")[0];
  const cardKey = `${baseKey(player)}::${String(player.rarity || "COMÚN").toUpperCase()}`;
  const duplicate = squad.some(p => `${baseKey(p)}::${String(p.rarity || "COMÚN").toUpperCase()}` === cardKey);

  if (duplicate) {
    message(`${player.name} ${player.rarity || "COMÚN"} ya está en tu plantilla. No se puede repetir esa carta.`, 1800);
    return;
  }

  squad.push(JSON.parse(JSON.stringify(player)));
  saveCareer();

  renderTeam();
  message(`¡${player.name} se une al equipo!`, 1500);
}