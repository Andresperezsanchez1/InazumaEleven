"use strict";

let selectedStarter = null;

function updateCoins() {
  const el = document.getElementById("coins");
  if (el) el.textContent = coins;
}

function renderTeam() {
  const container = document.getElementById("teamCards");
  if (!container) return;

  let html = `
    <div class="squad-section">
      <h3 style="color:#ffdc53">⭐ TITULARES</h3>
      <div class="cards">
  `;

  const techniqueText = p => (p.techniques || (p.techName ? [{name:p.techName,type:p.techType}] : []))
    .map(t => `${t.name}${t.type ? ` · ${t.type}` : ""}`).join("<br>");

  squad.slice(0, 5).forEach((p, i) => {
    html += `
      <div class="card" onclick="selectStarter(${i})"
           style="${selectedStarter === i ? "border-color:#00eaff;box-shadow:0 0 12px #00eaff" : ""}">
        <div class="portrait">${p.emoji || "⚽"}</div>
        <b>${p.name}</b>
        <small>${p.role} · GRL ${p.rating}</small>
        <p style="font-size:11px">PT: ${p.maxPt} · ${p.techType}</p>
        <p class="player-tech-list"><b>TÉCNICAS</b><br>${techniqueText(p) || "Sin supertécnicas registradas"}</p>
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
      <h3 style="color:#78b8ff">🔄 SUPLENTES (${Math.max(0, squad.length - 5)})</h3>
      <div class="cards">
  `;

  if (squad.length <= 5) {
    html += `<p>No tienes suplentes todavía. ¡Abre sobres en el Gacha!</p>`;
  } else {
    squad.slice(5).forEach((p, i) => {
      html += `
        <div class="bench-card" onclick="swapWithBench(${i + 5})">
          <div style="font-size:30px">${p.emoji || "⚽"}</div>
          <b>${p.name}</b>
          <span>${p.variantLabel ? `${p.variantLabel} · ` : ""}${p.role} · GRL ${p.rating}</span>
          <p class="player-tech-list">${techniqueText(p) || "Sin supertécnicas registradas"}</p>
          <p style="color:#9fc7f3;font-size:10px">
            ${selectedStarter === null ? "Selecciona un titular primero" : "PULSA PARA CAMBIAR"}
          </p>
        </div>
      `;
    });
  }

  html += `</div></div>`;
  container.innerHTML = html;
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

  selectedStarter = null;

  makePlayers();
  renderTeam();

  message("¡Alineación actualizada!", 1000);
}

function addPlayerToSquad(player) {
  if (!player) return;

  const playerKey = player.id || `${player.name.toLowerCase()}-${(player.role || "MC").toLowerCase()}`;
  const duplicate = squad.some(p => (p.id || `${p.name.toLowerCase()}-${(p.role || "MC").toLowerCase()}`) === playerKey);

  if (duplicate) {
    const value = Math.max(20, Math.round(player.rating * 3));
    coins += value;
    updateCoins();
    message(`${player.name} repetido: vendido por ${value} monedas`, 1800);
    return;
  }

  squad.push(JSON.parse(JSON.stringify(player)));

  renderTeam();
  message(`¡${player.name} se une al equipo!`, 1500);
}