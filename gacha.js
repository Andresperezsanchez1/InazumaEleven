"use strict";

let currentGachaPlayer = null;
let gachaRevealed = false;

function startGachaAnimation() {
  const price = 100;

  if (coins < price) {
    message("¡No tienes suficientes monedas!", 1200);
    return;
  }

  const accepted = confirm(
    `¿Quieres comprar un sobre por ${price} monedas?`
  );

  if (!accepted) return;

  coins -= price;
  updateCoins();

  // Se elige un jugador aleatorio de la base de datos.
  const available = DATABASE.filter(p =>
    !squad.some(s => s.name === p.name)
  );

  const pool = available.length ? available : DATABASE;
  currentGachaPlayer = JSON.parse(
    JSON.stringify(pool[Math.floor(Math.random() * pool.length)])
  );

  gachaRevealed = false;

  document.getElementById("packBox").classList.remove("reveal");
  document.getElementById("gachaCloseBtn").style.display = "none";
  document.getElementById("packCardContent").innerHTML = `
    <div style="font-size:48px">⚡</div>
    <b>¿QUIÉN SERÁ?</b>
    <small>La nueva estrella de Raimon</small>
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
      color:#ffdf57;
      font-size:32px;
      font-weight:900
    ">${p.rating}</div>

    <b style="font-size:17px">${p.name}</b>
    <p style="margin:7px 0;color:#ffe16a">
      ${p.role} · ${p.techType}
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
      <span>TÉCNICA</span><b>${p.techName}</b>
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
      <small>${currentGachaPlayer.role} · GRL ${currentGachaPlayer.rating}</small>
    </div>
  `;

  currentGachaPlayer = null;
  gachaRevealed = false;
}